"""Compras S3-A: fornecedor qualificado, cotação e pedido com entrega direta.

Todas as consultas e escritas são limitadas à unidade, ao CC, ao papel e à flag.
"""
from __future__ import annotations

import hashlib
import os
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
from pathlib import Path
from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile
from fastapi.encoders import jsonable_encoder
from fastapi.responses import FileResponse, Response
from sqlalchemy import and_, func, insert, or_, select, text, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..auth import Actor, check_action, context, current_actor
from ..db import session, table
from ..ids import uuid7
from ..workflow import approval_levels, change, estimate, get_request, record_event
from .cadastros import cnpj_valid
from .solicitacoes import upload_root

router = APIRouter(prefix="/api/suprimentos/compras", tags=["Compras S3-A"])
UTC = timezone.utc
CENT = Decimal("0.01")
WEIGHTS = {"prazo": 30, "quantidade": 20, "qualidade": 30,
           "documentacao": 10, "atendimento": 10}
SUPPLIER_STATES = {"EM_QUALIFICACAO", "HOMOLOGADO", "HOMOLOGADO_CONDICIONAL",
                   "REPROVADO", "SUSPENSO", "BLOQUEADO"}
DOC_TYPES = {"CARTAO_CNPJ", "CONTRATO_SOCIAL", "CERTIDAO", "ISO", "FDS", "CA",
             "LICENCA_AMBIENTAL", "TITULO_ANM", "LAUDO", "OUTRO"}


@router.get("/resumo")
def summary(unidade: str = "campinas", user: Actor = Depends(current_actor),
            db: Session = Depends(session)):
    ctx = gate(db, user, unidade, "fornecedor.ver")
    orders, docs, profiles = (table(name) for name in
        ("sup_pedido", "sup_fornecedor_documento", "sup_fornecedor_unidade"))
    open_status = ("RASCUNHO", "REAPROVACAO", "EMITIDO", "ENVIADO", "PARCIAL")
    base = and_(orders.c.unidade_id == ctx.unit_id, orders.c.status.in_(open_status))
    open_count = db.execute(select(func.count()).select_from(orders).where(base)).scalar_one()
    late_count = db.execute(select(func.count()).select_from(orders).where(and_(
        base, orders.c.entrega_prevista < date.today()))).scalar_one()
    expiring = db.execute(select(func.count()).select_from(docs).where(and_(
        docs.c.unidade_id == ctx.unit_id, docs.c.ativo.is_(True),
        docs.c.validade <= date.today()+timedelta(days=30)))).scalar_one()
    pending = db.execute(select(func.count()).select_from(profiles).where(and_(
        profiles.c.unidade_id == ctx.unit_id, profiles.c.ativo.is_(True),
        profiles.c.situacao == "EM_QUALIFICACAO"))).scalar_one()
    return {"pedidos_abertos": open_count, "pedidos_atrasados": late_count,
            "documentos_vencendo": expiring, "homologacoes_pendentes": pending}


def ident(value: str, what: str = "Registro") -> UUID:
    try:
        return UUID(value)
    except (ValueError, TypeError):
        raise HTTPException(404, f"{what} não encontrado") from None


def amount(value, label: str, *, positive: bool = False) -> Decimal:
    try:
        result = Decimal(str(value).replace(",", "."))
        if not result.is_finite() or result < 0 or (positive and result == 0):
            raise InvalidOperation()
        return result
    except (InvalidOperation, TypeError):
        raise HTTPException(422, f"{label} inválido") from None


def money(value) -> Decimal:
    return Decimal(value).quantize(CENT, rounding=ROUND_HALF_UP)


def gate(db: Session, user: Actor, unidade: str, action: str, cc_id: str | None = None):
    ctx = context(unidade, user, db)
    # A flag vale também para leitura; check_action usa write=True para aplicá-la.
    check_action(ctx, action, cc_id, write=True, phase="S3A", db=db)
    return ctx


def audit(user: Actor):
    return {"criado_por": user.id, "atualizado_por": user.id}


def changed(user: Actor):
    return {"atualizado_por": user.id, "atualizado_em": datetime.now(UTC)}


def supplier(db: Session, ctx, supplier_id: str, *, lock: bool = False):
    profile = table("sup_fornecedor_unidade")
    query = select(profile).where(and_(profile.c.id == ident(supplier_id, "Fornecedor"),
                                       profile.c.unidade_id == ctx.unit_id,
                                       profile.c.ativo.is_(True)))
    if lock:
        query = query.with_for_update()
    row = db.execute(query).mappings().one_or_none()
    if not row:
        raise HTTPException(404, "Fornecedor não encontrado nesta unidade")
    return dict(row)


def supplier_ok(profile: dict, *, emergency: bool = False):
    today = date.today()
    valid = profile["situacao"] in {"HOMOLOGADO", "HOMOLOGADO_CONDICIONAL"}
    if profile["homologado_ate"] and profile["homologado_ate"] < today:
        valid = False
    if profile["situacao"] == "HOMOLOGADO_CONDICIONAL" and (
            not profile["condicional_ate"] or profile["condicional_ate"] < today):
        valid = False
    if not valid and not emergency:
        raise HTTPException(409, "Fornecedor sem homologação vigente; solicite exceção à Qualidade")


def iqf_band(db: Session, ctx, value) -> str | None:
    if value is None:
        return None
    params = table("sup_parametro")
    rows = db.execute(select(params.c.chave, params.c.valor).where(and_(
        params.c.unidade_id == ctx.unit_id,
        params.c.chave.in_(("iqf_faixa_a", "iqf_faixa_b", "iqf_faixa_c")),
        params.c.ativo.is_(True)))).all()
    limits = dict(rows)
    if len(limits) != 3 or not (limits["iqf_faixa_a"] > limits["iqf_faixa_b"] > limits["iqf_faixa_c"]):
        raise HTTPException(409, "Faixas do IQF não configuradas corretamente")
    score = Decimal(value)
    return next((band for band, key in (("A", "iqf_faixa_a"),
            ("B", "iqf_faixa_b"), ("C", "iqf_faixa_c")) if score >= limits[key]), "D")


def supplier_detail(db: Session, ctx, profile: dict):
    base = table("sup_fornecedor")
    doc = table("sup_fornecedor_documento")
    homolog = table("sup_fornecedor_homologacao")
    evaluation = table("sup_fornecedor_avaliacao")
    order = table("sup_pedido")
    company = db.execute(select(base).where(base.c.id == profile["fornecedor_id"])).mappings().one()
    documents = db.execute(select(doc.c.id, doc.c.tipo, doc.c.nome_original, doc.c.validade,
                                  doc.c.tamanho, doc.c.criado_em)
                           .where(and_(doc.c.unidade_id == ctx.unit_id,
                                       doc.c.fornecedor_unidade_id == profile["id"],
                                       doc.c.ativo.is_(True)))).mappings().all()
    decisions = db.execute(select(homolog).where(and_(homolog.c.unidade_id == ctx.unit_id,
        homolog.c.fornecedor_unidade_id == profile["id"])).order_by(homolog.c.criado_em.desc()).limit(30)).mappings().all()
    reviews = db.execute(select(evaluation).where(and_(evaluation.c.unidade_id == ctx.unit_id,
        evaluation.c.fornecedor_unidade_id == profile["id"])).order_by(evaluation.c.avaliado_em.desc()).limit(50)).mappings().all()
    orders = db.execute(select(order.c.id, order.c.numero, order.c.valor_total, order.c.status,
                               order.c.entrega_prevista, order.c.criado_em)
                        .where(and_(order.c.unidade_id == ctx.unit_id,
                                    order.c.fornecedor_unidade_id == profile["id"]))
                        .order_by(order.c.criado_em.desc()).limit(50)).mappings().all()
    return jsonable_encoder({**company, **profile, "faixa": iqf_band(db, ctx, profile["iqf"]),
                             "documentos": [dict(x) for x in documents],
                             "homologacoes": [dict(x) for x in decisions],
                             "avaliacoes": [dict(x) for x in reviews],
                             "pedidos": [dict(x) for x in orders]})


@router.get("/fornecedores")
def list_suppliers(unidade: str = "campinas", q: str = "", situacao: str | None = None,
                   categoria: str | None = None, iqf_min: float | None = None,
                   documento_vencendo: bool = False, page: int = Query(1, ge=1),
                   size: int = Query(25, ge=1, le=100),
                   user: Actor = Depends(current_actor), db: Session = Depends(session)):
    ctx = gate(db, user, unidade, "fornecedor.ver")
    profile, base, doc, order = (table(x) for x in
        ("sup_fornecedor_unidade", "sup_fornecedor", "sup_fornecedor_documento", "sup_pedido"))
    conditions = [profile.c.unidade_id == ctx.unit_id, profile.c.ativo.is_(True)]
    if q:
        conditions.append(or_(base.c.razao.ilike(f"%{q[:100]}%"),
                              profile.c.fantasia.ilike(f"%{q[:100]}%"), base.c.cnpj.ilike(f"%{q[:100]}%")))
    if situacao:
        if situacao not in SUPPLIER_STATES:
            raise HTTPException(422, "Situação inválida")
        conditions.append(profile.c.situacao == situacao)
    if categoria:
        conditions.append(base.c.categorias.any(categoria[:80]))
    if iqf_min is not None:
        conditions.append(profile.c.iqf >= iqf_min)
    if documento_vencendo:
        soon = date.today() + timedelta(days=30)
        conditions.append(select(doc.c.id).where(and_(doc.c.unidade_id == ctx.unit_id,
            doc.c.fornecedor_unidade_id == profile.c.id, doc.c.ativo.is_(True),
            doc.c.validade <= soon)).exists())
    stmt = select(profile, base.c.cnpj, base.c.razao, base.c.categorias).join(
        base, base.c.id == profile.c.fornecedor_id).where(and_(*conditions))
    total = db.execute(select(func.count()).select_from(profile).join(
        base, base.c.id == profile.c.fornecedor_id).where(and_(*conditions))).scalar_one()
    rows = db.execute(stmt.order_by(base.c.razao).limit(size).offset((page-1)*size)).mappings().all()
    response = []
    for row in rows:
        item = dict(row)
        last = db.execute(select(func.max(order.c.criado_em)).where(and_(order.c.unidade_id == ctx.unit_id,
            order.c.fornecedor_unidade_id == row["id"]))).scalar_one_or_none()
        item["ultima_compra"] = last
        response.append(item)
    return {"total": total, "page": page, "size": size, "items": jsonable_encoder(response)}


@router.post("/fornecedores", status_code=201)
def create_supplier(data: dict, unidade: str = "campinas", user: Actor = Depends(current_actor),
                    db: Session = Depends(session)):
    ctx = gate(db, user, unidade, "fornecedor.editar")
    if not isinstance(data, dict) or not cnpj_valid(str(data.get("cnpj", ""))) or not str(data.get("razao", "")).strip():
        raise HTTPException(422, "CNPJ com dígito verificador e razão social são obrigatórios")
    categories = data.get("categorias", [])
    if not isinstance(categories, list) or not all(isinstance(x, str) for x in categories):
        raise HTTPException(422, "Categorias inválidas")
    base = table("sup_fornecedor")
    profile = table("sup_fornecedor_unidade")
    cnpj = data["cnpj"]
    company = db.execute(select(base).where(base.c.cnpj == cnpj)).mappings().one_or_none()
    try:
        if company is None:
            company_id = uuid7()
            db.execute(insert(base).values(id=company_id, cnpj=cnpj, razao=data["razao"].strip(),
                categorias=categories, **audit(user)))
        else:
            company_id = company["id"]
            if db.execute(select(profile.c.id).where(and_(profile.c.unidade_id == ctx.unit_id,
                    profile.c.fornecedor_id == company_id))).scalar_one_or_none():
                raise HTTPException(409, "Fornecedor já cadastrado em Campinas")
        profile_id = uuid7()
        values = {key: data[key] for key in ("fantasia", "ie", "endereco", "contatos", "email_pedido",
                  "condicao_pagamento", "prazo_padrao_dias", "frete_padrao", "transportadora", "observacoes")
                  if key in data}
        db.execute(insert(profile).values(id=profile_id, unidade_id=ctx.unit_id,
                    fornecedor_id=company_id, **values, **audit(user)))
        record_event(db, ctx, profile_id, None, "EM_QUALIFICACAO", target_type="fornecedor")
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, "Fornecedor duplicado ou dados inválidos") from None
    return supplier_detail(db, ctx, supplier(db, ctx, str(profile_id)))


@router.get("/fornecedores/{supplier_id}")
def get_supplier(supplier_id: str, unidade: str = "campinas", user: Actor = Depends(current_actor),
                 db: Session = Depends(session)):
    ctx = gate(db, user, unidade, "fornecedor.ver")
    return supplier_detail(db, ctx, supplier(db, ctx, supplier_id))


@router.patch("/fornecedores/{supplier_id}")
def edit_supplier(supplier_id: str, data: dict, unidade: str = "campinas",
                  user: Actor = Depends(current_actor), db: Session = Depends(session)):
    ctx = gate(db, user, unidade, "fornecedor.editar")
    row = supplier(db, ctx, supplier_id, lock=True)
    allowed = {"fantasia", "ie", "endereco", "contatos", "email_pedido", "condicao_pagamento",
               "prazo_padrao_dias", "frete_padrao", "transportadora", "observacoes"}
    if not isinstance(data, dict) or not data or set(data) - allowed:
        raise HTTPException(422, "Campos inválidos")
    db.execute(update(table("sup_fornecedor_unidade")).where(
        table("sup_fornecedor_unidade").c.id == row["id"]).values(**data, **changed(user)))
    record_event(db, ctx, row["id"], row["situacao"], row["situacao"],
                 "Ficha cadastral atualizada", target_type="fornecedor")
    db.commit()
    return supplier_detail(db, ctx, supplier(db, ctx, supplier_id))


def private_file(db: Session, ctx, parent_id: UUID, upload: UploadFile, content: bytes,
                 category: str) -> tuple[Path, str, str]:
    mime = upload.content_type or "application/octet-stream"
    if mime not in {"application/pdf", "image/jpeg", "image/png"}:
        raise HTTPException(422, "Anexe PDF, JPG ou PNG")
    if mime == "application/pdf" and not content.startswith(b"%PDF-"):
        raise HTTPException(422, "PDF inválido")
    if mime == "image/jpeg" and not content.startswith(b"\xff\xd8\xff"):
        raise HTTPException(422, "JPEG inválido")
    if mime == "image/png" and not content.startswith(b"\x89PNG\r\n\x1a\n"):
        raise HTTPException(422, "PNG inválido")
    digest = hashlib.sha256(content).hexdigest()
    folder = upload_root() / category / str(ctx.unit_id) / str(parent_id)
    folder.mkdir(parents=True, exist_ok=True, mode=0o700)
    path = folder / str(uuid7())
    with path.open("xb") as stream:
        stream.write(content)
    path.chmod(0o600)
    return path, digest, mime


@router.post("/fornecedores/{supplier_id}/documentos", status_code=201)
async def add_supplier_doc(supplier_id: str, tipo: str = Form(...), validade: str | None = Form(None),
                           arquivo: UploadFile = File(...), unidade: str = "campinas",
                           user: Actor = Depends(current_actor), db: Session = Depends(session)):
    ctx = gate(db, user, unidade, "fornecedor.editar")
    row = supplier(db, ctx, supplier_id)
    if tipo not in DOC_TYPES:
        raise HTTPException(422, "Tipo de documento inválido")
    try:
        expiry = date.fromisoformat(validade) if validade else None
    except ValueError:
        raise HTTPException(422, "Validade inválida") from None
    content = await arquivo.read(12_582_913)
    if not 0 < len(content) <= 12_582_912:
        raise HTTPException(413, "Documento deve ter até 12 MB")
    path, digest, mime = private_file(db, ctx, row["id"], arquivo, content, "fornecedores")
    doc = table("sup_fornecedor_documento")
    doc_id = uuid7()
    try:
        db.execute(insert(doc).values(id=doc_id, unidade_id=ctx.unit_id,
          fornecedor_unidade_id=row["id"], tipo=tipo, validade=expiry,
          storage_path=str(path), sha256=digest, tamanho=len(content), mime=mime,
          nome_original=Path(arquivo.filename or "documento").name[:120], **audit(user)))
        record_event(db, ctx, row["id"], row["situacao"], row["situacao"],
                     f"Documento {tipo} incluído", target_type="fornecedor")
        db.commit()
    except Exception:
        db.rollback()
        path.unlink(missing_ok=True)
        raise
    return {"id": str(doc_id), "sha256": digest}


@router.get("/fornecedores/{supplier_id}/documentos/{doc_id}")
def supplier_doc(supplier_id: str, doc_id: str, unidade: str = "campinas",
                 user: Actor = Depends(current_actor), db: Session = Depends(session)):
    ctx = gate(db, user, unidade, "fornecedor.ver")
    row = supplier(db, ctx, supplier_id)
    doc = table("sup_fornecedor_documento")
    found = db.execute(select(doc).where(and_(doc.c.id == ident(doc_id, "Documento"),
        doc.c.unidade_id == ctx.unit_id, doc.c.fornecedor_unidade_id == row["id"],
        doc.c.ativo.is_(True)))).mappings().one_or_none()
    if not found:
        raise HTTPException(404, "Documento não encontrado")
    path = Path(found["storage_path"]).resolve()
    if upload_root() not in path.parents or not path.is_file():
        raise HTTPException(404, "Documento indisponível")
    return FileResponse(path, media_type=found["mime"], filename=found["nome_original"],
                        headers={"Cache-Control": "private, no-store"})


@router.post("/fornecedores/{supplier_id}/homologar")
def homologate(supplier_id: str, data: dict, unidade: str = "campinas",
               user: Actor = Depends(current_actor), db: Session = Depends(session)):
    ctx = gate(db, user, unidade, "fornecedor.homologar")
    row = supplier(db, ctx, supplier_id, lock=True)
    target = data.get("situacao")
    opinion = str(data.get("parecer") or "").strip()
    if target not in SUPPLIER_STATES - {"EM_QUALIFICACAO"} or not opinion:
        raise HTTPException(422, "Situação e parecer da Qualidade são obrigatórios")
    valid_to = None
    conditional_to = None
    if target == "HOMOLOGADO":
        months = db.execute(select(table("sup_parametro").c.valor).where(and_(
            table("sup_parametro").c.unidade_id == ctx.unit_id,
            table("sup_parametro").c.chave == "homologacao_meses"))).scalar_one()
        valid_to = date.today() + timedelta(days=round(float(months) * 365.25 / 12))
    if target == "HOMOLOGADO_CONDICIONAL":
        try:
            conditional_to = date.fromisoformat(data["condicional_ate"])
        except (KeyError, ValueError, TypeError):
            raise HTTPException(422, "Prazo da homologação condicional obrigatório") from None
        if conditional_to <= date.today() or not str(data.get("pendencias") or "").strip():
            raise HTTPException(422, "Informe prazo futuro e pendências")
        valid_to = conditional_to
    checklist = data.get("checklist", {})
    if not isinstance(checklist, dict):
        raise HTTPException(422, "Checklist inválido")
    if target in {"HOMOLOGADO", "HOMOLOGADO_CONDICIONAL"}:
        required = set()
        criteria = table("sup_fornecedor_criterio")
        company = table("sup_fornecedor")
        categories = db.execute(select(company.c.categorias).where(
            company.c.id == row["fornecedor_id"])).scalar_one()
        for category in categories:
            configured = db.execute(select(criteria).where(and_(
                criteria.c.unidade_id == ctx.unit_id,
                criteria.c.categoria == category,
                criteria.c.ativo.is_(True)))).mappings().one_or_none()
            if configured:
                required.update(configured["documentos"])
                if configured["questionario"] and not checklist.get("questionario"):
                    raise HTTPException(422, "Questionário de qualificação pendente")
                if configured["exige_amostra"] and checklist.get("amostra") is not True:
                    raise HTTPException(422, "Amostra ou ensaio pendente")
        docs = table("sup_fornecedor_documento")
        valid_docs = set(db.execute(select(docs.c.tipo).where(and_(
            docs.c.unidade_id == ctx.unit_id,
            docs.c.fornecedor_unidade_id == row["id"], docs.c.ativo.is_(True),
            or_(docs.c.validade.is_(None), docs.c.validade >= date.today())))).scalars())
        missing = required - valid_docs
        if missing and target == "HOMOLOGADO":
            raise HTTPException(409, "Documentos obrigatórios ausentes ou vencidos: " + ", ".join(sorted(missing)))
        if missing and target == "HOMOLOGADO_CONDICIONAL" and not missing.issubset(set(checklist.get("pendentes", []))):
            raise HTTPException(422, "Liste documentos pendentes no checklist")
    profile = table("sup_fornecedor_unidade")
    db.execute(update(profile).where(profile.c.id == row["id"]).values(
        situacao=target, homologado_ate=valid_to, condicional_ate=conditional_to,
        pendencias=data.get("pendencias"), **changed(user)))
    db.execute(insert(table("sup_fornecedor_homologacao")).values(
        id=uuid7(), unidade_id=ctx.unit_id, fornecedor_unidade_id=row["id"],
        de=row["situacao"], para=target, parecer=opinion, checklist=checklist,
        pendencias=data.get("pendencias"), validade_ate=valid_to,
        por=user.id, por_nome=user.name, **audit(user)))
    record_event(db, ctx, row["id"], row["situacao"], target, opinion,
                 target_type="fornecedor")
    db.commit()
    return supplier_detail(db, ctx, supplier(db, ctx, supplier_id))


@router.get("/criterios")
def list_supplier_criteria(unidade: str = "campinas", user: Actor = Depends(current_actor),
                           db: Session = Depends(session)):
    ctx = gate(db, user, unidade, "fornecedor.ver")
    t = table("sup_fornecedor_criterio")
    return jsonable_encoder([dict(x) for x in db.execute(select(t).where(
        t.c.unidade_id == ctx.unit_id).order_by(t.c.categoria)).mappings()])


@router.put("/criterios/{categoria}")
def put_supplier_criteria(categoria: str, data: dict, unidade: str = "campinas",
                          user: Actor = Depends(current_actor), db: Session = Depends(session)):
    ctx = gate(db, user, unidade, "fornecedor.homologar")
    if not categoria or len(categoria) > 80 or not isinstance(data.get("documentos"), list):
        raise HTTPException(422, "Categoria e documentos são obrigatórios")
    if any(x not in DOC_TYPES for x in data["documentos"]):
        raise HTTPException(422, "Tipo de documento inválido")
    t = table("sup_fornecedor_criterio")
    found = db.execute(select(t.c.id).where(and_(t.c.unidade_id == ctx.unit_id,
        t.c.categoria == categoria))).scalar_one_or_none()
    values = {"documentos": sorted(set(data["documentos"])),
              "questionario": data.get("questionario") or {},
              "exige_amostra": bool(data.get("exige_amostra", False)),
              "visita_opcional": bool(data.get("visita_opcional", True))}
    if found:
        db.execute(update(t).where(t.c.id == found).values(**values, **changed(user)))
    else:
        db.execute(insert(t).values(id=uuid7(), unidade_id=ctx.unit_id,
            categoria=categoria, **values, **audit(user)))
    db.commit()
    return {"categoria": categoria, **values}


def weights(db: Session, ctx) -> dict[str, Decimal]:
    t = table("sup_parametro")
    result = {}
    for name in WEIGHTS:
        found = db.execute(select(t.c.valor).where(and_(t.c.unidade_id == ctx.unit_id,
            t.c.chave == f"iqf_{name}_peso", t.c.ativo.is_(True)))).scalar_one_or_none()
        if found is None:
            raise HTTPException(409, "Pesos do IQF não configurados")
        result[name] = Decimal(found)
    if sum(result.values()) != 100:
        raise HTTPException(409, "Pesos do IQF devem somar 100%")
    return result


@router.post("/fornecedores/{supplier_id}/avaliacoes", status_code=201)
def evaluate(supplier_id: str, data: dict, unidade: str = "campinas",
             user: Actor = Depends(current_actor), db: Session = Depends(session)):
    ctx = gate(db, user, unidade, "fornecedor.avaliar")
    row = supplier(db, ctx, supplier_id, lock=True)
    scores = {name: amount(data.get(name), name, positive=True) for name in WEIGHTS}
    if any(value < 1 or value > 5 for value in scores.values()):
        raise HTTPException(422, "Cada nota deve ficar entre 1 e 5")
    weighted = money(sum(scores[name] * weight for name, weight in weights(db, ctx).items()) / 5)
    order_id = ident(data["pedido_id"], "Pedido") if data.get("pedido_id") else None
    if order_id:
        order = table("sup_pedido")
        if db.execute(select(order.c.id).where(and_(order.c.id == order_id,
            order.c.unidade_id == ctx.unit_id,
            order.c.fornecedor_unidade_id == row["id"]))).scalar_one_or_none() is None:
            raise HTTPException(403, "Pedido de outro fornecedor ou unidade")
    t = table("sup_fornecedor_avaliacao")
    review_id = uuid7()
    db.execute(insert(t).values(id=review_id, unidade_id=ctx.unit_id,
        fornecedor_unidade_id=row["id"], pedido_id=order_id,
        **{f"nota_{key}": value for key, value in scores.items()},
        comentario=str(data.get("comentario") or "").strip() or None,
        iqf=weighted, **audit(user)))
    start = datetime.now(UTC) - timedelta(days=365)
    average = db.execute(select(func.avg(t.c.iqf)).where(and_(t.c.unidade_id == ctx.unit_id,
        t.c.fornecedor_unidade_id == row["id"], t.c.avaliado_em >= start))).scalar_one()
    previous = Decimal(row["iqf"]) if row["iqf"] is not None else None
    current = money(average)
    trend = "SUBINDO" if previous is not None and current > previous else (
        "CAINDO" if previous is not None and current < previous else "ESTAVEL")
    db.execute(update(table("sup_fornecedor_unidade")).where(
        table("sup_fornecedor_unidade").c.id == row["id"]).values(iqf=current,
        tendencia=trend, **changed(user)))
    record_event(db, ctx, row["id"], "IQF", "IQF", f"Avaliação registrada: {weighted}",
                 target_type="fornecedor")
    band = iqf_band(db, ctx, current)
    db.commit()
    return {"id": str(review_id), "iqf_avaliacao": str(weighted), "iqf_12_meses": str(current),
            "faixa": band}


def quote(db: Session, ctx, quote_id: str, *, lock: bool = False) -> dict:
    t = table("sup_cotacao")
    stmt = select(t).where(and_(t.c.id == ident(quote_id, "Cotação"), t.c.unidade_id == ctx.unit_id))
    if lock:
        stmt = stmt.with_for_update()
    row = db.execute(stmt).mappings().one_or_none()
    if not row:
        raise HTTPException(404, "Cotação não encontrada nesta unidade")
    return dict(row)


def quote_items(db: Session, ctx, quote_id: UUID):
    item = table("sup_cotacao_item")
    req_item = table("sup_solicitacao_item")
    req = table("sup_solicitacao")
    material = table("sup_material")
    rows = db.execute(select(item, req_item.c.material_id, req_item.c.descricao_livre,
        req_item.c.preco_informado, req_item.c.qtd.label("qtd_solicitada"),
        req.c.numero.label("solicitacao_numero"), req.c.cc_id, req.c.niveis_total,
        material.c.categoria)
        .join(req_item, req_item.c.id == item.c.solicitacao_item_id)
        .join(req, req.c.id == req_item.c.solicitacao_id)
        .outerjoin(material, material.c.id == req_item.c.material_id)
        .where(and_(item.c.unidade_id == ctx.unit_id, item.c.cotacao_id == quote_id))
        .order_by(item.c.criado_em)).mappings().all()
    return [dict(x) for x in rows]


def offer_cost(quantity: Decimal, unit_price: Decimal, ipi: Decimal, icms_st: Decimal,
               discount: Decimal, freight_type: str, freight_value: Decimal,
               freight_allocation: str) -> Decimal:
    freight = (freight_value if freight_allocation == "TOTAL" else freight_value * quantity)
    if freight_type == "CIF":
        freight = Decimal(0)  # já incorporado ao preço do fornecedor
    result = quantity * unit_price + ipi + icms_st - discount + freight
    if result < 0:
        raise HTTPException(422, "Desconto excede o custo da proposta")
    return money(result)


def quote_detail(db: Session, ctx, row: dict):
    invite = table("sup_cotacao_convite")
    offers = table("sup_cotacao_preco")
    profile = table("sup_fornecedor_unidade")
    company = table("sup_fornecedor")
    items = quote_items(db, ctx, row["id"])
    item_ids = [x["id"] for x in items]
    suppliers = db.execute(select(invite.c.fornecedor_unidade_id, profile.c.situacao,
        profile.c.iqf, company.c.razao, company.c.cnpj)
        .join(profile, profile.c.id == invite.c.fornecedor_unidade_id)
        .join(company, company.c.id == profile.c.fornecedor_id)
        .where(and_(invite.c.unidade_id == ctx.unit_id, invite.c.cotacao_id == row["id"]))).mappings().all()
    prices = db.execute(select(offers).where(and_(offers.c.unidade_id == ctx.unit_id,
        offers.c.cotacao_item_id.in_(item_ids)))).mappings().all() if item_ids else []
    safe_prices = []
    for price in prices:
        value = dict(price)
        value["tem_anexo"] = bool(value.pop("anexo_path"))
        value.pop("anexo_sha256", None)
        safe_prices.append(value)
    approvals = table("sup_evento")
    approval_count = db.execute(select(func.count()).select_from(approvals).where(and_(
        approvals.c.unidade_id == ctx.unit_id, approvals.c.alvo_tipo == "cotacao",
        approvals.c.alvo_id == row["id"],
        approvals.c.para.like("APROVACAO_COTACAO_N%")))).scalar_one()
    order_table = table("sup_pedido")
    orders = db.execute(select(order_table.c.id, order_table.c.numero, order_table.c.status)
        .where(and_(order_table.c.unidade_id == ctx.unit_id,
                    order_table.c.cotacao_id == row["id"]))
        .order_by(order_table.c.numero)).mappings().all()
    return jsonable_encoder({**row, "itens": items,
        "fornecedores": [dict(x) for x in suppliers], "propostas": safe_prices,
        "pedidos": [dict(x) for x in orders],
        "aprovacoes_feitas": approval_count,
        "niveis_exigidos": max((x["niveis_total"] or 1 for x in items), default=1)})


@router.get("/fila")
def purchase_queue(unidade: str = "campinas", user: Actor = Depends(current_actor),
                   db: Session = Depends(session)):
    ctx = gate(db, user, unidade, "compras.cotar")
    item = table("sup_solicitacao_item")
    req = table("sup_solicitacao")
    material = table("sup_material")
    rows = db.execute(select(item, req.c.numero.label("solicitacao_numero"), req.c.cc_id,
        req.c.status.label("solicitacao_status"), material.c.descricao.label("material_descricao"),
        material.c.categoria)
        .join(req, req.c.id == item.c.solicitacao_id)
        .outerjoin(material, material.c.id == item.c.material_id)
        .where(and_(item.c.unidade_id == ctx.unit_id, item.c.destino == "COMPRA",
                    req.c.status.in_(("APROVADA", "EM_ATENDIMENTO")),
                    item.c.status != "CANCELADO"))).mappings().all()
    quote_item = table("sup_cotacao_item")
    return {"items": jsonable_encoder([dict(row) for row in rows if
        ctx.has("compras.cotar", str(row["cc_id"])) and not db.execute(select(
            quote_item.c.id).where(and_(quote_item.c.unidade_id == ctx.unit_id,
            quote_item.c.solicitacao_item_id == row["id"]))).scalar_one_or_none()])}


@router.post("/itens/{item_id}/destino")
def set_destination(item_id: str, data: dict, unidade: str = "campinas",
                    user: Actor = Depends(current_actor), db: Session = Depends(session)):
    ctx = context(unidade, user, db)
    item = table("sup_solicitacao_item")
    row = db.execute(select(item).where(and_(item.c.id == ident(item_id, "Item"),
        item.c.unidade_id == ctx.unit_id)).with_for_update()).mappings().one_or_none()
    if not row:
        raise HTTPException(404, "Item não encontrado")
    req = get_request(db, ctx, row["solicitacao_id"])
    check_action(ctx, "solicitacao.separar", str(req["cc_id"]), write=True, phase="S3A", db=db)
    dest = data.get("destino")
    if dest not in {"COMPRA", "ALMOXARIFADO"} or req["status"] not in {"APROVADA", "EM_ATENDIMENTO"}:
        raise HTTPException(409, "Destino inválido para o estado atual")
    if row["qtd_entregue"] > 0:
        raise HTTPException(409, "Item já recebeu entrega")
    if dest == "ALMOXARIFADO" and row["destino"] == "COMPRA":
        linked = db.execute(select(table("sup_cotacao_item").c.id).where(
            table("sup_cotacao_item").c.solicitacao_item_id == row["id"])).scalar_one_or_none()
        if linked:
            raise HTTPException(409, "Item já participa de cotação")
    db.execute(update(item).where(item.c.id == row["id"]).values(destino=dest,
        qtd_comprar=row["qtd"] if dest == "COMPRA" else 0, **changed(user)))
    record_event(db, ctx, row["id"], row["destino"], dest,
                 "Destino de atendimento definido", target_type="item")
    db.commit()
    return {"destino": dest, "item_id": str(row["id"])}


@router.get("/cotacoes")
def list_quotes(unidade: str = "campinas", status: str | None = None,
                page: int = Query(1, ge=1), size: int = Query(25, ge=1, le=100),
                user: Actor = Depends(current_actor), db: Session = Depends(session)):
    ctx = context(unidade, user, db)
    if not any(role["papel"] in {"COMPRADOR", "QUALIDADE", "APROVADOR", "ADMIN"}
               for role in ctx.roles):
        raise HTTPException(403, "Sem papel de Compras, Qualidade ou aprovação")
    check_action(ctx, "catalogo.ver", write=True, phase="S3A", db=db)
    t = table("sup_cotacao")
    conditions = [t.c.unidade_id == ctx.unit_id]
    if status:
        conditions.append(t.c.status == status)
    rows = db.execute(select(t).where(and_(*conditions)).order_by(t.c.criado_em.desc())).mappings().all()
    visible = [dict(x) for x in rows if all(any(ctx.has(action, str(item["cc_id"]))
               for action in ("compras.cotar", "fornecedor.homologar", "solicitacao.aprovar"))
               for item in quote_items(db, ctx, x["id"]))]
    return {"total": len(visible), "page": page, "size": size,
            "items": jsonable_encoder(visible[(page-1)*size:page*size])}


@router.post("/cotacoes", status_code=201)
def create_quote(data: dict, unidade: str = "campinas", user: Actor = Depends(current_actor),
                 db: Session = Depends(session)):
    ctx = gate(db, user, unidade, "compras.cotar")
    ids = data.get("itens")
    if not isinstance(ids, list) or not 1 <= len(ids) <= 100 or len(set(ids)) != len(ids):
        raise HTTPException(422, "Selecione itens distintos de solicitações aprovadas")
    item = table("sup_solicitacao_item")
    req = table("sup_solicitacao")
    selected = []
    centers = set()
    for value in ids:
        found = db.execute(select(item, req.c.cc_id, req.c.status.label("solicitacao_status"))
            .join(req, req.c.id == item.c.solicitacao_id)
            .where(and_(item.c.id == ident(value, "Item"), item.c.unidade_id == ctx.unit_id,
                        req.c.unidade_id == ctx.unit_id)).with_for_update()).mappings().one_or_none()
        if not found or found["destino"] != "COMPRA" or found["solicitacao_status"] not in {"APROVADA", "EM_ATENDIMENTO"}:
            raise HTTPException(409, "Item sem destino Compra ou solicitação não aprovada")
        check_action(ctx, "compras.cotar", str(found["cc_id"]), write=True, phase="S3A", db=db)
        if db.execute(select(table("sup_cotacao_item").c.id).where(
                table("sup_cotacao_item").c.solicitacao_item_id == found["id"])).scalar_one_or_none():
            raise HTTPException(409, "Item já incluído em outra cotação")
        selected.append(dict(found)); centers.add(found["cc_id"])
    serial = db.execute(text("""INSERT INTO suprimentos.sup_numero_cotacao(unidade_id,proximo)
      VALUES (:unit,2) ON CONFLICT(unidade_id) DO UPDATE
      SET proximo=suprimentos.sup_numero_cotacao.proximo+1 RETURNING proximo-1"""),
      {"unit": ctx.unit_id}).scalar_one()
    quote_id = uuid7()
    db.execute(insert(table("sup_cotacao")).values(id=quote_id, unidade_id=ctx.unit_id,
        numero=f"COT-{serial:05d}", cc_id=next(iter(centers)) if len(centers) == 1 else None,
        **audit(user)))
    for found in selected:
        db.execute(insert(table("sup_cotacao_item")).values(id=uuid7(), unidade_id=ctx.unit_id,
            cotacao_id=quote_id, solicitacao_item_id=found["id"],
            qtd=found["qtd"] - found["qtd_entregue"], **audit(user)))
    record_event(db, ctx, quote_id, None, "RASCUNHO", target_type="cotacao")
    db.commit()
    return quote_detail(db, ctx, quote(db, ctx, str(quote_id)))


@router.get("/cotacoes/{quote_id}")
def get_quote(quote_id: str, unidade: str = "campinas", user: Actor = Depends(current_actor),
              db: Session = Depends(session)):
    ctx = context(unidade, user, db)
    check_action(ctx, "catalogo.ver", write=True, phase="S3A", db=db)
    row = quote(db, ctx, quote_id)
    for item in quote_items(db, ctx, row["id"]):
        if not any(ctx.has(action, str(item["cc_id"])) for action in
                   ("compras.cotar", "fornecedor.homologar", "solicitacao.aprovar")):
            raise HTTPException(403, "Cotação fora do seu centro de custo")
    return quote_detail(db, ctx, row)


@router.post("/cotacoes/{quote_id}/convidar")
def invite(quote_id: str, data: dict, unidade: str = "campinas",
           user: Actor = Depends(current_actor), db: Session = Depends(session)):
    ctx = gate(db, user, unidade, "compras.cotar")
    row = quote(db, ctx, quote_id, lock=True)
    if row["status"] not in {"RASCUNHO", "ABERTA"}:
        raise HTTPException(409, "Cotação fechada")
    profile = supplier(db, ctx, str(data.get("fornecedor_id")))
    company = db.execute(select(table("sup_fornecedor")).where(
        table("sup_fornecedor").c.id == profile["fornecedor_id"])).mappings().one()
    material = table("sup_material")
    for item in quote_items(db, ctx, row["id"]):
        check_action(ctx, "compras.cotar", str(item["cc_id"]), write=True, phase="S3A", db=db)
        if item["material_id"]:
            category = db.execute(select(material.c.categoria).where(material.c.id == item["material_id"])).scalar_one()
            if category not in company["categorias"]:
                raise HTTPException(409, "Fornecedor não atende todas as categorias da cotação")
    try:
        db.execute(insert(table("sup_cotacao_convite")).values(id=uuid7(), unidade_id=ctx.unit_id,
            cotacao_id=row["id"], fornecedor_unidade_id=profile["id"], **audit(user)))
        db.execute(update(table("sup_cotacao")).where(table("sup_cotacao").c.id == row["id"])
                   .values(status="ABERTA", **changed(user)))
        record_event(db, ctx, row["id"], row["status"], "ABERTA", "Fornecedor convidado",
                     target_type="cotacao")
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, "Fornecedor já convidado") from None
    return quote_detail(db, ctx, quote(db, ctx, quote_id))


@router.post("/cotacoes/{quote_id}/propostas")
def add_offer(quote_id: str, data: dict, unidade: str = "campinas",
              user: Actor = Depends(current_actor), db: Session = Depends(session)):
    ctx = gate(db, user, unidade, "compras.cotar")
    row = quote(db, ctx, quote_id, lock=True)
    if row["status"] not in {"RASCUNHO", "ABERTA"}:
        raise HTTPException(409, "Cotação fechada")
    quote_item = table("sup_cotacao_item")
    found = db.execute(select(quote_item).where(and_(quote_item.c.id == ident(data.get("item_id"), "Item da cotação"),
        quote_item.c.unidade_id == ctx.unit_id, quote_item.c.cotacao_id == row["id"]))).mappings().one_or_none()
    if not found:
        raise HTTPException(404, "Item não pertence à cotação")
    item = next(x for x in quote_items(db, ctx, row["id"]) if x["id"] == found["id"])
    check_action(ctx, "compras.cotar", str(item["cc_id"]), write=True, phase="S3A", db=db)
    profile = supplier(db, ctx, str(data.get("fornecedor_id")))
    invite = table("sup_cotacao_convite")
    if db.execute(select(invite.c.id).where(and_(invite.c.cotacao_id == row["id"],
        invite.c.unidade_id == ctx.unit_id, invite.c.fornecedor_unidade_id == profile["id"]))).scalar_one_or_none() is None:
        raise HTTPException(403, "Fornecedor não foi convidado")
    try:
        expiry = date.fromisoformat(data["validade"])
        deadline = int(data["prazo_dias"])
    except (KeyError, ValueError, TypeError):
        raise HTTPException(422, "Prazo e validade da proposta são obrigatórios") from None
    if expiry < date.today() or deadline < 0:
        raise HTTPException(422, "Proposta vencida ou prazo inválido")
    freight_type = data.get("frete_tipo", "CIF")
    allocation = data.get("frete_rateio", "TOTAL")
    if freight_type not in {"CIF", "FOB"} or allocation not in {"TOTAL", "UNIDADE"}:
        raise HTTPException(422, "Frete inválido")
    numbers = {key: amount(data.get(key, 0), key, positive=key == "preco_unit") for key in
        ("preco_unit", "ipi", "icms_st", "desconto", "frete_valor")}
    cost = offer_cost(Decimal(found["qtd"]), numbers["preco_unit"], numbers["ipi"],
        numbers["icms_st"], numbers["desconto"], freight_type, numbers["frete_valor"], allocation)
    offer = table("sup_cotacao_preco")
    values = dict(preco_unit=numbers["preco_unit"], ipi=numbers["ipi"], icms_st=numbers["icms_st"],
        desconto=numbers["desconto"], frete_tipo=freight_type, frete_valor=numbers["frete_valor"],
        frete_rateio=allocation, transportadora=data.get("transportadora"), prazo_dias=deadline,
        pagamento=data.get("pagamento"), validade=expiry, observacoes=data.get("observacoes"),
        custo_posto=cost, **changed(user))
    existing = db.execute(select(offer.c.id).where(and_(offer.c.cotacao_item_id == found["id"],
        offer.c.fornecedor_unidade_id == profile["id"]))).scalar_one_or_none()
    if existing:
        db.execute(update(offer).where(offer.c.id == existing).values(**values))
        offer_id = existing
    else:
        offer_id = uuid7()
        db.execute(insert(offer).values(id=offer_id, unidade_id=ctx.unit_id,
            cotacao_item_id=found["id"], fornecedor_unidade_id=profile["id"],
            **values, criado_por=user.id))
    record_event(db, ctx, row["id"], row["status"], row["status"],
                 f"Proposta registrada para item {found['id']}", target_type="cotacao")
    db.commit()
    return {"id": str(offer_id), "custo_posto": str(cost)}


@router.post("/cotacoes/{quote_id}/propostas/{offer_id}/anexo")
async def attach_offer(quote_id: str, offer_id: str, arquivo: UploadFile = File(...),
                       unidade: str = "campinas", user: Actor = Depends(current_actor),
                       db: Session = Depends(session)):
    ctx = gate(db, user, unidade, "compras.cotar")
    row = quote(db, ctx, quote_id)
    if row["status"] not in {"RASCUNHO", "ABERTA"}:
        raise HTTPException(409, "Cotação fechada")
    for item in quote_items(db, ctx, row["id"]):
        check_action(ctx, "compras.cotar", str(item["cc_id"]), write=True, phase="S3A", db=db)
    t, qitem = table("sup_cotacao_preco"), table("sup_cotacao_item")
    found = db.execute(select(t).join(qitem, qitem.c.id == t.c.cotacao_item_id)
        .where(and_(t.c.id == ident(offer_id, "Proposta"), t.c.unidade_id == ctx.unit_id,
                    qitem.c.cotacao_id == row["id"]))).mappings().one_or_none()
    if not found or found["anexo_path"]:
        raise HTTPException(409, "Proposta indisponível ou anexo já registrado")
    content = await arquivo.read(12_582_913)
    if not 0 < len(content) <= 12_582_912:
        raise HTTPException(413, "Anexo excede 12 MB")
    path, digest, mime = private_file(db, ctx, row["id"], arquivo, content, "propostas")
    try:
        db.execute(update(t).where(t.c.id == found["id"]).values(
            anexo_path=str(path), anexo_sha256=digest, anexo_mime=mime, **changed(user)))
        db.commit()
    except Exception:
        db.rollback(); path.unlink(missing_ok=True); raise
    return {"id": str(found["id"]), "sha256": digest}


@router.get("/cotacoes/{quote_id}/propostas/{offer_id}/anexo")
def offer_attachment(quote_id: str, offer_id: str, unidade: str = "campinas",
                     user: Actor = Depends(current_actor), db: Session = Depends(session)):
    ctx = context(unidade, user, db)
    check_action(ctx, "catalogo.ver", write=True, phase="S3A", db=db)
    row = quote(db, ctx, quote_id)
    for item in quote_items(db, ctx, row["id"]):
        if not any(ctx.has(action, str(item["cc_id"])) for action in
                   ("compras.cotar", "fornecedor.homologar", "solicitacao.aprovar")):
            raise HTTPException(403, "Proposta fora do seu centro de custo")
    t, qitem = table("sup_cotacao_preco"), table("sup_cotacao_item")
    found = db.execute(select(t.c.anexo_path, t.c.anexo_mime).join(
        qitem, qitem.c.id == t.c.cotacao_item_id).where(and_(
        t.c.id == ident(offer_id, "Proposta"), t.c.unidade_id == ctx.unit_id,
        qitem.c.cotacao_id == row["id"]))).mappings().one_or_none()
    if not found or not found["anexo_path"]:
        raise HTTPException(404, "Anexo não encontrado")
    path = Path(found["anexo_path"]).resolve()
    if upload_root() not in path.parents or not path.is_file():
        raise HTTPException(404, "Anexo indisponível")
    return FileResponse(path, media_type=found["anexo_mime"],
                        headers={"Cache-Control": "private, no-store"})


@router.post("/cotacoes/{quote_id}/escolher")
def choose_offer(quote_id: str, data: dict, unidade: str = "campinas",
                 user: Actor = Depends(current_actor), db: Session = Depends(session)):
    ctx = gate(db, user, unidade, "compras.cotar")
    row = quote(db, ctx, quote_id, lock=True)
    if row["status"] != "ABERTA":
        raise HTTPException(409, "Cotação não está aberta")
    offer = table("sup_cotacao_preco")
    qitem = table("sup_cotacao_item")
    chosen = db.execute(select(offer, qitem.c.cotacao_id).join(qitem, qitem.c.id == offer.c.cotacao_item_id)
        .where(and_(offer.c.id == ident(data.get("proposta_id"), "Proposta"),
                    offer.c.unidade_id == ctx.unit_id, qitem.c.cotacao_id == row["id"]))
        .with_for_update()).mappings().one_or_none()
    if not chosen:
        raise HTTPException(404, "Proposta não pertence à cotação")
    item = next(x for x in quote_items(db, ctx, row["id"]) if x["id"] == chosen["cotacao_item_id"])
    check_action(ctx, "compras.cotar", str(item["cc_id"]), write=True, phase="S3A", db=db)
    if chosen["validade"] < date.today():
        raise HTTPException(409, "Proposta vencida")
    profile = supplier(db, ctx, str(chosen["fornecedor_unidade_id"]))
    exception = table("sup_compra_excecao")
    emergency = db.execute(select(exception.c.id).where(and_(exception.c.unidade_id == ctx.unit_id,
        exception.c.cotacao_id == row["id"],
        exception.c.fornecedor_unidade_id == profile["id"],
        exception.c.valido_ate >= date.today()))).scalar_one_or_none()
    supplier_ok(profile, emergency=bool(emergency))
    competitors = db.execute(select(offer.c.custo_posto).where(and_(
        offer.c.cotacao_item_id == chosen["cotacao_item_id"],
        offer.c.unidade_id == ctx.unit_id, offer.c.validade >= date.today()))).scalars().all()
    lowest = min(competitors)
    explanation = str(data.get("justificativa") or "").strip()
    if chosen["custo_posto"] > lowest and not explanation:
        raise HTTPException(422, "Justifique a escolha fora do menor custo total")
    db.execute(update(offer).where(and_(offer.c.cotacao_item_id == chosen["cotacao_item_id"],
        offer.c.unidade_id == ctx.unit_id)).values(escolhido=False, **changed(user)))
    db.execute(update(offer).where(offer.c.id == chosen["id"]).values(escolhido=True,
        justificativa_escolha=explanation or None, **changed(user)))
    db.execute(update(qitem).where(qitem.c.id == chosen["cotacao_item_id"]).values(
        escolhido_preco_id=chosen["id"], **changed(user)))
    record_event(db, ctx, row["id"], "ABERTA", "ABERTA", "Proposta escolhida",
                 target_type="cotacao")
    db.commit()
    return {"item_id": str(chosen["cotacao_item_id"]), "proposta_id": str(chosen["id"]),
            "menor_custo": str(lowest)}


@router.post("/cotacoes/{quote_id}/excecao-fornecedor")
def emergency_supplier(quote_id: str, data: dict, unidade: str = "campinas",
                       user: Actor = Depends(current_actor), db: Session = Depends(session)):
    ctx = gate(db, user, unidade, "fornecedor.homologar")
    row = quote(db, ctx, quote_id, lock=True)
    profile = supplier(db, ctx, str(data.get("fornecedor_id")))
    opinion = str(data.get("parecer") or "").strip()
    if len(opinion) < 20 or row["status"] not in {"RASCUNHO", "ABERTA"}:
        raise HTTPException(422, "Parecer da Qualidade com pelo menos 20 caracteres obrigatório")
    exception = table("sup_compra_excecao")
    if db.execute(select(exception.c.id).where(and_(exception.c.cotacao_id == row["id"],
        exception.c.fornecedor_unidade_id == profile["id"]))).scalar_one_or_none():
        raise HTTPException(409, "Exceção já registrada")
    db.execute(insert(exception).values(id=uuid7(), unidade_id=ctx.unit_id,
        cotacao_id=row["id"], fornecedor_unidade_id=profile["id"],
        parecer=opinion, aprovado_por=user.id, aprovado_nome=user.name,
        valido_ate=date.today() + timedelta(days=7), **audit(user)))
    record_event(db, ctx, row["id"], row["status"], row["status"],
                 "Exceção emergencial de fornecedor aprovada pela Qualidade",
                 target_type="cotacao")
    db.commit()
    return {"ok": True, "valido_ate": str(date.today() + timedelta(days=7))}


@router.post("/cotacoes/{quote_id}/fechar")
def close_quote(quote_id: str, data: dict, unidade: str = "campinas",
                user: Actor = Depends(current_actor), db: Session = Depends(session)):
    ctx = gate(db, user, unidade, "compras.cotar")
    row = quote(db, ctx, quote_id, lock=True)
    if row["status"] != "ABERTA":
        raise HTTPException(409, "Cotação não está aberta")
    items = quote_items(db, ctx, row["id"])
    offer = table("sup_cotacao_preco")
    threshold = db.execute(select(table("sup_parametro").c.valor).where(and_(
        table("sup_parametro").c.unidade_id == ctx.unit_id,
        table("sup_parametro").c.chave == "cotacao_minima_3_acima"))).scalar_one()
    selected_total = Decimal(0)
    incomplete = []
    for item in items:
        check_action(ctx, "compras.cotar", str(item["cc_id"]), write=True, phase="S3A", db=db)
        offers = db.execute(select(offer).where(and_(offer.c.unidade_id == ctx.unit_id,
            offer.c.cotacao_item_id == item["id"], offer.c.validade >= date.today()))).mappings().all()
        chosen = next((x for x in offers if x["escolhido"]), None)
        if not chosen:
            incomplete.append(str(item["id"]))
        else:
            selected_total += chosen["custo_posto"]
    if incomplete:
        raise HTTPException(409, "Escolha uma proposta válida para cada item")
    fewer_than_three = any(db.execute(select(func.count()).select_from(offer).where(and_(
            offer.c.unidade_id == ctx.unit_id, offer.c.cotacao_item_id == item["id"],
            offer.c.validade >= date.today()))).scalar_one() < 3 for item in items)
    if fewer_than_three and selected_total > Decimal(threshold):
        raise HTTPException(409, "Cotação acima do limite exige três propostas válidas")
    if fewer_than_three:
        justification = str(data.get("justificativa") or "").strip()
        if len(justification) < 10:
            raise HTTPException(422, "Com menos de três propostas, justifique a escolha")
        status = "PENDENTE_APROVACAO"
    else:
        justification = str(data.get("justificativa") or "").strip() or None
        status = "FECHADA"
    db.execute(update(table("sup_cotacao")).where(table("sup_cotacao").c.id == row["id"])
               .values(status=status, fechamento_justificativa=justification, **changed(user)))
    record_event(db, ctx, row["id"], "ABERTA", status, justification,
                 target_type="cotacao")
    db.commit()
    return {"status": status, "valor_total": str(money(selected_total)),
            "niveis_exigidos": max((x["niveis_total"] or 1 for x in items), default=1)}


@router.post("/cotacoes/{quote_id}/aprovar-fechamento")
def approve_quote_close(quote_id: str, data: dict, unidade: str = "campinas",
                        user: Actor = Depends(current_actor), db: Session = Depends(session)):
    ctx = context(unidade, user, db)
    row = quote(db, ctx, quote_id, lock=True)
    if row["status"] != "PENDENTE_APROVACAO":
        raise HTTPException(409, "Cotação não aguarda aprovação")
    items = quote_items(db, ctx, row["id"])
    required = max((item["niveis_total"] or 1 for item in items), default=1)
    events = table("sup_evento")
    approved = db.execute(select(func.count()).select_from(events).where(and_(
        events.c.unidade_id == ctx.unit_id, events.c.alvo_tipo == "cotacao",
        events.c.alvo_id == row["id"],
        events.c.para.like("APROVACAO_COTACAO_N%")))).scalar_one()
    level = approved + 1
    if level > required:
        raise HTTPException(409, "Alçada da cotação já concluída")
    for item in items:
        check_action(ctx, "solicitacao.aprovar", str(item["cc_id"]), level,
                     write=True, phase="S3A", db=db)
    record_event(db, ctx, row["id"], "PENDENTE_APROVACAO",
                 f"APROVACAO_COTACAO_N{level}",
                 str(data.get("comentario") or "").strip() or None, target_type="cotacao")
    status = "FECHADA" if level == required else "PENDENTE_APROVACAO"
    if status == "FECHADA":
        db.execute(update(table("sup_cotacao")).where(table("sup_cotacao").c.id == row["id"])
                   .values(status=status, **changed(user)))
        record_event(db, ctx, row["id"], "PENDENTE_APROVACAO", "FECHADA",
                     "Alçada da cotação concluída", target_type="cotacao")
    db.commit()
    return {"status": status, "nivel_aprovado": level, "niveis_exigidos": required}


def order(db: Session, ctx, order_id: str, *, lock: bool = False):
    t = table("sup_pedido")
    stmt = select(t).where(and_(t.c.id == ident(order_id, "Pedido"), t.c.unidade_id == ctx.unit_id))
    if lock:
        stmt = stmt.with_for_update()
    row = db.execute(stmt).mappings().one_or_none()
    if not row:
        raise HTTPException(404, "Pedido não encontrado nesta unidade")
    return dict(row)


def order_items(db: Session, ctx, order_id: UUID):
    t = table("sup_pedido_item")
    req_item = table("sup_solicitacao_item")
    req = table("sup_solicitacao")
    return [dict(x) for x in db.execute(select(t, req.c.cc_id, req.c.numero.label("solicitacao_numero"),
        req.c.valor_estimado.label("valor_aprovado"), req_item.c.descricao_livre,
        req_item.c.material_id, req_item.c.preco_informado)
        .join(req_item, req_item.c.id == t.c.solicitacao_item_id)
        .join(req, req.c.id == req_item.c.solicitacao_id)
        .where(and_(t.c.pedido_id == order_id, t.c.unidade_id == ctx.unit_id))
        .order_by(t.c.criado_em)).mappings().all()]


def order_detail(db: Session, ctx, row: dict):
    profile = supplier(db, ctx, str(row["fornecedor_unidade_id"]))
    company = db.execute(select(table("sup_fornecedor")).where(
        table("sup_fornecedor").c.id == profile["fornecedor_id"])).mappings().one()
    events = table("sup_evento")
    history = db.execute(select(events).where(and_(events.c.unidade_id == ctx.unit_id,
        events.c.alvo_tipo == "pedido", events.c.alvo_id == row["id"]))
        .order_by(events.c.em)).mappings().all()
    return jsonable_encoder({**row, "fornecedor": {**company, **profile},
        "itens": order_items(db, ctx, row["id"]),
        "eventos": [dict(x) for x in history]})


def require_order_scope(db: Session, ctx, row: dict, action: str):
    for item in order_items(db, ctx, row["id"]):
        check_action(ctx, action, str(item["cc_id"]), write=True, phase="S3A", db=db)


@router.post("/cotacoes/{quote_id}/gerar-pedidos", status_code=201)
def generate_orders(quote_id: str, unidade: str = "campinas",
                    user: Actor = Depends(current_actor), db: Session = Depends(session)):
    ctx = gate(db, user, unidade, "compras.pedido")
    q = quote(db, ctx, quote_id, lock=True)
    if q["status"] != "FECHADA":
        raise HTTPException(409, "Feche a cotação antes de gerar pedidos")
    t = table("sup_pedido")
    if db.execute(select(t.c.id).where(and_(t.c.unidade_id == ctx.unit_id,
        t.c.cotacao_id == q["id"]))).first():
        raise HTTPException(409, "Pedidos já gerados para esta cotação")
    prices = table("sup_cotacao_preco")
    selected = {}
    for item in quote_items(db, ctx, q["id"]):
        check_action(ctx, "compras.pedido", str(item["cc_id"]), write=True, phase="S3A", db=db)
        offer = db.execute(select(prices).where(and_(prices.c.id == item["escolhido_preco_id"],
            prices.c.unidade_id == ctx.unit_id, prices.c.escolhido.is_(True)))).mappings().one_or_none()
        if not offer or offer["validade"] < date.today():
            raise HTTPException(409, "Proposta escolhida ausente ou vencida")
        profile = supplier(db, ctx, str(offer["fornecedor_unidade_id"]))
        exception = table("sup_compra_excecao")
        emergency = db.execute(select(exception.c.id).where(and_(exception.c.unidade_id == ctx.unit_id,
            exception.c.cotacao_id == q["id"], exception.c.fornecedor_unidade_id == profile["id"],
            exception.c.valido_ate >= date.today()))).scalar_one_or_none()
        supplier_ok(profile, emergency=bool(emergency))
        selected.setdefault(profile["id"], []).append((item, offer))
    tolerance = db.execute(select(table("sup_parametro").c.valor).where(and_(
        table("sup_parametro").c.unidade_id == ctx.unit_id,
        table("sup_parametro").c.chave == "tolerancia_preco_oc_perc"))).scalar_one()
    revisions = {}
    req_item = table("sup_solicitacao_item")
    for chosen in selected.values():
        for item, offer in chosen:
            request_id = db.execute(select(req_item.c.solicitacao_id).where(
                req_item.c.id == item["solicitacao_item_id"])).scalar_one()
            entry = revisions.setdefault(request_id, {"request": get_request(db, ctx, request_id),
                "delta": Decimal(0)})
            original = Decimal(item["preco_informado"] or 0) * Decimal(item["qtd"])
            entry["delta"] += offer["custo_posto"] - original
    for request_id, entry in revisions.items():
        revised = Decimal(entry["request"]["valor_estimado"] or 0) + entry["delta"]
        entry["reapprove"] = revised > Decimal(entry["request"]["valor_estimado"] or 0) * (
            Decimal(1) + Decimal(tolerance) / 100)
        entry["levels"] = len(approval_levels(db, ctx, entry["request"],
            estimate(db, ctx, request_id)[2], revised))
    created = []
    for supplier_id, chosen in selected.items():
        serial = db.execute(text("""INSERT INTO suprimentos.sup_numero_pedido(unidade_id,proximo)
          VALUES (:unit,2) ON CONFLICT(unidade_id) DO UPDATE
          SET proximo=suprimentos.sup_numero_pedido.proximo+1 RETURNING proximo-1"""),
          {"unit": ctx.unit_id}).scalar_one()
        order_id = uuid7()
        total = money(sum((offer["custo_posto"] for _, offer in chosen), Decimal(0)))
        reapprove = False
        required_levels = 1
        for item, offer in chosen:
            req_id = db.execute(select(req_item.c.solicitacao_id).where(
                req_item.c.id == item["solicitacao_item_id"])).scalar_one()
            reapprove |= revisions[req_id]["reapprove"]
            required_levels = max(required_levels, revisions[req_id]["levels"])
        status = "REAPROVACAO" if reapprove else "RASCUNHO"
        expected = max((offer["prazo_dias"] for _, offer in chosen), default=0)
        db.execute(insert(t).values(id=order_id, unidade_id=ctx.unit_id,
            numero=f"OC-{serial:05d}", cotacao_id=q["id"], fornecedor_unidade_id=supplier_id,
            status=status, valor_total=total, entrega_prevista=date.today()+timedelta(days=expected),
            nivel_atual=1 if reapprove else None, niveis_total=required_levels if reapprove else None,
            **audit(user)))
        for item, offer in chosen:
            db.execute(insert(table("sup_pedido_item")).values(id=uuid7(), unidade_id=ctx.unit_id,
                pedido_id=order_id, cotacao_item_id=item["id"],
                solicitacao_item_id=item["solicitacao_item_id"], qtd=item["qtd"],
                preco_unit=offer["preco_unit"], custo_posto=offer["custo_posto"], **audit(user)))
        record_event(db, ctx, order_id, None, status,
                     "Valor acima do aprovado; nova alçada obrigatória" if reapprove else None,
                     target_type="pedido")
        created.append({"id": str(order_id), "numero": f"OC-{serial:05d}",
                        "status": status, "valor_total": str(total)})
    db.commit()
    return {"pedidos": created}


@router.get("/pedidos")
def list_orders(unidade: str = "campinas", status: str | None = None,
                page: int = Query(1, ge=1), size: int = Query(25, ge=1, le=100),
                user: Actor = Depends(current_actor), db: Session = Depends(session)):
    ctx = context(unidade, user, db)
    if not any(ctx.has(action) for action in ("compras.pedido", "compras.receber", "fornecedor.homologar")):
        raise HTTPException(403, "Sem papel de compras, almoxarifado ou Qualidade")
    check_action(ctx, "catalogo.ver", write=True, phase="S3A", db=db)
    t = table("sup_pedido")
    where = [t.c.unidade_id == ctx.unit_id]
    if status:
        where.append(t.c.status == status)
    rows = db.execute(select(t).where(and_(*where)).order_by(t.c.criado_em.desc())).mappings().all()
    visible = [dict(x) for x in rows if all(any(ctx.has(action, str(i["cc_id"])) for action in
        ("compras.pedido", "compras.receber", "fornecedor.homologar")) for i in order_items(db, ctx, x["id"]))]
    return {"total": len(visible), "page": page, "size": size,
            "items": jsonable_encoder(visible[(page-1)*size:page*size])}


@router.get("/pedidos/{order_id}")
def get_order(order_id: str, unidade: str = "campinas", user: Actor = Depends(current_actor),
              db: Session = Depends(session)):
    ctx = context(unidade, user, db)
    row = order(db, ctx, order_id)
    if not all(any(ctx.has(action, str(i["cc_id"])) for action in
        ("compras.pedido", "compras.receber", "fornecedor.homologar", "solicitacao.aprovar"))
        for i in order_items(db, ctx, row["id"])):
        raise HTTPException(403, "Pedido fora do seu centro de custo")
    check_action(ctx, "catalogo.ver", write=True, phase="S3A", db=db)
    return order_detail(db, ctx, row)


@router.post("/pedidos/{order_id}/aprovar")
def approve_order(order_id: str, data: dict, unidade: str = "campinas",
                  user: Actor = Depends(current_actor), db: Session = Depends(session)):
    ctx = context(unidade, user, db)
    row = order(db, ctx, order_id, lock=True)
    if row["status"] != "REAPROVACAO":
        raise HTTPException(409, "Pedido não aguarda nova alçada")
    level = row["nivel_atual"]
    for item in order_items(db, ctx, row["id"]):
        check_action(ctx, "solicitacao.aprovar", str(item["cc_id"]), level,
                     write=True, phase="S3A", db=db)
    comment = str(data.get("comentario") or "").strip()
    next_level = level + 1 if level < row["niveis_total"] else None
    status = "REAPROVACAO" if next_level else "RASCUNHO"
    db.execute(update(table("sup_pedido")).where(table("sup_pedido").c.id == row["id"])
        .values(status=status, nivel_atual=next_level, **changed(user)))
    record_event(db, ctx, row["id"], "REAPROVACAO", status,
                 f"Nível {level} aprovado. {comment}".strip(), target_type="pedido")
    db.commit()
    return {"status": status, "nivel_atual": next_level}


def order_transition(db: Session, ctx, row: dict, user: Actor, target: str,
                     allowed: set[str], comment: str | None = None):
    if row["status"] not in allowed:
        raise HTTPException(409, f"Pedido não pode passar de {row['status']} para {target}")
    values = {"status": target, **changed(user)}
    if target == "ENVIADO":
        values["enviado_em"] = datetime.now(UTC)
    db.execute(update(table("sup_pedido")).where(table("sup_pedido").c.id == row["id"])
        .values(**values))
    record_event(db, ctx, row["id"], row["status"], target, comment, target_type="pedido")
    db.commit()
    return {"status": target}


@router.post("/pedidos/{order_id}/emitir")
def issue_order(order_id: str, unidade: str = "campinas", user: Actor = Depends(current_actor),
                db: Session = Depends(session)):
    ctx = gate(db, user, unidade, "compras.pedido")
    row = order(db, ctx, order_id, lock=True)
    require_order_scope(db, ctx, row, "compras.pedido")
    profile = supplier(db, ctx, str(row["fornecedor_unidade_id"]))
    exception = table("sup_compra_excecao")
    emergency = db.execute(select(exception.c.id).where(and_(
        exception.c.unidade_id == ctx.unit_id,
        exception.c.cotacao_id == row["cotacao_id"],
        exception.c.fornecedor_unidade_id == profile["id"],
        exception.c.valido_ate >= date.today()))).scalar_one_or_none()
    supplier_ok(profile, emergency=bool(emergency))
    return order_transition(db, ctx, row, user, "EMITIDO", {"RASCUNHO"})


@router.post("/pedidos/{order_id}/enviar")
def send_order(order_id: str, data: dict, unidade: str = "campinas",
               user: Actor = Depends(current_actor), db: Session = Depends(session)):
    ctx = gate(db, user, unidade, "compras.pedido")
    row = order(db, ctx, order_id, lock=True)
    require_order_scope(db, ctx, row, "compras.pedido")
    comment = str(data.get("observacao") or "PDF baixado e envio registrado manualmente").strip()
    return order_transition(db, ctx, row, user, "ENVIADO", {"EMITIDO"}, comment)


@router.post("/pedidos/{order_id}/enviar-email")
def email_order(order_id: str, unidade: str = "campinas",
                user: Actor = Depends(current_actor), db: Session = Depends(session)):
    ctx = gate(db, user, unidade, "compras.pedido")
    flag = table("sup_flag")
    enabled = db.execute(select(flag.c.habilitado).where(and_(
        flag.c.unidade_id == ctx.unit_id,
        flag.c.fase == "S3A_EMAIL"))).scalar_one_or_none()
    if not enabled:
        raise HTTPException(409, "Envio por e-mail desligado; baixe o PDF e registre o envio manual")
    row = order(db, ctx, order_id, lock=True)
    require_order_scope(db, ctx, row, "compras.pedido")
    if row["status"] != "EMITIDO":
        raise HTTPException(409, "Emita o pedido antes de enviar")
    supplier_data = order_detail(db, ctx, row)["fornecedor"]
    recipient = supplier_data.get("email_pedido")
    host, sender = os.getenv("SUPRIMENTOS_SMTP_HOST"), os.getenv("SUPRIMENTOS_SMTP_FROM")
    if not recipient or not host or not sender:
        raise HTTPException(503, "E-mail do fornecedor ou SMTP não configurado")
    from email.message import EmailMessage
    import smtplib
    from ssl import create_default_context
    message = EmailMessage()
    message["From"] = sender
    message["To"] = recipient
    message["Subject"] = f"Concrefer · Pedido de compra {row['numero']}"
    message.set_content("Segue o pedido de compra em PDF. Confirme o recebimento desta mensagem.")
    pdf = order_pdf(order_id, unidade=unidade, user=user, db=db)
    message.add_attachment(pdf.body, maintype="application", subtype="pdf",
                           filename=f"{row['numero']}.pdf")
    try:
        with smtplib.SMTP(host, int(os.getenv("SUPRIMENTOS_SMTP_PORT", "587")), timeout=15) as smtp:
            smtp.starttls(context=create_default_context())
            if os.getenv("SUPRIMENTOS_SMTP_USER"):
                smtp.login(os.environ["SUPRIMENTOS_SMTP_USER"],
                           os.environ["SUPRIMENTOS_SMTP_PASSWORD"])
            smtp.send_message(message)
    except (OSError, smtplib.SMTPException):
        raise HTTPException(503, "Falha no envio do e-mail; tente novamente") from None
    return order_transition(db, ctx, row, user, "ENVIADO", {"EMITIDO"},
                            "Pedido enviado por e-mail ao fornecedor")


@router.post("/pedidos/{order_id}/follow-up")
def follow_up(order_id: str, data: dict, unidade: str = "campinas",
              user: Actor = Depends(current_actor), db: Session = Depends(session)):
    ctx = gate(db, user, unidade, "compras.pedido")
    row = order(db, ctx, order_id)
    require_order_scope(db, ctx, row, "compras.pedido")
    comment = str(data.get("observacao") or "").strip()
    if not comment:
        raise HTTPException(422, "Informe o resultado do contato")
    record_event(db, ctx, row["id"], row["status"], row["status"], comment,
                 target_type="pedido")
    db.commit()
    return {"ok": True}


@router.post("/pedidos/{order_id}/cancelar")
def cancel_order(order_id: str, data: dict, unidade: str = "campinas",
                 user: Actor = Depends(current_actor), db: Session = Depends(session)):
    ctx = gate(db, user, unidade, "compras.pedido")
    row = order(db, ctx, order_id, lock=True)
    require_order_scope(db, ctx, row, "compras.pedido")
    comment = str(data.get("motivo") or "").strip()
    if not comment:
        raise HTTPException(422, "Motivo do cancelamento obrigatório")
    return order_transition(db, ctx, row, user, "CANCELADO", {"RASCUNHO", "EMITIDO", "ENVIADO"}, comment)


@router.post("/pedidos/{order_id}/receber")
def simple_receive(order_id: str, data: dict, unidade: str = "campinas",
                   user: Actor = Depends(current_actor), db: Session = Depends(session)):
    """F1: recebimento digitado e cross-docking, sem livro de estoque da F2/F3."""
    ctx = gate(db, user, unidade, "compras.receber")
    row = order(db, ctx, order_id, lock=True)
    require_order_scope(db, ctx, row, "compras.receber")
    if row["status"] not in {"ENVIADO", "PARCIAL"}:
        raise HTTPException(409, "Pedido não está aguardando recebimento")
    nf = str(data.get("numero_nf") or "").strip()
    if not nf or len(nf) > 40:
        raise HTTPException(422, "Número da NF obrigatório")
    item = table("sup_pedido_item")
    found = db.execute(select(item).where(and_(item.c.id == ident(data.get("item_id"), "Item do pedido"),
        item.c.pedido_id == row["id"], item.c.unidade_id == ctx.unit_id)).with_for_update()).mappings().one_or_none()
    if not found:
        raise HTTPException(404, "Item não pertence ao pedido")
    quantity = amount(data.get("qtd"), "Quantidade recebida", positive=True)
    if Decimal(found["qtd_recebida"]) + quantity > Decimal(found["qtd"]):
        raise HTTPException(422, "Quantidade supera o saldo do pedido")
    receipt_id = uuid7()
    db.execute(insert(table("sup_pedido_entrega")).values(id=receipt_id,
        unidade_id=ctx.unit_id, pedido_id=row["id"], pedido_item_id=found["id"],
        qtd=quantity, numero_nf=nf, **audit(user)))
    db.execute(update(item).where(item.c.id == found["id"]).values(
        qtd_recebida=Decimal(found["qtd_recebida"]) + quantity, **changed(user)))
    req_item = table("sup_solicitacao_item")
    requested = db.execute(select(req_item).where(and_(req_item.c.id == found["solicitacao_item_id"],
        req_item.c.unidade_id == ctx.unit_id)).with_for_update()).mappings().one()
    req = get_request(db, ctx, requested["solicitacao_id"], lock=True)
    if req["status"] not in {"APROVADA", "EM_ATENDIMENTO"}:
        raise HTTPException(409, "Solicitação de origem não aceita entrega")
    delivered = Decimal(requested["qtd_entregue"]) + quantity
    if delivered > Decimal(requested["qtd"]):
        raise HTTPException(409, "Quantidade supera a solicitação")
    new_item_status = "ENTREGUE" if delivered == requested["qtd"] else "SEPARADO"
    db.execute(update(req_item).where(req_item.c.id == requested["id"]).values(
        qtd_entregue=delivered, status=new_item_status, **changed(user)))
    record_event(db, ctx, requested["id"], requested["status"], new_item_status,
                 f"Cross-docking da {row['numero']}, NF {nf}, quantidade {quantity}", target_type="item")
    if req["status"] == "APROVADA":
        change(db, ctx, req, "EM_ATENDIMENTO", allowed=("APROVADA",))
    remaining = db.execute(select(func.count()).select_from(req_item).where(and_(
        req_item.c.solicitacao_id == req["id"], req_item.c.unidade_id == ctx.unit_id,
        req_item.c.status.not_in(("ENTREGUE", "CANCELADO"))))).scalar_one()
    if remaining == 0:
        change(db, ctx, req, "ENTREGUE", allowed=("EM_ATENDIMENTO",),
               entregue_em=datetime.now(UTC))
    incomplete = db.execute(select(func.count()).select_from(item).where(and_(
        item.c.pedido_id == row["id"], item.c.unidade_id == ctx.unit_id,
        item.c.qtd_recebida < item.c.qtd))).scalar_one()
    status = "PARCIAL" if incomplete else "RECEBIDO"
    db.execute(update(table("sup_pedido")).where(table("sup_pedido").c.id == row["id"])
        .values(status=status, nf_numero=nf, **changed(user)))
    record_event(db, ctx, row["id"], row["status"], status,
                 f"Entrega direta NF {nf}: {quantity}", target_type="pedido")
    db.commit()
    return {"entrega_id": str(receipt_id), "pedido_status": status,
            "solicitacao_status": req["status"]}


@router.post("/pedidos/{order_id}/entregas/{receipt_id}/anexo")
async def attach_delivery(order_id: str, receipt_id: str, arquivo: UploadFile = File(...),
                          unidade: str = "campinas", user: Actor = Depends(current_actor),
                          db: Session = Depends(session)):
    ctx = gate(db, user, unidade, "compras.receber")
    row = order(db, ctx, order_id)
    require_order_scope(db, ctx, row, "compras.receber")
    delivery = table("sup_pedido_entrega")
    found = db.execute(select(delivery).where(and_(delivery.c.id == ident(receipt_id, "Entrega"),
        delivery.c.pedido_id == row["id"], delivery.c.unidade_id == ctx.unit_id))).mappings().one_or_none()
    if not found or found["anexo_path"]:
        raise HTTPException(409, "Entrega indisponível ou anexo já enviado")
    content = await arquivo.read(12_582_913)
    if not 0 < len(content) <= 12_582_912:
        raise HTTPException(413, "Anexo excede 12 MB")
    path, digest, mime = private_file(db, ctx, row["id"], arquivo, content, "entregas")
    try:
        db.execute(update(delivery).where(delivery.c.id == found["id"]).values(
            anexo_path=str(path), anexo_sha256=digest, anexo_mime=mime, **changed(user)))
        db.commit()
    except Exception:
        db.rollback(); path.unlink(missing_ok=True); raise
    return {"id": str(found["id"]), "sha256": digest}


@router.post("/pedidos/{order_id}/encerrar")
def close_order(order_id: str, unidade: str = "campinas",
                user: Actor = Depends(current_actor), db: Session = Depends(session)):
    ctx = gate(db, user, unidade, "compras.pedido")
    row = order(db, ctx, order_id, lock=True)
    require_order_scope(db, ctx, row, "compras.pedido")
    return order_transition(db, ctx, row, user, "ENCERRADO", {"RECEBIDO"})


@router.get("/pedidos/{order_id}/pdf")
def order_pdf(order_id: str, unidade: str = "campinas",
              user: Actor = Depends(current_actor), db: Session = Depends(session)):
    ctx = gate(db, user, unidade, "compras.pedido")
    row = order(db, ctx, order_id)
    require_order_scope(db, ctx, row, "compras.pedido")
    if row["status"] in {"RASCUNHO", "REAPROVACAO", "CANCELADO"}:
        raise HTTPException(409, "Emita o pedido aprovado antes de baixar o PDF")
    from io import BytesIO
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.utils import ImageReader
    from reportlab.pdfgen import canvas
    detail = order_detail(db, ctx, row)
    output = BytesIO()
    pdf = canvas.Canvas(output, pagesize=A4)
    width, height = A4
    navy = colors.HexColor("#102A43")
    teal = colors.HexColor("#0F766E")
    pdf.setFillColor(navy); pdf.rect(0, height-100, width, 100, fill=1, stroke=0)
    assets = Path(os.getenv("SUPRIMENTOS_PUBLIC_DIR", "")) / "unificado" / "assets" / "img"
    for filename, x, box_w, box_h in (("logo-concrefer.png", 38, 86, 37),
                                      ("logo-concretrack.png", width-91, 52, 52)):
        path = assets / filename
        if path.is_file():
            pdf.setFillColor(colors.white)
            pdf.roundRect(x-5, height-8-box_h, box_w, box_h, 5, fill=1, stroke=0)
            pdf.drawImage(ImageReader(str(path)), x, height-4-box_h,
                          width=box_w-10, height=box_h-8,
                          preserveAspectRatio=True, anchor="c", mask="auto")
    pdf.setFillColor(colors.white); pdf.setFont("Helvetica-Bold", 20)
    pdf.drawString(38, height-63, "Pedido de compra")
    pdf.setFont("Helvetica", 11); pdf.drawString(38, height-82, row["numero"])
    y = height-135
    supplier_data = detail["fornecedor"]
    pdf.setFillColor(navy); pdf.setFont("Helvetica-Bold", 11)
    for label, value in (("Fornecedor", supplier_data["razao"]),
        ("CNPJ", supplier_data["cnpj"]), ("Entrega prevista", row["entrega_prevista"].strftime("%d/%m/%Y") if row["entrega_prevista"] else "A combinar"),
        ("Pagamento", supplier_data.get("condicao_pagamento") or "A combinar"),
        ("Frete", supplier_data.get("frete_padrao") or "A combinar"),
        ("Local de entrega", "Campinas - Almoxarifado geral")):
        pdf.drawString(38, y, f"{label}:")
        pdf.setFont("Helvetica", 11); pdf.drawString(160, y, str(value)[:72])
        pdf.setFont("Helvetica-Bold", 11); y -= 23
    y -= 16
    pdf.setFillColor(teal); pdf.rect(38, y-8, width-76, 27, fill=1, stroke=0)
    pdf.setFillColor(colors.white); pdf.setFont("Helvetica-Bold", 9)
    pdf.drawString(45, y, "Solicitação / item")
    pdf.drawRightString(width-205, y, "Qtd")
    pdf.drawRightString(width-125, y, "Preço unit.")
    pdf.drawRightString(width-45, y, "Total posto")
    y -= 28
    pdf.setFillColor(navy); pdf.setFont("Helvetica", 9)
    for item in detail["itens"]:
        if y < 90:
            pdf.showPage(); y = height-45
        label = f"{item['solicitacao_numero']} - {item.get('descricao_livre') or str(item.get('material_id'))}"
        pdf.drawString(45, y, label[:46])
        quantity = Decimal(str(item["qtd"]))
        pdf.drawRightString(width-205, y, f"{quantity:,.2f}".rstrip("0").rstrip("."))
        pdf.drawRightString(width-125, y, "R$ " + f"{Decimal(str(item['preco_unit'])):,.2f}".replace(",", "X").replace(".", ",").replace("X", "."))
        pdf.drawRightString(width-45, y, "R$ " + f"{Decimal(str(item['custo_posto'])):,.2f}".replace(",", "X").replace(".", ",").replace("X", "."))
        y -= 20
    y -= 14
    pdf.setFont("Helvetica-Bold", 12)
    total_pt = f"{Decimal(str(row['valor_total'])):,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
    pdf.drawRightString(width-45, y, f"Total: R$ {total_pt}")
    y -= 30
    pdf.setFont("Helvetica", 9)
    for line in (row["condicoes_gerais"] or "Conferir quantidades e apresentar a NF na entrega.").splitlines()[:8]:
        pdf.drawString(38, y, line[:100]); y -= 14
    pdf.setFont("Helvetica", 8)
    pdf.drawString(38, 38, f"Documento gerado eletronicamente - {date.today().strftime('%d/%m/%Y')}")
    pdf.save()
    return Response(output.getvalue(), media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{row["numero"]}.pdf"',
                 "Cache-Control": "private, no-store"})
