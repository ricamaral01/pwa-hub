"""Cadastros S0: CRUD lógico e importação CSV atômica."""
from __future__ import annotations
import csv
import io
import re
from datetime import date, datetime, timezone
from decimal import Decimal, InvalidOperation
from uuid import UUID
from fastapi import APIRouter, Depends, File, HTTPException, Query, Request, UploadFile
from fastapi.encoders import jsonable_encoder
from sqlalchemy import and_, func, insert, or_, select, text, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from ..auth import Actor, check_action, context, current_actor
from ..db import session, table
from ..ids import uuid7

router = APIRouter(prefix="/api/suprimentos", tags=["Suprimentos cadastros"])
ADMIN = "cadastro.admin"
RESOURCE = {
    "unidades": ("sup_unidade", ADMIN, False, {"codigo", "nome"}, {"codigo", "nome"}),
    "unidades-medida": ("sup_unidade_medida", ADMIN, False, {"sigla", "descricao"}, {"sigla", "descricao"}),
    "materiais": ("sup_material", "cadastro.material", False, {"codigo", "descricao", "categoria", "un_estoque", "controla_estoque", "dominio", "exige_ca", "patrimoniado"}, {"codigo", "descricao", "categoria", "un_estoque", "dominio"}),
    "conversoes": ("sup_conversao", ADMIN, False, {"material_id", "de_un", "para_un", "fator"}, {"material_id", "de_un", "para_un", "fator"}),
    "epi-ca": ("sup_epi_ca", ADMIN, False, {"material_id", "numero_ca", "validade"}, {"material_id", "numero_ca", "validade"}),
    "fornecedores": ("sup_fornecedor", "cadastro.fornecedor", False, {"cnpj", "razao", "categorias", "situacao"}, {"cnpj", "razao"}),
    "materiais-unidade": ("sup_material_unidade", "cadastro.material_unidade", True, {"material_id", "ponto_pedido", "estoque_minimo", "lote_economico", "lead_time_dias", "seguranca_dias"}, {"material_id"}),
    "locais": ("sup_local", "cadastro.local", True, {"tipo", "nome"}, {"tipo", "nome"}),
    "enderecos": ("sup_endereco", "cadastro.local", True, {"local_id", "codigo"}, {"local_id", "codigo"}),
    "centros-custo": ("sup_centro_custo", ADMIN, True, {"codigo", "nome", "setor"}, {"codigo", "nome"}),
    "alcadas": ("sup_alcada", ADMIN, True, {"cc_id", "categoria", "valor_ate", "nivel", "papel_aprovador", "a_confirmar"}, {"nivel", "papel_aprovador"}),
    "parametros": ("sup_parametro", ADMIN, True, {"chave", "valor", "a_confirmar"}, {"chave", "valor"}),
    "usuarios-papeis": ("sup_usuario_papel", ADMIN, True, {"iam_user_id", "papel", "cc_id", "nivel"}, {"iam_user_id", "papel"}),
    "flags": ("sup_flag", ADMIN, True, {"fase", "habilitado"}, {"fase", "habilitado"}),
}
UUID_FIELDS = {"material_id", "un_estoque", "de_un", "para_un", "local_id", "cc_id"}
NUMERIC_FIELDS = {"fator", "ponto_pedido", "estoque_minimo", "lote_economico", "valor_ate", "valor"}
INTEGER_FIELDS = {"lead_time_dias", "seguranca_dias", "nivel"}
BOOLEAN_FIELDS = {"controla_estoque", "exige_ca", "patrimoniado", "a_confirmar", "habilitado"}
CATEGORIES = {"EPI", "ABRASIVO", "FERRAMENTA", "CONSUMIVEL_PRODUCAO", "MANUTENCAO", "LIMPEZA_ESCRITORIO", "INSUMO_USINA", "OUTROS"}

def cnpj_valid(value: str) -> bool:
    if not re.fullmatch(r"\d{14}", value) or len(set(value)) == 1:
        return False
    digits = [int(x) for x in value]
    for count, weights in ((12, (5,4,3,2,9,8,7,6,5,4,3,2)), (13, (6,5,4,3,2,9,8,7,6,5,4,3,2))):
        remainder = sum(a*b for a,b in zip(digits[:count], weights)) % 11
        if digits[count] != (0 if remainder < 2 else 11 - remainder):
            return False
    return True

def config(resource: str):
    result = RESOURCE.get(resource)
    if result is None:
        raise HTTPException(404, "Cadastro não encontrado")
    return result

def normalize(resource: str, data: dict, *, creating: bool):
    _name, _action, _unit, fields, required = config(resource)
    if not isinstance(data, dict) or set(data) - fields:
        raise HTTPException(422, "Campos inválidos para este cadastro")
    if creating and any(data.get(field) in (None, "") for field in required):
        raise HTTPException(422, "Campos obrigatórios ausentes")
    values = dict(data)
    try:
        for key, value in values.items():
            if value is None:
                continue
            if key in UUID_FIELDS:
                values[key] = UUID(str(value))
            elif key in NUMERIC_FIELDS:
                values[key] = Decimal(str(value).replace(",", "."))
            elif key in INTEGER_FIELDS:
                values[key] = int(value)
            elif key in BOOLEAN_FIELDS:
                if not isinstance(value, bool):
                    raise ValueError()
            elif key == "validade":
                values[key] = date.fromisoformat(value)
            elif key == "categorias":
                if not isinstance(value, list) or any(not isinstance(x, str) for x in value):
                    raise ValueError()
            elif isinstance(value, str):
                values[key] = value.strip()
        if "cnpj" in values and not cnpj_valid(str(values["cnpj"])):
            raise ValueError("CNPJ inválido")
        if "categoria" in values and values["categoria"] not in CATEGORIES:
            raise ValueError("Categoria inválida")
        if "dominio" in values and values["dominio"] not in {"almoxarifado", "insumo_usina"}:
            raise ValueError("Domínio inválido")
        if "categoria" in values and "dominio" in values and (values["categoria"] == "INSUMO_USINA") != (values["dominio"] == "insumo_usina"):
            raise ValueError("Categoria e domínio incompatíveis")
        if "fator" in values and values["fator"] <= 0:
            raise ValueError("Fator deve ser positivo")
        if "valor_ate" in values and values["valor_ate"] is not None and values["valor_ate"] <= 0:
            raise ValueError("Valor de alçada deve ser positivo")
        if "nivel" in values and values["nivel"] < 1:
            raise ValueError("Nível inválido")
    except (ValueError, TypeError, InvalidOperation) as exc:
        raise HTTPException(422, str(exc) or "Valor inválido") from None
    return values

def unit_context(db: Session, user: Actor, unit_code: str, action: str, *, write: bool = False):
    ctx = context(unit_code, user, db)
    check_action(ctx, action, write=write, db=db)
    return ctx

def guard_legacy_supplier_write(db: Session, ctx, resource: str):
    """Once S3-A is active, supplier changes must use its audited unit profile."""
    if resource != "fornecedores":
        return
    flag = table("sup_flag")
    enabled = db.execute(select(flag.c.habilitado).where(and_(
        flag.c.unidade_id == ctx.unit_id, flag.c.fase == "S3A"))).scalar_one_or_none()
    if enabled:
        raise HTTPException(409, "Use a ficha de Fornecedores do módulo Compras")

def key_where(t, key: str, ctx):
    primary = t.c.get("id")
    if primary is None:
        primary = t.c.get("material_id")
    try:
        value = UUID(key) if str(primary.type).upper() == "UUID" else key
    except ValueError:
        raise HTTPException(404, "Registro não encontrado") from None
    where = primary == value
    if t.c.get("unidade_id") is not None:
        where = and_(where, t.c.unidade_id == ctx.unit_id)
    return where

def permitted_read(ctx, resource):
    # Catálogos de apoio são visíveis a todos os papéis, mas não expõem saldos/preços.
    if not ctx.has("catalogo.ver") and not ctx.has("cadastro.admin"):
        raise HTTPException(403, "Sem acesso ao catálogo")
    if resource in {"usuarios-papeis", "flags", "alcadas", "parametros"} and not ctx.has("cadastro.admin"):
        raise HTTPException(403, "Cadastro administrativo")

def visible_centers(ctx):
    """A lista de CCs não amplia o escopo de um papel restrito."""
    if any(role["cc_id"] is None for role in ctx.roles):
        return None
    return [role["cc_id"] for role in ctx.roles]

@router.get("/health")
def health(db: Session = Depends(session)):
    db.execute(select(func.current_timestamp())).scalar_one()
    return {"ok": True, "modulo": "suprimentos"}


@router.get("/flags")
def flags_for_gateway(request: Request, unidade: str = "campinas", db: Session = Depends(session)):
    """Somente o gateway local lê a flag efetiva; sem usuário nem dados de negócio."""
    if request.client is None or request.client.host not in {"127.0.0.1", "::1"}:
        raise HTTPException(403, "Consulta interna")
    u = table("sup_unidade")
    unit_id = db.execute(select(u.c.id).where(and_(u.c.codigo == unidade, u.c.ativo.is_(True)))).scalar_one_or_none()
    if unit_id is None:
        return {"unidade": unidade, "flags": {}}
    f = table("sup_flag")
    rows = db.execute(select(f.c.fase, f.c.habilitado).where(f.c.unidade_id == unit_id)).all()
    return {"unidade": unidade, "flags": {row.fase: bool(row.habilitado) for row in rows}}

@router.get("/me")
def me(unidade: str = "campinas", user: Actor = Depends(current_actor), db: Session = Depends(session)):
    ctx = context(unidade, user, db)
    f = table("sup_flag")
    flags = {r["fase"]: r["habilitado"] for r in db.execute(select(f).where(f.c.unidade_id == ctx.unit_id)).mappings()}
    return {"id": user.id, "nome": user.name, "unidade": unidade,
            "papeis": [{"papel": r["papel"], "cc_id": str(r["cc_id"]) if r["cc_id"] else None,
                         "nivel": r["nivel"]} for r in ctx.roles], "flags": flags}

@router.get("/cadastros/{resource}")
def list_cadastro(resource: str, unidade: str = "campinas", q: str = "", page: int = Query(1, ge=1),
                  size: int = Query(25, ge=1, le=100), ativo: bool | None = True,
                  user: Actor = Depends(current_actor), db: Session = Depends(session)):
    name, _action, unit_scoped, _fields, _required = config(resource)
    ctx = context(unidade, user, db); permitted_read(ctx, resource)
    t = table(name)
    filters = []
    if unit_scoped:
        filters.append(t.c.unidade_id == ctx.unit_id)
    if resource == "centros-custo" and visible_centers(ctx) is not None:
        filters.append(t.c.id.in_(visible_centers(ctx)))
    if ativo is not None and t.c.get("ativo") is not None:
        filters.append(t.c.ativo == ativo)
    if q:
        searchable = [t.c[field].ilike(f"%{q[:100]}%") for field in ("codigo", "nome", "descricao", "razao", "cnpj", "chave", "sigla", "iam_user_id") if field in t.c]
        if searchable:
            filters.append(or_(*searchable))
    stmt = select(t).where(and_(*filters))
    total = db.execute(select(func.count()).select_from(t).where(and_(*filters))).scalar_one()
    rows = db.execute(stmt.limit(size).offset((page-1)*size)).mappings().all()
    return {"total": total, "page": page, "size": size, "items": jsonable_encoder([dict(row) for row in rows])}

@router.get("/cadastros/{resource}/{item_id}")
def get_cadastro(resource: str, item_id: str, unidade: str = "campinas", user: Actor = Depends(current_actor), db: Session = Depends(session)):
    name, *_ = config(resource)
    ctx = context(unidade, user, db); permitted_read(ctx, resource)
    t = table(name)
    where = key_where(t, item_id, ctx)
    if resource == "centros-custo" and visible_centers(ctx) is not None:
        where = and_(where, t.c.id.in_(visible_centers(ctx)))
    row = db.execute(select(t).where(where)).mappings().one_or_none()
    if not row:
        raise HTTPException(404, "Registro não encontrado")
    return jsonable_encoder(dict(row))

@router.post("/cadastros/{resource}", status_code=201)
def create_cadastro(resource: str, payload: dict, unidade: str = "campinas", user: Actor = Depends(current_actor), db: Session = Depends(session)):
    name, action, unit_scoped, *_ = config(resource)
    ctx = unit_context(db, user, unidade, action, write=True)
    guard_legacy_supplier_write(db, ctx, resource)
    values = normalize(resource, payload, creating=True)
    if unit_scoped:
        values["unidade_id"] = ctx.unit_id
    if name not in {"sup_material_unidade", "sup_unidade"}:
        values["id"] = uuid7()
    values.update(criado_por=user.id, atualizado_por=user.id)
    try:
        if name == "sup_unidade":
            db.execute(text("SELECT pg_advisory_xact_lock(79451314)"))
            values["id"] = db.execute(select(func.coalesce(func.max(table(name).c.id), 0) + 1)).scalar_one()
        row = db.execute(insert(table(name)).values(**values).returning(table(name))).mappings().one()
        db.commit()
    except IntegrityError:
        db.rollback(); raise HTTPException(409, "Código, vínculo ou referência já existente/inválida") from None
    return jsonable_encoder(dict(row))

@router.patch("/cadastros/{resource}/{item_id}")
def edit_cadastro(resource: str, item_id: str, payload: dict, unidade: str = "campinas", user: Actor = Depends(current_actor), db: Session = Depends(session)):
    name, action, _unit, *_ = config(resource)
    ctx = unit_context(db, user, unidade, action, write=True)
    guard_legacy_supplier_write(db, ctx, resource)
    values = normalize(resource, payload, creating=False)
    for immutable in ("material_id", "iam_user_id", "fase", "chave", "codigo"):
        if immutable in values and resource in {"materiais-unidade", "usuarios-papeis", "flags", "parametros"}:
            raise HTTPException(422, "Chave não pode ser alterada")
    if not values:
        raise HTTPException(422, "Nenhuma alteração")
    values.update(atualizado_por=user.id, atualizado_em=datetime.now(timezone.utc))
    t = table(name)
    try:
        row = db.execute(update(t).where(key_where(t, item_id, ctx)).values(**values).returning(t)).mappings().one_or_none()
        db.commit()
    except IntegrityError:
        db.rollback(); raise HTTPException(409, "Código, vínculo ou referência já existente/inválida") from None
    if not row:
        raise HTTPException(404, "Registro não encontrado")
    return jsonable_encoder(dict(row))

@router.post("/cadastros/{resource}/{item_id}/status")
def status_cadastro(resource: str, item_id: str, payload: dict, unidade: str = "campinas", user: Actor = Depends(current_actor), db: Session = Depends(session)):
    name, action, _unit, *_ = config(resource)
    if "ativo" not in table(name).c:
        raise HTTPException(422, "Cadastro não possui ativação")
    if set(payload) != {"ativo"} or not isinstance(payload["ativo"], bool):
        raise HTTPException(422, "Informe ativo=true/false")
    ctx = unit_context(db, user, unidade, action, write=True)
    guard_legacy_supplier_write(db, ctx, resource)
    t = table(name)
    row = db.execute(update(t).where(key_where(t, item_id, ctx)).values(
        ativo=payload["ativo"], atualizado_por=user.id, atualizado_em=datetime.now(timezone.utc)).returning(t)).mappings().one_or_none()
    db.commit()
    if not row:
        raise HTTPException(404, "Registro não encontrado")
    return jsonable_encoder(dict(row))

@router.post("/cadastros/{resource}/importar")
async def import_csv(resource: str, arquivo: UploadFile = File(...), unidade: str = "campinas",
                     user: Actor = Depends(current_actor), db: Session = Depends(session)):
    if resource not in {"materiais", "fornecedores"}:
        raise HTTPException(404, "Importação indisponível")
    ctx = unit_context(db, user, unidade, RESOURCE[resource][1], write=True)
    guard_legacy_supplier_write(db, ctx, resource)
    raw = await arquivo.read(2_000_001)
    if len(raw) > 2_000_000:
        raise HTTPException(413, "CSV excede 2 MB")
    try:
        reader = csv.DictReader(io.StringIO(raw.decode("utf-8-sig"), newline=""))
        expected = ("codigo", "descricao", "categoria", "un_estoque", "dominio", "controla_estoque", "exige_ca", "patrimoniado") if resource == "materiais" else ("cnpj", "razao", "categorias", "situacao")
        if tuple(reader.fieldnames or ()) != expected:
            raise ValueError("Cabeçalho inválido")
        source = list(reader)
    except (UnicodeError, csv.Error, ValueError) as exc:
        raise HTTPException(422, str(exc)) from None
    seen = set(); prepared = []; reports = []
    unit_table = table("sup_unidade_medida")
    units = {row["sigla"]: row["id"] for row in db.execute(select(unit_table)).mappings()}
    target = table(RESOURCE[resource][0])
    unique_col = "codigo" if resource == "materiais" else "cnpj"
    for number, raw_row in enumerate(source, 2):
        try:
            if None in raw_row:
                raise ValueError("Colunas excedentes")
            values = dict(raw_row)
            if resource == "materiais":
                if values["un_estoque"] not in units:
                    raise ValueError("Unidade de medida desconhecida")
                values["un_estoque"] = units[values["un_estoque"]]
                for key in ("controla_estoque", "exige_ca", "patrimoniado"):
                    if values[key].lower() not in {"true", "false", "1", "0"}:
                        raise ValueError(f"Booleano inválido: {key}")
                    values[key] = values[key].lower() in {"true", "1"}
            else:
                values["categorias"] = [x.strip() for x in values["categorias"].split("|") if x.strip()]
            values = normalize(resource, values, creating=True)
            key = values[unique_col]
            if key in seen or db.execute(select(target.c.id).where(target.c[unique_col] == key)).first():
                raise ValueError("Código/CNPJ repetido")
            seen.add(key); prepared.append(values)
            reports.append({"linha": number, "ok": True, "erro": None})
        except (HTTPException, ValueError) as exc:
            reports.append({"linha": number, "ok": False, "erro": exc.detail if isinstance(exc, HTTPException) else str(exc)})
    if any(not row["ok"] for row in reports):
        return {"ok": False, "gravados": 0, "linhas": reports}
    try:
        for values in prepared:
            db.execute(insert(target).values(id=uuid7(), **values, criado_por=user.id, atualizado_por=user.id))
        db.commit()
    except IntegrityError:
        db.rollback(); raise HTTPException(409, "Conflito de importação; nenhuma linha gravada") from None
    return {"ok": True, "gravados": len(prepared), "linhas": reports}
