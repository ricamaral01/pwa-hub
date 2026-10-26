"""S3-B: recebimento versionado, conferência humana, inspeção e NC pendente.

Nenhum dado sugerido pelo leitor de NF entra no pedido sem confirmação explícita.
"""
from __future__ import annotations

import os
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from fastapi.encoders import jsonable_encoder
from fastapi.responses import FileResponse
from sqlalchemy import and_, func, insert, select, text, update
from sqlalchemy.orm import Session

from ..auth import Actor, check_action, context, current_actor
from ..db import session, table
from ..ids import uuid7
from ..workflow import change, get_request, record_event
from .compras import (audit, changed, ident, money, order, order_items,
                      private_file, weights)
from .estoque import movement
from .solicitacoes import upload_root

router = APIRouter(prefix="/api/suprimentos/recebimentos", tags=["Recebimento S3-B"])
UTC = timezone.utc
ZERO = Decimal("0")


def gate(db: Session, user: Actor, unidade: str, action: str):
    ctx = context(unidade, user, db)
    if not any(ctx.has(action, str(role["cc_id"]) if role["cc_id"] is not None else None)
               for role in ctx.roles):
        raise HTTPException(403, "Ação não concedida para esta unidade")
    check_action(ctx, "catalogo.ver", write=True, phase="S3B", db=db)
    return ctx


def receipt(db: Session, ctx, receipt_id: str, *, lock: bool = False):
    t = table("sup_recebimento")
    query = select(t).where(and_(t.c.id == ident(receipt_id, "Recebimento"),
                                  t.c.unidade_id == ctx.unit_id))
    if lock:
        query = query.with_for_update()
    row = db.execute(query).mappings().one_or_none()
    if not row:
        raise HTTPException(404, "Recebimento não encontrado nesta unidade")
    return dict(row)


def items(db, ctx, row):
    t = table("sup_recebimento_item")
    return [dict(x) for x in db.execute(select(t).where(and_(
        t.c.recebimento_id == row["id"], t.c.unidade_id == ctx.unit_id))
        .order_by(t.c.criado_em)).mappings().all()]


def require_scope(db, ctx, row, action):
    order_row = order(db, ctx, str(row["pedido_id"]))
    for line in order_items(db, ctx, order_row["id"]):
        check_action(ctx, action, str(line["cc_id"]), write=True, phase="S3B", db=db)
    return order_row


def detail(db, ctx, row):
    order_row = order(db, ctx, str(row["pedido_id"]))
    purchase_lines = {x["id"]: x for x in order_items(db, ctx, order_row["id"])}
    material = table("sup_material")
    data = []
    for line in items(db, ctx, row):
        source = purchase_lines[line["pedido_item_id"]]
        description = source["descricao_livre"]
        if line["material_id"]:
            description = db.execute(select(material.c.descricao).where(
                material.c.id == line["material_id"])).scalar_one_or_none() or description
        data.append({**line, "descricao": description or "Item do pedido",
                     "qtd_pedido": source["qtd"],
                     "qtd_saldo_pedido": source["qtd"]-source["qtd_recebida"],
                     "solicitacao_numero": source["solicitacao_numero"]})
    return jsonable_encoder({**row, "pedido_numero": order_row["numero"], "itens": data})


@router.get("")
def list_receipts(unidade: str = "campinas", status: str | None = None,
                  page: int = Query(1, ge=1), size: int = Query(40, ge=1, le=100),
                  user: Actor = Depends(current_actor), db: Session = Depends(session)):
    ctx = gate(db, user, unidade, "recebimento.ver")
    t = table("sup_recebimento")
    where = [t.c.unidade_id == ctx.unit_id]
    if status:
        where.append(t.c.status == status)
    candidates = db.execute(select(t).where(and_(*where)).order_by(t.c.criado_em.desc())).mappings().all()
    allowed = []
    for candidate in candidates:
        lines = order_items(db, ctx, candidate["pedido_id"])
        if all(ctx.has("recebimento.ver", str(line["cc_id"])) for line in lines):
            allowed.append(dict(candidate))
    for candidate in allowed:
        candidate["pedido_numero"] = order(db, ctx, str(candidate["pedido_id"]))["numero"]
    return jsonable_encoder({"total": len(allowed), "page": page, "size": size,
                             "items": allowed[(page-1)*size:page*size]})


@router.get("/sugerir-pedidos")
def suggest_orders(cnpj: str | None = None, material_id: str | None = None,
                   unidade: str = "campinas", user: Actor = Depends(current_actor),
                   db: Session = Depends(session)):
    ctx = gate(db, user, unidade, "recebimento.ver")
    sql = """SELECT DISTINCT p.id,p.numero,p.status,p.entrega_prevista,f.cnpj
      FROM suprimentos.sup_pedido p
      JOIN suprimentos.sup_fornecedor_unidade fu ON fu.id=p.fornecedor_unidade_id
      JOIN suprimentos.sup_fornecedor f ON f.id=fu.fornecedor_id
      JOIN suprimentos.sup_pedido_item pi ON pi.pedido_id=p.id
      JOIN suprimentos.sup_solicitacao_item si ON si.id=pi.solicitacao_item_id
      WHERE p.unidade_id=:unit AND p.status IN ('ENVIADO','PARCIAL')
        AND (CAST(:cnpj AS text) IS NULL OR f.cnpj=:cnpj)
        AND (CAST(:material AS uuid) IS NULL OR si.material_id=CAST(:material AS uuid))
      ORDER BY p.entrega_prevista NULLS LAST LIMIT 100"""
    if cnpj and (not cnpj.isdigit() or len(cnpj) != 14):
        raise HTTPException(422, "CNPJ inválido")
    rows = db.execute(text(sql), {"unit": ctx.unit_id, "cnpj": cnpj,
                                  "material": str(ident(material_id)) if material_id else None}).mappings().all()
    visible = []
    for row in rows:
        if all(ctx.has("recebimento.ver", str(line["cc_id"]))
               for line in order_items(db, ctx, row["id"])):
            visible.append(dict(row))
    return jsonable_encoder({"items": visible})


@router.post("", status_code=201)
def create_receipt(data: dict, unidade: str = "campinas", user: Actor = Depends(current_actor),
                   db: Session = Depends(session)):
    ctx = gate(db, user, unidade, "recebimento.criar")
    order_row = order(db, ctx, str(data.get("pedido_id") or ""), lock=True)
    if order_row["status"] not in {"ENVIADO", "PARCIAL"}:
        raise HTTPException(409, "Pedido não está aguardando recebimento")
    lines = order_items(db, ctx, order_row["id"])
    if not lines:
        raise HTTPException(409, "Pedido sem itens")
    if all(line["qtd_recebida"] >= line["qtd"] for line in lines):
        raise HTTPException(409, "Pedido sem saldo a receber")
    for line in lines:
        check_action(ctx, "recebimento.criar", str(line["cc_id"]), write=True, phase="S3B", db=db)
    number = str(data.get("numero_nf") or "").strip()
    if not number or len(number) > 40:
        raise HTTPException(422, "Número da NF obrigatório (máximo 40 caracteres)")
    cnpj = str(data.get("cnpj_nf") or "").strip()
    if cnpj and (not cnpj.isdigit() or len(cnpj) != 14):
        raise HTTPException(422, "CNPJ da NF deve ter 14 dígitos")
    try:
        freight = Decimal(str(data.get("frete_total") or 0).replace(",", "."))
        if not freight.is_finite() or freight < 0 or freight.as_tuple().exponent < -2:
            raise ValueError()
    except (ValueError, TypeError):
        raise HTTPException(422, "Frete total inválido") from None
    rid = uuid7()
    t, it = table("sup_recebimento"), table("sup_recebimento_item")
    db.execute(insert(t).values(id=rid, unidade_id=ctx.unit_id, pedido_id=order_row["id"],
        numero_nf=number, chave_nf=data.get("chave_nf") or None,
        cnpj_nf=cnpj or None, frete_total=freight, **audit(user)))
    for line in lines:
        if line["qtd_recebida"] >= line["qtd"]:
            continue
        db.execute(insert(it).values(id=uuid7(), unidade_id=ctx.unit_id, recebimento_id=rid,
            pedido_item_id=line["id"], material_id=line["material_id"],
            qtd_nf=ZERO, qtd_contada=ZERO, preco_nf=line["preco_unit"],
            destino="CROSS_DOCKING" if line["solicitacao_item_id"] else "ALMOXARIFADO",
            **audit(user)))
    record_event(db, ctx, rid, None, "RASCUNHO", "NF manual iniciada", target_type="recebimento")
    db.commit()
    return detail(db, ctx, receipt(db, ctx, str(rid)))


@router.get("/{receipt_id}")
def get_receipt(receipt_id: str, unidade: str = "campinas",
                user: Actor = Depends(current_actor), db: Session = Depends(session)):
    ctx = gate(db, user, unidade, "recebimento.ver")
    row = receipt(db, ctx, receipt_id)
    require_scope(db, ctx, row, "recebimento.ver")
    return detail(db, ctx, row)


@router.put("/{receipt_id}/itens/{item_id}")
def set_item(receipt_id: str, item_id: str, data: dict, unidade: str = "campinas",
             user: Actor = Depends(current_actor), db: Session = Depends(session)):
    ctx = gate(db, user, unidade, "recebimento.criar")
    row = receipt(db, ctx, receipt_id, lock=True)
    require_scope(db, ctx, row, "recebimento.criar")
    if row["status"] != "RASCUNHO":
        raise HTTPException(409, "Só o rascunho pode ser editado")
    t = table("sup_recebimento_item")
    found = db.execute(select(t).where(and_(t.c.id == ident(item_id), t.c.recebimento_id == row["id"],
        t.c.unidade_id == ctx.unit_id)).with_for_update()).mappings().one_or_none()
    if not found:
        raise HTTPException(404, "Item não encontrado")
    values = {}
    for field in ("qtd_nf", "qtd_contada", "preco_nf", "ipi_valor"):
        if field in data:
            try:
                value = Decimal(str(data[field]).replace(",", "."))
                if not value.is_finite() or value < 0:
                    raise ValueError()
            except (ValueError, TypeError):
                raise HTTPException(422, f"{field} inválido") from None
            values[field] = value
    for field in ("lote", "numero_ca", "inspecao_parecer"):
        if field in data:
            values[field] = str(data[field] or "").strip()[:500] or None
    for field in ("fds_presente", "embalagem_ok", "quantidade_ok"):
        if field in data:
            if not isinstance(data[field], bool):
                raise HTTPException(422, f"{field} deve ser booleano")
            values[field] = data[field]
    if "validade" in data:
        try:
            values["validade"] = date.fromisoformat(data["validade"]) if data["validade"] else None
        except (TypeError, ValueError):
            raise HTTPException(422, "Validade inválida") from None
    if "destino" in data:
        if data["destino"] not in {"CROSS_DOCKING", "ALMOXARIFADO", "DEVOLUCAO"}:
            raise HTTPException(422, "Destino inválido")
        values["destino"] = data["destino"]
    if "endereco_id" in data:
        values["endereco_id"] = ident(data["endereco_id"]) if data["endereco_id"] else None
    db.execute(update(t).where(t.c.id == found["id"]).values(**values, **changed(user)))
    db.commit()
    return detail(db, ctx, receipt(db, ctx, receipt_id))


@router.post("/{receipt_id}/nf", status_code=201)
async def attach_nf(receipt_id: str, arquivo: UploadFile = File(...), unidade: str = "campinas",
                    user: Actor = Depends(current_actor), db: Session = Depends(session)):
    ctx = gate(db, user, unidade, "recebimento.criar")
    row = receipt(db, ctx, receipt_id, lock=True)
    require_scope(db, ctx, row, "recebimento.criar")
    if row["status"] != "RASCUNHO":
        raise HTTPException(409, "Anexo somente em rascunho")
    if row["anexo_path"]:
        raise HTTPException(409, "NF já anexada; crie uma nova versão para substituí-la")
    content = await arquivo.read(12*1024*1024+1)
    if not content or len(content) > 12*1024*1024:
        raise HTTPException(422, "A NF deve ter até 12 MB")
    path, digest, mime = private_file(db, ctx, row["id"], arquivo, content, "nf")
    configured = bool(os.getenv("SUPRIMENTOS_NF_PROVIDER_URL") and os.getenv("SUPRIMENTOS_NF_PROVIDER_KEY"))
    job_id = uuid7()
    db.execute(insert(table("sup_nf_job")).values(id=job_id, unidade_id=ctx.unit_id,
        recebimento_id=row["id"], status="PENDENTE" if configured else "DESLIGADO", **audit(user)))
    db.execute(update(table("sup_recebimento")).where(table("sup_recebimento").c.id == row["id"])
        .values(anexo_path=str(path), anexo_sha256=digest, anexo_mime=mime, nf_job_id=job_id,
                **changed(user)))
    db.commit()
    return {"job_id": str(job_id), "status": "PENDENTE" if configured else "DESLIGADO",
            "sha256": digest}


@router.get("/{receipt_id}/nf")
def download_nf(receipt_id: str, unidade: str = "campinas",
                user: Actor = Depends(current_actor), db: Session = Depends(session)):
    ctx = gate(db, user, unidade, "recebimento.ver")
    row = receipt(db, ctx, receipt_id)
    require_scope(db, ctx, row, "recebimento.ver")
    path = Path(row["anexo_path"] or "").resolve()
    if not row["anexo_path"] or upload_root() not in path.parents or not path.is_file():
        raise HTTPException(404, "NF não anexada")
    return FileResponse(path, media_type=row["anexo_mime"],
                        headers={"Cache-Control": "private, no-store"})


@router.get("/{receipt_id}/job")
def job_status(receipt_id: str, unidade: str = "campinas",
               user: Actor = Depends(current_actor), db: Session = Depends(session)):
    ctx = gate(db, user, unidade, "recebimento.ver")
    row = receipt(db, ctx, receipt_id)
    require_scope(db, ctx, row, "recebimento.ver")
    t = table("sup_nf_job")
    job = db.execute(select(t).where(and_(t.c.recebimento_id == row["id"],
        t.c.unidade_id == ctx.unit_id))).mappings().one_or_none()
    return jsonable_encoder(dict(job)) if job else {"status": "SEM_ANEXO"}


def differences(db, ctx, row):
    order_lines = {x["id"]: x for x in order_items(db, ctx, row["pedido_id"])}
    order_row = order(db, ctx, str(row["pedido_id"]))
    profile = table("sup_fornecedor_unidade")
    company = table("sup_fornecedor")
    supplier_cnpj = db.execute(select(company.c.cnpj).join(profile,
        profile.c.fornecedor_id == company.c.id).where(and_(
        profile.c.id == order_row["fornecedor_unidade_id"],
        profile.c.unidade_id == ctx.unit_id))).scalar_one()
    out = {}
    for line in items(db, ctx, row):
        po = order_lines[line["pedido_item_id"]]
        remaining = po["qtd"] - po["qtd_recebida"]
        issues = {}
        if line["qtd_nf"] != line["qtd_contada"]:
            issues["quantidade_nf_contada"] = {"nf": str(line["qtd_nf"]), "contada": str(line["qtd_contada"])}
        if line["qtd_contada"] > remaining:
            issues["quantidade_acima_pedido"] = {"saldo": str(remaining), "contada": str(line["qtd_contada"])}
        if line["preco_nf"] > po["preco_unit"]:
            issues["preco_acima_pedido"] = {"pedido": str(po["preco_unit"]), "nf": str(line["preco_nf"])}
        if row["cnpj_nf"] and row["cnpj_nf"] != supplier_cnpj:
            issues["cnpj_diferente_fornecedor"] = {"pedido": supplier_cnpj, "nf": row["cnpj_nf"]}
        out[str(line["id"])] = issues
    return out


@router.post("/{receipt_id}/conferir")
def confer(receipt_id: str, data: dict, unidade: str = "campinas",
           user: Actor = Depends(current_actor), db: Session = Depends(session)):
    ctx = gate(db, user, unidade, "recebimento.criar")
    row = receipt(db, ctx, receipt_id, lock=True)
    require_scope(db, ctx, row, "recebimento.criar")
    if row["status"] != "RASCUNHO":
        raise HTTPException(409, "Recebimento já conferido")
    if data.get("confirmo_campos_nf") is not True:
        raise HTTPException(422, "Confirme manualmente os campos da NF")
    if not any(line["qtd_contada"] > 0 for line in items(db, ctx, row)):
        raise HTTPException(422, "Informe a quantidade contada")
    out = differences(db, ctx, row)
    pending = any(v for v in out.values())
    t = table("sup_recebimento_item")
    for key, issues in out.items():
        db.execute(update(t).where(t.c.id == ident(key)).values(divergencia=issues, **changed(user)))
    status = "PENDENTE_COMPRADOR" if pending else "EM_INSPECAO"
    db.execute(update(table("sup_recebimento")).where(table("sup_recebimento").c.id == row["id"])
        .values(status=status, conferido_por=user.id, conferido_em=datetime.now(UTC), **changed(user)))
    record_event(db, ctx, row["id"], "RASCUNHO", status,
                 "NF conferida por humano", target_type="recebimento")
    db.commit()
    return {"status": status, "divergencias": out}


@router.post("/{receipt_id}/resolver")
def resolve(receipt_id: str, data: dict, unidade: str = "campinas",
            user: Actor = Depends(current_actor), db: Session = Depends(session)):
    ctx = gate(db, user, unidade, "recebimento.resolver")
    row = receipt(db, ctx, receipt_id, lock=True)
    require_scope(db, ctx, row, "recebimento.resolver")
    if row["status"] != "PENDENTE_COMPRADOR":
        raise HTTPException(409, "Sem pendência com comprador")
    note = str(data.get("justificativa") or "").strip()
    if len(note) < 10:
        raise HTTPException(422, "Justificativa de ao menos 10 caracteres obrigatória")
    if any("quantidade_acima_pedido" in x for x in differences(db, ctx, row).values()):
        raise HTTPException(409, "Quantidade acima do pedido: retifique a OC antes de receber")
    db.execute(update(table("sup_recebimento")).where(table("sup_recebimento").c.id == row["id"])
        .values(status="EM_INSPECAO", **changed(user)))
    record_event(db, ctx, row["id"], "PENDENTE_COMPRADOR", "EM_INSPECAO",
                 note, target_type="recebimento")
    db.commit()
    return {"status": "EM_INSPECAO"}


@router.get("/criterios/configurados")
def criteria(unidade: str = "campinas", user: Actor = Depends(current_actor),
             db: Session = Depends(session)):
    ctx = gate(db, user, unidade, "recebimento.ver")
    t = table("sup_inspecao_criterio")
    return jsonable_encoder({"items": [dict(x) for x in db.execute(select(t).where(
        t.c.unidade_id == ctx.unit_id).order_by(t.c.categoria)).mappings().all()]})


@router.put("/criterios/{categoria}")
def set_criteria(categoria: str, data: dict, unidade: str = "campinas",
                 user: Actor = Depends(current_actor), db: Session = Depends(session)):
    ctx = gate(db, user, unidade, "recebimento.inspecionar")
    if not any(role["papel"] == "ADMIN" or
               (role["papel"] == "QUALIDADE" and role["cc_id"] is None)
               for role in ctx.roles):
        raise HTTPException(403, "Critérios da unidade exigem Qualidade com acesso a todos os CCs")
    t = table("sup_inspecao_criterio")
    row = db.execute(select(t).where(and_(t.c.unidade_id == ctx.unit_id,
        t.c.categoria == categoria))).mappings().one_or_none()
    if not row:
        raise HTTPException(404, "Categoria sem critério")
    fields = ("exige_ca", "exige_fds", "exige_lote", "exige_validade", "exige_embalagem", "exige_quantidade")
    values = {key: data[key] for key in fields if key in data}
    if not values or any(not isinstance(value, bool) for value in values.values()):
        raise HTTPException(422, "Envie critérios booleanos")
    db.execute(update(t).where(t.c.id == row["id"]).values(**values, **changed(user)))
    db.commit()
    return {"categoria": categoria, **values}


@router.post("/{receipt_id}/inspecionar")
def inspect(receipt_id: str, data: dict, unidade: str = "campinas",
            user: Actor = Depends(current_actor), db: Session = Depends(session)):
    ctx = gate(db, user, unidade, "recebimento.inspecionar")
    row = receipt(db, ctx, receipt_id, lock=True)
    require_scope(db, ctx, row, "recebimento.inspecionar")
    if row["status"] != "EM_INSPECAO":
        raise HTTPException(409, "Recebimento não está em inspeção")
    submitted = data.get("itens")
    if not isinstance(submitted, list) or len(submitted) != len(items(db, ctx, row)):
        raise HTTPException(422, "Inspecione todos os itens")
    t = table("sup_recebimento_item")
    materials = table("sup_material")
    rule = table("sup_inspecao_criterio")
    all_items = {str(x["id"]): x for x in items(db, ctx, row)}
    seen = set()
    for entry in submitted:
        key = str(entry.get("item_id") or "")
        if key not in all_items or key in seen:
            raise HTTPException(422, "Item de inspeção inválido ou duplicado")
        seen.add(key)
        line = all_items[key]
        decision = entry.get("decisao")
        if decision not in {"LIBERADO", "CONDICIONAL", "REPROVADO"}:
            raise HTTPException(422, "Decisão de inspeção inválida")
        reason = str(entry.get("parecer") or "").strip()
        if decision != "LIBERADO" and len(reason) < 8:
            raise HTTPException(422, "Parecer obrigatório para condição ou reprovação")
        if line["material_id"]:
            category = db.execute(select(materials.c.categoria).where(
                materials.c.id == line["material_id"])).scalar_one()
            criterion = db.execute(select(rule).where(and_(rule.c.unidade_id == ctx.unit_id,
                rule.c.categoria == category, rule.c.ativo.is_(True)))).mappings().one_or_none()
        else:
            criterion = None
        if decision != "REPROVADO" and criterion:
            ca_valid = False
            if criterion["exige_ca"] and line["material_id"] and line["numero_ca"]:
                ca = table("sup_epi_ca")
                ca_valid = db.execute(select(ca.c.id).where(and_(
                    ca.c.material_id == line["material_id"],
                    ca.c.numero_ca == line["numero_ca"],ca.c.ativo.is_(True),
                    ca.c.validade >= date.today()))).scalar_one_or_none() is not None
            checks = (("exige_ca", ca_valid),
                      ("exige_fds", line["fds_presente"]),
                      ("exige_lote", bool(line["lote"])),
                      ("exige_validade", bool(line["validade"]) and line["validade"] >= date.today()),
                      ("exige_embalagem", line["embalagem_ok"]),
                      ("exige_quantidade", line["quantidade_ok"]))
            if any(criterion[field] and not ok for field, ok in checks):
                raise HTTPException(409, f"Critérios obrigatórios ausentes no item {key}")
        db.execute(update(t).where(t.c.id == ident(key)).values(inspecao_status=decision,
            inspecao_parecer=reason or None,
            destino="DEVOLUCAO" if decision == "REPROVADO" else line["destino"], **changed(user)))
        if decision == "REPROVADO":
            queue = table("sup_nc_pendente")
            db.execute(insert(queue).values(id=uuid7(), unidade_id=ctx.unit_id,
                recebimento_id=row["id"], recebimento_item_id=line["id"],
                motivo=reason, chave_idempotencia=f"recebimento:{row['id']}:{line['id']}",
                **audit(user)))
    overall = "REPROVADO" if any(x["decisao"] == "REPROVADO" for x in submitted) else (
        "CONDICIONAL" if any(x["decisao"] == "CONDICIONAL" for x in submitted) else "LIBERADO")
    db.execute(update(table("sup_recebimento")).where(table("sup_recebimento").c.id == row["id"])
        .values(inspecao_status=overall,
                inspecao_parecer=str(data.get("parecer") or "").strip() or None,
                **changed(user)))
    record_event(db, ctx, row["id"], "EM_INSPECAO", overall,
                 "Inspeção de recebimento", target_type="recebimento")
    db.commit()
    return {"inspecao_status": overall}


@router.get("/ncs/pendentes")
def pending_ncs(unidade: str = "campinas", user: Actor = Depends(current_actor),
                db: Session = Depends(session)):
    ctx = gate(db, user, unidade, "recebimento.nc")
    t = table("sup_nc_pendente")
    rows = db.execute(select(t).where(and_(t.c.unidade_id == ctx.unit_id,
        t.c.status == "PENDENTE")).order_by(t.c.criado_em)).mappings().all()
    visible=[]
    for item in rows:
        rec=receipt(db,ctx,str(item["recebimento_id"]))
        purchase=order(db,ctx,str(rec["pedido_id"]))
        if all(ctx.has("recebimento.nc",str(line["cc_id"])) for line in
               order_items(db,ctx,purchase["id"])):
            visible.append(dict(item))
    return jsonable_encoder({"items":visible})


@router.post("/ncs/{pending_id}/vincular")
def link_nc(pending_id: str, data: dict, unidade: str = "campinas",
            user: Actor = Depends(current_actor), db: Session = Depends(session)):
    ctx = gate(db, user, unidade, "recebimento.nc")
    nc_id = str(data.get("nc_id") or "").strip()
    if not nc_id or len(nc_id) > 80:
        raise HTTPException(422, "Identificador da NC obrigatório")
    t = table("sup_nc_pendente")
    row = db.execute(select(t).where(and_(t.c.id == ident(pending_id),
        t.c.unidade_id == ctx.unit_id)).with_for_update()).mappings().one_or_none()
    if not row:
        raise HTTPException(404, "Pendência não encontrada")
    rec=receipt(db,ctx,str(row["recebimento_id"]))
    require_scope(db,ctx,rec,"recebimento.nc")
    if row["nc_id"] and row["nc_id"] != nc_id:
        raise HTTPException(409, "Pendência já vinculada a outra NC")
    db.execute(update(t).where(t.c.id == row["id"]).values(status="ENVIADA", nc_id=nc_id,
        **changed(user)))
    db.commit()
    return {"nc_id": nc_id, "status": "ENVIADA"}


def apply_iqf(db, ctx, receipt_row, order_row, receipt_items, user):
    supplier = table("sup_fornecedor_unidade")
    profile = db.execute(select(supplier).where(supplier.c.id == order_row["fornecedor_unidade_id"])
        .with_for_update()).mappings().one()
    if order_row["entrega_prevista"]:
        days_late = (date.today() - order_row["entrega_prevista"]).days
        prazo = 5 if days_late <= 0 else (4 if days_late <= 3 else 3 if days_late <= 7 else 2 if days_late <= 15 else 1)
    else:
        prazo = 3
    quantidade = 5 if not any(x["divergencia"] for x in receipt_items) else 2
    quality = 1 if receipt_row["inspecao_status"] == "REPROVADO" else (
        3 if receipt_row["inspecao_status"] == "CONDICIONAL" else 5)
    documentation = 5 if receipt_row["anexo_path"] and receipt_row["chave_nf"] else (
        4 if receipt_row["anexo_path"] else 3)
    scores = {"prazo": prazo, "quantidade": quantidade, "qualidade": quality,
              "documentacao": documentation, "atendimento": 3}
    weighted = money(sum(Decimal(scores[k])*v for k,v in weights(db,ctx).items())/5)
    t = table("sup_fornecedor_avaliacao")
    evaluation_id = uuid7()
    db.execute(insert(t).values(id=evaluation_id, unidade_id=ctx.unit_id,
        fornecedor_unidade_id=profile["id"], pedido_id=order_row["id"],
        **{f"nota_{k}": v for k,v in scores.items()},
        comentario=f"Automático do recebimento {receipt_row['id']}; atendimento provisório 3/5",
        iqf=weighted, **audit(user)))
    average = db.execute(select(func.avg(t.c.iqf)).where(and_(t.c.unidade_id==ctx.unit_id,
        t.c.fornecedor_unidade_id==profile["id"],
        t.c.avaliado_em>=datetime.now(UTC)-timedelta(days=365),
        t.c.estornada_em.is_(None)))).scalar_one()
    current = money(average)
    previous = Decimal(profile["iqf"]) if profile["iqf"] is not None else None
    trend = "SUBINDO" if previous is not None and current>previous else (
        "CAINDO" if previous is not None and current<previous else "ESTAVEL")
    db.execute(update(supplier).where(supplier.c.id==profile["id"]).values(
        iqf=current,tendencia=trend,**changed(user)))
    return evaluation_id


@router.post("/{receipt_id}/confirmar")
def confirm(receipt_id: str, unidade: str = "campinas",
            user: Actor = Depends(current_actor), db: Session = Depends(session)):
    ctx = gate(db, user, unidade, "recebimento.confirmar")
    row = receipt(db, ctx, receipt_id, lock=True)
    order_row = require_scope(db, ctx, row, "recebimento.confirmar")
    if row["status"] != "EM_INSPECAO" or not row["inspecao_status"]:
        raise HTTPException(409, "Conferência e inspeção obrigatórias")
    po = table("sup_pedido_item")
    req_item = table("sup_solicitacao_item")
    delivery = table("sup_pedido_entrega")
    line_items = items(db, ctx, row)
    by_id = {x["id"]: x for x in order_items(db, ctx, order_row["id"])}
    accepted = [line for line in line_items if line["qtd_contada"] > 0 and
                line["inspecao_status"] != "REPROVADO"]
    freight_base = sum((line["qtd_contada"]*line["preco_nf"] for line in accepted), ZERO)
    freight_left = row["frete_total"]
    if freight_left and not freight_base:
        raise HTTPException(409, "Frete informado sem itens liberados")
    for line in line_items:
        if not line["inspecao_status"]:
            raise HTTPException(409, "Item sem inspeção")
        qty = line["qtd_contada"]
        if qty <= 0 or line["inspecao_status"] == "REPROVADO":
            continue
        target = by_id[line["pedido_item_id"]]
        if target["qtd_recebida"]+qty > target["qtd"]:
            raise HTTPException(409, "Quantidade supera saldo do pedido")
        allocated = (money(row["frete_total"]*(qty*line["preco_nf"])/freight_base)
                     if freight_base and line != accepted[-1] else freight_left)
        freight_left -= allocated
        db.execute(update(table("sup_recebimento_item")).where(
            table("sup_recebimento_item").c.id==line["id"]).values(frete_rateado=allocated,
            **changed(user)))
        if line["material_id"]:
            if not line["endereco_id"]:
                raise HTTPException(422, "Endereço do almoxarifado obrigatório para material")
            unit_cost = (qty*line["preco_nf"]+line["ipi_valor"]+allocated)/qty
            incoming = movement(db,ctx,material_id=line["material_id"],address_id=line["endereco_id"],
                quantity=qty,kind="ENTRADA",key=f"recebimento:{line['id']}:entrada",
                reference_type="RECEBIMENTO",reference_id=line["id"],unit_cost=unit_cost)
            if line["destino"] == "CROSS_DOCKING":
                movement(db,ctx,material_id=line["material_id"],address_id=line["endereco_id"],
                    quantity=-qty,kind="ENTREGA",key=f"recebimento:{line['id']}:saida",
                    reference_type="RECEBIMENTO",reference_id=line["id"])
            db.execute(update(table("sup_recebimento_item")).where(
                table("sup_recebimento_item").c.id==line["id"]).values(custo_unitario=unit_cost,
                **changed(user)))
        db.execute(update(po).where(po.c.id==target["id"]).values(
            qtd_recebida=target["qtd_recebida"]+qty, **changed(user)))
        delivery_id = uuid7()
        db.execute(insert(delivery).values(id=delivery_id,unidade_id=ctx.unit_id,
            pedido_id=order_row["id"],pedido_item_id=target["id"],qtd=qty,
            numero_nf=row["numero_nf"],anexo_path=row["anexo_path"],
            anexo_sha256=row["anexo_sha256"],anexo_mime=row["anexo_mime"],**audit(user)))
        db.execute(update(table("sup_recebimento_item")).where(
            table("sup_recebimento_item").c.id==line["id"]).values(entrega_id=delivery_id,
            **changed(user)))
        if line["destino"]=="CROSS_DOCKING":
            requested=db.execute(select(req_item).where(and_(req_item.c.id==target["solicitacao_item_id"],
                req_item.c.unidade_id==ctx.unit_id)).with_for_update()).mappings().one()
            request=get_request(db,ctx,requested["solicitacao_id"],lock=True)
            delivered=requested["qtd_entregue"]+qty
            if delivered>requested["qtd"]:
                raise HTTPException(409,"Quantidade supera a solicitação")
            db.execute(update(req_item).where(req_item.c.id==requested["id"]).values(
                qtd_entregue=delivered,status="ENTREGUE" if delivered==requested["qtd"] else "SEPARADO",
                **changed(user)))
            if request["status"]=="APROVADA":
                change(db,ctx,request,"EM_ATENDIMENTO",allowed=("APROVADA",))
            incomplete=db.execute(select(func.count()).select_from(req_item).where(and_(
                req_item.c.solicitacao_id==request["id"],req_item.c.unidade_id==ctx.unit_id,
                req_item.c.status.not_in(("ENTREGUE","CANCELADO"))))).scalar_one()
            if incomplete==0:
                refreshed=get_request(db,ctx,requested["solicitacao_id"],lock=True)
                change(db,ctx,refreshed,"ENTREGUE",allowed=("EM_ATENDIMENTO",),
                    entregue_em=datetime.now(UTC))
        record_event(db,ctx,line["id"],None,"RECEBIDO",
            f"NF {row['numero_nf']}; quantidade {qty}; entrega {delivery_id}",target_type="recebimento_item")
    remaining=db.execute(select(func.count()).select_from(po).where(and_(po.c.pedido_id==order_row["id"],
        po.c.unidade_id==ctx.unit_id,po.c.qtd_recebida<po.c.qtd))).scalar_one()
    new_status="PARCIAL" if remaining else "RECEBIDO"
    db.execute(update(table("sup_pedido")).where(table("sup_pedido").c.id==order_row["id"])
        .values(status=new_status,nf_numero=row["numero_nf"],**changed(user)))
    evaluation_id=apply_iqf(db,ctx,row,order_row,line_items,user)
    db.execute(update(table("sup_recebimento")).where(table("sup_recebimento").c.id==row["id"])
        .values(status="CONFIRMADO",avaliacao_id=evaluation_id,**changed(user)))
    record_event(db,ctx,row["id"],"EM_INSPECAO","CONFIRMADO",
        f"NF confirmada; pedido {new_status}",target_type="recebimento")
    db.commit()
    return {"status":"CONFIRMADO","pedido_status":new_status,"avaliacao_id":str(evaluation_id)}


@router.post("/{receipt_id}/atendimento")
def rate_attendance(receipt_id: str, data: dict, unidade: str = "campinas",
                    user: Actor = Depends(current_actor), db: Session = Depends(session)):
    ctx = gate(db, user, unidade, "fornecedor.avaliar")
    row = receipt(db, ctx, receipt_id, lock=True)
    require_scope(db, ctx, row, "fornecedor.avaliar")
    if row["status"] != "CONFIRMADO" or not row["avaliacao_id"]:
        raise HTTPException(409, "Avaliação disponível somente após confirmação")
    try:
        score = Decimal(str(data.get("nota")))
        if not score.is_finite() or score < 1 or score > 5 or score.as_tuple().exponent < -1:
            raise ValueError()
    except (ValueError, TypeError):
        raise HTTPException(422, "Nota de atendimento entre 1 e 5") from None
    t = table("sup_fornecedor_avaliacao")
    evaluation = db.execute(select(t).where(and_(t.c.id == row["avaliacao_id"],
        t.c.unidade_id == ctx.unit_id)).with_for_update()).mappings().one()
    scores = {key: evaluation[f"nota_{key}"] for key in
              ("prazo", "quantidade", "qualidade", "documentacao")}
    scores["atendimento"] = score
    weighted = money(sum(scores[key]*weight for key,weight in weights(db,ctx).items())/5)
    db.execute(update(t).where(t.c.id == evaluation["id"]).values(
        nota_atendimento=score,iqf=weighted,comentario=str(data.get("comentario") or "").strip() or
        evaluation["comentario"],**changed(user)))
    average = db.execute(select(func.avg(t.c.iqf)).where(and_(t.c.unidade_id==ctx.unit_id,
        t.c.fornecedor_unidade_id==evaluation["fornecedor_unidade_id"],
        t.c.estornada_em.is_(None),
        t.c.avaliado_em>=datetime.now(UTC)-timedelta(days=365)))).scalar_one()
    profile = table("sup_fornecedor_unidade")
    db.execute(update(profile).where(profile.c.id==evaluation["fornecedor_unidade_id"])
        .values(iqf=money(average),**changed(user)))
    db.execute(update(table("sup_recebimento")).where(table("sup_recebimento").c.id==row["id"])
        .values(atendimento_confirmado_em=datetime.now(UTC),
                atendimento_confirmado_por=user.id,**changed(user)))
    record_event(db,ctx,row["id"],"IQF_ATENDIMENTO", "IQF_ATENDIMENTO",
                 f"Atendimento avaliado em {score}/5",target_type="recebimento")
    db.commit()
    return {"avaliacao_id":str(evaluation["id"]),"nota_atendimento":str(score),
            "iqf":str(weighted)}


@router.post("/{receipt_id}/estornar")
def reverse(receipt_id: str, data: dict, unidade: str = "campinas",
            user: Actor = Depends(current_actor), db: Session = Depends(session)):
    ctx=gate(db,user,unidade,"recebimento.confirmar")
    row=receipt(db,ctx,receipt_id,lock=True)
    order_row=require_scope(db,ctx,row,"recebimento.confirmar")
    if row["status"]!="CONFIRMADO":
        raise HTTPException(409,"Somente recebimento confirmado pode ser estornado")
    reason=str(data.get("motivo") or "").strip()
    if len(reason)<10:
        raise HTTPException(422,"Motivo do estorno obrigatório (10 caracteres)")
    po,req_item,delivery,ledger=(table(x) for x in ("sup_pedido_item","sup_solicitacao_item",
        "sup_pedido_entrega","sup_movimento"))
    for line in items(db,ctx,row):
        qty=line["qtd_contada"]
        if line["inspecao_status"]=="REPROVADO" or qty<=0:
            continue
        if line["material_id"]:
            movements=db.execute(select(ledger).where(and_(ledger.c.unidade_id==ctx.unit_id,
                ledger.c.referencia_tipo=="RECEBIMENTO",ledger.c.referencia_id==line["id"]))
                .order_by(ledger.c.id.desc())).mappings().all()
            for original in movements:
                movement(db,ctx,material_id=line["material_id"],address_id=line["endereco_id"],
                    quantity=-original["quantidade"],kind="ESTORNO",
                    key=f"recebimento:{line['id']}:estorno:{original['id']}",
                    reference_type="RECEBIMENTO",reference_id=line["id"],
                    unit_cost=original["custo_unitario"],reverses=original["id"])
        if line["entrega_id"]:
            db.execute(update(delivery).where(and_(delivery.c.id==line["entrega_id"],
                delivery.c.unidade_id==ctx.unit_id)).values(estornado_em=datetime.now(UTC),
                estornado_por=user.id,**changed(user)))
        target=db.execute(select(po).where(and_(po.c.id==line["pedido_item_id"],
            po.c.unidade_id==ctx.unit_id)).with_for_update()).mappings().one()
        db.execute(update(po).where(po.c.id==target["id"]).values(
            qtd_recebida=target["qtd_recebida"]-qty,**changed(user)))
        # A entrega histórica permanece rastreável; o documento de estorno a compensa.
        if line["destino"]=="CROSS_DOCKING":
            requested=db.execute(select(req_item).where(req_item.c.id==target["solicitacao_item_id"])
                .with_for_update()).mappings().one()
            remaining=requested["qtd_entregue"]-qty
            if remaining<0:
                raise HTTPException(409,"Entrega já foi movimentada; estorno exige ajuste operacional")
            db.execute(update(req_item).where(req_item.c.id==requested["id"]).values(
                qtd_entregue=remaining,status="SEPARADO" if remaining else "PENDENTE",**changed(user)))
            request=get_request(db,ctx,requested["solicitacao_id"],lock=True)
            if request["status"]=="ENTREGUE":
                db.execute(update(table("sup_solicitacao")).where(
                    table("sup_solicitacao").c.id==request["id"]).values(
                    status="EM_ATENDIMENTO",entregue_em=None,**changed(user)))
    if row["avaliacao_id"]:
        review=table("sup_fornecedor_avaliacao")
        db.execute(update(review).where(review.c.id==row["avaliacao_id"]).values(
            estornada_em=datetime.now(UTC),**changed(user)))
        profile=table("sup_fornecedor_unidade")
        remaining_iqf=db.execute(select(func.avg(review.c.iqf)).where(and_(
            review.c.unidade_id==ctx.unit_id,review.c.fornecedor_unidade_id==order_row["fornecedor_unidade_id"],
            review.c.estornada_em.is_(None),
            review.c.avaliado_em>=datetime.now(UTC)-timedelta(days=365)))).scalar_one()
        db.execute(update(profile).where(profile.c.id==order_row["fornecedor_unidade_id"]).values(
            iqf=money(remaining_iqf) if remaining_iqf is not None else None,
            tendencia="ESTAVEL",**changed(user)))
    db.execute(update(table("sup_recebimento")).where(table("sup_recebimento").c.id==row["id"])
        .values(status="ESTORNADO",**changed(user)))
    db.execute(update(table("sup_pedido")).where(table("sup_pedido").c.id==order_row["id"])
        .values(status="PARCIAL",**changed(user)))
    rid=uuid7()
    db.execute(insert(table("sup_recebimento")).values(id=rid,unidade_id=ctx.unit_id,
        pedido_id=order_row["id"],numero_nf=row["numero_nf"],chave_nf=row["chave_nf"],
        cnpj_nf=row["cnpj_nf"],versao=row["versao"]+1,anterior_id=row["id"],**audit(user)))
    t=table("sup_recebimento_item")
    for line in items(db,ctx,row):
        db.execute(insert(t).values(id=uuid7(),unidade_id=ctx.unit_id,
            recebimento_id=rid,pedido_item_id=line["pedido_item_id"],material_id=line["material_id"],
            qtd_nf=line["qtd_nf"],qtd_contada=line["qtd_contada"],preco_nf=line["preco_nf"],
            ipi_valor=line["ipi_valor"],frete_rateado=line["frete_rateado"],
            destino=line["destino"] if line["destino"]!="DEVOLUCAO" else "CROSS_DOCKING",
            endereco_id=line["endereco_id"],lote=line["lote"],validade=line["validade"],
            numero_ca=line["numero_ca"],fds_presente=line["fds_presente"],
            embalagem_ok=line["embalagem_ok"],quantidade_ok=line["quantidade_ok"],**audit(user)))
    record_event(db,ctx,row["id"],"CONFIRMADO","ESTORNADO",reason,target_type="recebimento")
    db.commit()
    return {"status":"ESTORNADO","nova_versao_id":str(rid),"versao":row["versao"]+1}
