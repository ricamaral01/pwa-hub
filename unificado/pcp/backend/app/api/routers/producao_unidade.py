"""Unit-scoped production API. Existing Campinas routes are untouched."""
from __future__ import annotations

from datetime import date, datetime, timedelta
from decimal import Decimal
from typing import Literal
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.usuario import NivelAcesso, Usuario
from app.services.pederneiras_rules import (
    assert_can_confirm, posts_per_person, production_summary,
    validate_day, validate_people, validate_quantity,
)

router = APIRouter(prefix="/api/producao/{unidade}", tags=["producao-unidade"])


class ItemInput(BaseModel):
    produto_id: int = Field(gt=0)
    quantidade: int = Field(ge=0)


class ApontamentoInput(BaseModel):
    itens: list[ItemInput]
    acao: Literal["rascunho", "enviar"] = "rascunho"
    origem: Literal["desktop", "pwa"] = "desktop"


class AreaInput(BaseModel):
    atividade_id: int = Field(gt=0)
    homens: Decimal = Field(ge=0)
    observacao: str | None = Field(default=None, max_length=2000)


class MaoDeObraInput(BaseModel):
    areas: list[AreaInput]
    origem: Literal["desktop", "pwa"] = "desktop"


class ProductInput(BaseModel):
    familia: str = Field(min_length=1, max_length=120)
    descricao: str = Field(min_length=1, max_length=255)
    letra: str | None = Field(default=None, max_length=20)
    cod_pro: str | None = Field(default=None, max_length=50)
    cod_sma: str | None = Field(default=None, max_length=50)
    volume_m3: Decimal | None = Field(default=None, ge=0)
    pendencia: str | None = None
    ativo: bool = True


class ReopenInput(BaseModel):
    motivo: str = Field(min_length=5, max_length=500)
    origem: Literal["desktop", "pwa"] = "desktop"


def _unit(db: Session, slug: str) -> dict:
    row = db.execute(text("SELECT id,codigo,nome FROM producao.unidade WHERE codigo=:c AND ativo"), {"c": slug}).mappings().first()
    if not row:
        raise HTTPException(404, "Unidade não encontrada")
    return dict(row)


def _authorize(db: Session, unit: dict, user: Usuario, *, write: bool = False, supervisor: bool = False) -> str:
    # Master administrator is explicitly named in the product requirement.
    if user.username.casefold() == "ricardo" and user.nivel_acesso == NivelAcesso.ADMIN:
        return "supervisor"
    row = db.execute(text("""
        SELECT papel FROM producao.usuario_unidade
        WHERE usuario_id=:user_id AND unidade_id=:unit_id AND ativo
    """), {"user_id": user.id, "unit_id": unit["id"]}).first()
    role = row[0] if row else None
    if role is None or (write and role not in {"gestor", "supervisor"}) or (supervisor and role != "supervisor"):
        raise HTTPException(403, "Sem acesso a esta unidade ou ação")
    return role


def _day(day: date) -> date:
    try:
        return validate_day(day)
    except ValueError as exc:
        raise HTTPException(422, str(exc)) from exc


def _labor_group(unit: dict) -> str:
    # Two-character code fits the legacy day key; unit 1 keeps existing 12/34.
    if unit["id"] > 99:
        raise HTTPException(409, "Código de unidade excede a chave de mão de obra")
    return f"{unit['id']:02d}"


def _audit(db: Session, unit: dict, entity: str, entity_id: int, field: str,
           before: object, after: object, user: Usuario, origin: str):
    if before == after:
        return
    db.execute(text("""
      INSERT INTO producao.auditoria
        (unidade_id,entidade,entidade_id,campo,valor_de,valor_para,usuario,origem)
      VALUES (:uid,:entity,:eid,:field,:before,:after,:user,:origin)
    """), {"uid": unit["id"], "entity": entity, "eid": entity_id,
            "field": field, "before": None if before is None else str(before),
            "after": None if after is None else str(after), "user": user.username,
            "origin": origin})


def _product_rows(db: Session, unit: dict):
    return [dict(row) for row in db.execute(text("""
      SELECT id,familia,letra,descricao,cod_pro,cod_sma,volume_m3,ativo,pendencia
      FROM producao.produto WHERE unidade_id=:uid
      ORDER BY (pendencia IS NULL),familia,descricao,id
    """), {"uid": unit["id"]}).mappings()]


@router.get("/produtos")
def products(unidade: str, db: Session = Depends(get_db), user: Usuario = Depends(get_current_user)):
    unit = _unit(db, unidade)
    _authorize(db, unit, user)
    return {"unidade": unit, "produtos": _product_rows(db, unit)}


def _product_values(payload: ProductInput) -> dict:
    values = payload.model_dump()
    for key in ("familia", "descricao", "letra", "cod_pro", "cod_sma", "pendencia"):
        if isinstance(values[key], str):
            values[key] = values[key].strip() or None
    if not values["familia"] or not values["descricao"]:
        raise HTTPException(422, "Família e descrição obrigatórias")
    if values["volume_m3"] is not None and values["volume_m3"] > Decimal("9999.9999"):
        raise HTTPException(422, "Volume por peça excede o limite")
    return values


@router.post("/produtos", status_code=201)
def create_product(unidade: str, payload: ProductInput,
                   db: Session = Depends(get_db), user: Usuario = Depends(get_current_user)):
    unit = _unit(db, unidade)
    _authorize(db, unit, user, write=True)
    values = _product_values(payload)
    if values["cod_pro"] and db.execute(text("""
      SELECT 1 FROM producao.produto WHERE unidade_id=:uid AND cod_pro=:code
    """), {"uid": unit["id"], "code": values["cod_pro"]}).first():
        raise HTTPException(409, "Código Pro já cadastrado na unidade")
    try:
        row = db.execute(text("""
          INSERT INTO producao.produto
            (unidade_id,familia,descricao,letra,cod_pro,cod_sma,volume_m3,pendencia,ativo)
          VALUES (:uid,:familia,:descricao,:letra,:cod_pro,:cod_sma,:volume_m3,:pendencia,:ativo)
          RETURNING id
        """), {"uid": unit["id"], **values}).scalar_one()
        _audit(db, unit, "produto", row, "criacao", None, values["descricao"], user, "desktop")
        db.commit()
    except Exception:
        db.rollback()
        raise
    return {"id": row, **values}


@router.patch("/produtos/{produto_id}")
def update_product(unidade: str, produto_id: int, payload: ProductInput,
                   db: Session = Depends(get_db), user: Usuario = Depends(get_current_user)):
    unit = _unit(db, unidade)
    _authorize(db, unit, user, write=True)
    values = _product_values(payload)
    try:
        old = db.execute(text("""
          SELECT * FROM producao.produto WHERE id=:id AND unidade_id=:uid FOR UPDATE
        """), {"id": produto_id, "uid": unit["id"]}).mappings().first()
        if not old:
            raise HTTPException(404, "Produto não encontrado na unidade")
        if values["cod_pro"] and db.execute(text("""
          SELECT 1 FROM producao.produto WHERE unidade_id=:uid AND cod_pro=:code AND id<>:id
        """), {"uid": unit["id"], "code": values["cod_pro"], "id": produto_id}).first():
            raise HTTPException(409, "Código Pro já cadastrado na unidade")
        db.execute(text("""
          UPDATE producao.produto SET familia=:familia,descricao=:descricao,letra=:letra,
            cod_pro=:cod_pro,cod_sma=:cod_sma,volume_m3=:volume_m3,
            pendencia=:pendencia,ativo=:ativo,atualizado_em=now()
          WHERE id=:id AND unidade_id=:uid
        """), {"id": produto_id, "uid": unit["id"], **values})
        for key, value in values.items():
            _audit(db, unit, "produto", produto_id, key, old[key], value, user, "desktop")
        db.commit()
    except Exception:
        db.rollback()
        raise
    return {"id": produto_id, **values}


def _production(db: Session, unit: dict, day: date) -> dict:
    marker = db.execute(text("""
      SELECT id,status,enviado_em,enviado_por,confirmado_em,confirmado_por
      FROM producao.apontamento_dia WHERE unidade_id=:uid AND data=:day
    """), {"uid": unit["id"], "day": day}).mappings().first()
    rows = [dict(row) for row in db.execute(text("""
      SELECT i.id,i.produto_id,i.quantidade,p.descricao,p.familia,p.volume_m3
      FROM producao.apontamento_item i
      JOIN producao.apontamento_dia d ON d.id=i.apontamento_dia_id
      JOIN producao.produto p ON p.id=i.produto_id AND p.unidade_id=d.unidade_id
      WHERE d.unidade_id=:uid AND d.data=:day
      ORDER BY p.familia,p.descricao
    """), {"uid": unit["id"], "day": day}).mappings()]
    summary = production_summary([(r["quantidade"], r["volume_m3"]) for r in rows])
    return {"unidade": unit, "data": day, "status": marker["status"] if marker else "rascunho",
            "enviado_em": marker["enviado_em"] if marker else None,
            "confirmado_em": marker["confirmado_em"] if marker else None,
            "liberacao_prevista": date.fromordinal(day.toordinal() + 3),
            "itens": rows, **summary}


@router.get("/apontamentos/{dia}")
def get_day(unidade: str, dia: date, db: Session = Depends(get_db), user: Usuario = Depends(get_current_user)):
    unit = _unit(db, unidade)
    _authorize(db, unit, user)
    return _production(db, unit, _day(dia))


@router.put("/apontamentos/{dia}")
def save_day(unidade: str, dia: date, payload: ApontamentoInput,
             db: Session = Depends(get_db), user: Usuario = Depends(get_current_user)):
    unit = _unit(db, unidade)
    _authorize(db, unit, user, write=True)
    _day(dia)
    ids = [item.produto_id for item in payload.itens]
    if len(ids) != len(set(ids)):
        raise HTTPException(422, "Produto repetido no apontamento")
    for item in payload.itens:
        validate_quantity(item.quantidade)
        if not db.execute(text("SELECT 1 FROM producao.produto WHERE id=:id AND unidade_id=:uid AND ativo"),
                          {"id": item.produto_id, "uid": unit["id"]}).first():
            raise HTTPException(422, f"Produto {item.produto_id} não pertence à unidade ou está inativo")
    try:
        db.execute(text("""
          INSERT INTO producao.apontamento_dia(unidade_id,data) VALUES (:uid,:day)
          ON CONFLICT (unidade_id,data) DO NOTHING
        """), {"uid": unit["id"], "day": dia})
        marker = db.execute(text("""
          SELECT id,status FROM producao.apontamento_dia
          WHERE unidade_id=:uid AND data=:day FOR UPDATE
        """), {"uid": unit["id"], "day": dia}).mappings().one()
        if marker["status"] == "confirmado":
            raise HTTPException(409, "Dia confirmado; reabertura exige supervisor e motivo")
        existing = {r["produto_id"]: dict(r) for r in db.execute(text("""
          SELECT id,produto_id,quantidade FROM producao.apontamento_item
          WHERE apontamento_dia_id=:day_id FOR UPDATE
        """), {"day_id": marker["id"]}).mappings()}
        incoming = {item.produto_id: item.quantidade for item in payload.itens}
        for product_id in set(existing) | set(incoming):
            old = existing.get(product_id)
            new_qty = incoming.get(product_id, 0)
            if old:
                if old["quantidade"] != new_qty:
                    db.execute(text("UPDATE producao.apontamento_item SET quantidade=:qty WHERE id=:id"),
                               {"qty": new_qty, "id": old["id"]})
                    _audit(db, unit, "apontamento_item", old["id"], "quantidade",
                           old["quantidade"], new_qty, user, payload.origem)
            elif new_qty:
                item_id = db.execute(text("""
                  INSERT INTO producao.apontamento_item(apontamento_dia_id,produto_id,quantidade)
                  VALUES (:day_id,:pid,:qty) RETURNING id
                """), {"day_id": marker["id"], "pid": product_id, "qty": new_qty}).scalar_one()
                _audit(db, unit, "apontamento_item", item_id, "quantidade", 0, new_qty, user, payload.origem)
        db.execute(text("""
          UPDATE producao.apontamento_dia SET status=:status,origem=:origin,
            enviado_em=CASE WHEN :status='enviado' THEN now() ELSE enviado_em END,
            enviado_por=CASE WHEN :status='enviado' THEN :username ELSE enviado_por END
          WHERE id=:id
        """), {"status": "enviado" if payload.acao == "enviar" else "rascunho",
                "origin": payload.origem, "username": user.username, "id": marker["id"]})
        db.commit()
    except Exception:
        db.rollback()
        raise
    return _production(db, unit, dia)


@router.post("/apontamentos/{dia}/repetir-ontem")
def repeat_last_day(unidade: str, dia: date,
                    db: Session = Depends(get_db), user: Usuario = Depends(get_current_user)):
    unit = _unit(db, unidade)
    _authorize(db, unit, user, write=True)
    _day(dia)
    if db.execute(text("""
      SELECT 1 FROM producao.apontamento_dia WHERE unidade_id=:uid AND data=:day
    """), {"uid": unit["id"], "day": dia}).first():
        raise HTTPException(409, "Dia já iniciado; repetição não sobrescreve lançamentos")
    source = db.execute(text("""
      SELECT d.id,d.data FROM producao.apontamento_dia d
      JOIN producao.apontamento_item i ON i.apontamento_dia_id=d.id
      WHERE d.unidade_id=:uid AND d.data<:day
      GROUP BY d.id,d.data HAVING sum(i.quantidade)>0
      ORDER BY d.data DESC LIMIT 1
    """), {"uid": unit["id"], "day": dia}).mappings().first()
    if not source:
        raise HTTPException(404, "Não há dia anterior com produção")
    items = [ItemInput(produto_id=row["produto_id"], quantidade=row["quantidade"])
             for row in db.execute(text("""
               SELECT i.produto_id,i.quantidade FROM producao.apontamento_item i
               JOIN producao.produto p ON p.id=i.produto_id
               WHERE i.apontamento_dia_id=:id AND i.quantidade>0 AND p.ativo
             """), {"id": source["id"]}).mappings()]
    result = save_day(unidade, dia, ApontamentoInput(itens=items), db, user)
    result["copiado_de"] = source["data"]
    return result


@router.post("/apontamentos/{dia}/reabrir")
def reopen_day(unidade: str, dia: date, payload: ReopenInput,
               db: Session = Depends(get_db), user: Usuario = Depends(get_current_user)):
    unit = _unit(db, unidade)
    _authorize(db, unit, user, supervisor=True)
    _day(dia)
    try:
        row = db.execute(text("""
          SELECT id,status FROM producao.apontamento_dia
          WHERE unidade_id=:uid AND data=:day FOR UPDATE
        """), {"uid": unit["id"], "day": dia}).mappings().first()
        if not row or row["status"] != "confirmado":
            raise HTTPException(409, "Somente dia confirmado pode ser reaberto")
        db.execute(text("""
          UPDATE producao.apontamento_dia SET status='rascunho',confirmado_em=NULL,confirmado_por=NULL
          WHERE id=:id
        """), {"id": row["id"]})
        _audit(db, unit, "apontamento_dia", row["id"], "reabertura",
               "confirmado", f"rascunho: {payload.motivo.strip()}", user, payload.origem)
        db.commit()
    except Exception:
        db.rollback()
        raise
    return _production(db, unit, dia)


def _labor(db: Session, unit: dict, day: date) -> dict:
    group = _labor_group(unit)
    marker = db.execute(text("""
      SELECT salvo_em,confirmado_em FROM public.maodeobra_dias
      WHERE unidade_id=:uid AND data=:day AND grupo_setor=:grp
    """), {"uid": unit["id"], "day": day, "grp": group}).mappings().first()
    rows = [dict(row) for row in db.execute(text("""
      SELECT a.id AS atividade_id,a.descricao,a.tipo,a.ordem,a.ativo,
             m.id AS registro_id,COALESCE(m.quantidade_pessoas,0) AS homens,m.observacao
      FROM public.atividades_mao_de_obra a
      LEFT JOIN public.maodeobra m ON m.atividade_id=a.id AND m.data=:day AND m.unidade_id=:uid
      WHERE a.unidade_id=:uid ORDER BY a.ordem,a.descricao
    """), {"uid": unit["id"], "day": day}).mappings()]
    total = sum((Decimal(str(row["homens"])) for row in rows), Decimal("0"))
    mod = sum((Decimal(str(row["homens"])) for row in rows if row["tipo"] == "MOD"), Decimal("0"))
    return {"data": day, "areas": rows, "homens": total, "mod": mod, "moi": total - mod,
            "salvo_em": marker["salvo_em"] if marker else None,
            "confirmado_em": marker["confirmado_em"] if marker else None}


@router.get("/mao-de-obra/mensal")
def monthly_labor(unidade: str, mes: str = Query(pattern=r"^\d{4}-(0[1-9]|1[0-2])$"),
                  db: Session = Depends(get_db), user: Usuario = Depends(get_current_user)):
    data = monthly(unidade, mes, db, user)
    return {"unidade": data["unidade"], "mes": mes,
            "dias": [{key: day[key] for key in ("data", "postes", "homens", "mod", "moi", "postes_homem")}
                     for day in data["dias"]]}


@router.get("/mao-de-obra/{dia}")
def get_labor(unidade: str, dia: date, db: Session = Depends(get_db), user: Usuario = Depends(get_current_user)):
    unit = _unit(db, unidade)
    _authorize(db, unit, user)
    return _labor(db, unit, _day(dia))


@router.put("/mao-de-obra/{dia}")
def save_labor(unidade: str, dia: date, payload: MaoDeObraInput,
               db: Session = Depends(get_db), user: Usuario = Depends(get_current_user)):
    unit = _unit(db, unidade)
    _authorize(db, unit, user, write=True)
    _day(dia)
    ids = [area.atividade_id for area in payload.areas]
    if len(ids) != len(set(ids)):
        raise HTTPException(422, "Área repetida")
    for area in payload.areas:
        try:
            validate_people(area.homens)
        except ValueError as exc:
            raise HTTPException(422, str(exc)) from exc
        if not db.execute(text("SELECT 1 FROM public.atividades_mao_de_obra WHERE id=:id AND unidade_id=:uid AND ativo"),
                          {"id": area.atividade_id, "uid": unit["id"]}).first():
            raise HTTPException(422, f"Área {area.atividade_id} inválida para a unidade")
    group = _labor_group(unit)
    try:
        db.execute(text("""
          INSERT INTO public.maodeobra_dias(data,grupo_setor,unidade_id,sem_producao)
          VALUES (:day,:grp,:uid,false)
          ON CONFLICT (data,grupo_setor) DO NOTHING
        """), {"day": dia, "grp": group, "uid": unit["id"]})
        marker = db.execute(text("""
          SELECT id,confirmado_em FROM public.maodeobra_dias
          WHERE data=:day AND grupo_setor=:grp AND unidade_id=:uid FOR UPDATE
        """), {"day": dia, "grp": group, "uid": unit["id"]}).mappings().one()
        if marker["confirmado_em"]:
            raise HTTPException(409, "Mão de obra confirmada; reabertura exige supervisor")
        existing = {r["atividade_id"]: dict(r) for r in db.execute(text("""
          SELECT m.id,m.atividade_id,m.quantidade_pessoas,m.observacao
          FROM public.maodeobra m JOIN public.atividades_mao_de_obra a ON a.id=m.atividade_id
          WHERE m.data=:day AND m.unidade_id=:uid AND a.unidade_id=:uid FOR UPDATE OF m
        """), {"day": dia, "uid": unit["id"]}).mappings()}
        incoming = {area.atividade_id: area for area in payload.areas}
        for activity_id in set(existing) | set(incoming):
            old = existing.get(activity_id)
            new = incoming.get(activity_id)
            count = new.homens if new else Decimal("0")
            note = new.observacao if new else None
            if old:
                if old["quantidade_pessoas"] != count or old["observacao"] != note:
                    db.execute(text("""
                      UPDATE public.maodeobra SET quantidade_pessoas=:count,observacao=:note WHERE id=:id
                    """), {"count": count, "note": note, "id": old["id"]})
                    _audit(db, unit, "maodeobra", old["id"], "quantidade_pessoas",
                           old["quantidade_pessoas"], count, user, payload.origem)
                    _audit(db, unit, "maodeobra", old["id"], "observacao",
                           old["observacao"], note, user, payload.origem)
            elif count or note:
                record_id = db.execute(text("""
                  INSERT INTO public.maodeobra(data,atividade_id,unidade_id,quantidade_pessoas,observacao)
                  VALUES (:day,:aid,:uid,:count,:note) RETURNING id
                """), {"day": dia, "aid": activity_id, "uid": unit["id"],
                       "count": count, "note": note}).scalar_one()
                _audit(db, unit, "maodeobra", record_id, "quantidade_pessoas", 0, count, user, payload.origem)
        db.execute(text("""
          UPDATE public.maodeobra_dias SET salvo_em=now(),salvo_por_usuario_id=:user_id
          WHERE id=:id
        """), {"user_id": user.id, "id": marker["id"]})
        db.commit()
    except Exception:
        db.rollback()
        raise
    return _labor(db, unit, dia)


@router.post("/mao-de-obra/{dia}/confirmar")
def confirm_labor(unidade: str, dia: date, db: Session = Depends(get_db), user: Usuario = Depends(get_current_user)):
    unit = _unit(db, unidade)
    _authorize(db, unit, user, write=True)
    _day(dia)
    try:
        group = _labor_group(unit)
        marker = db.execute(text("""
          SELECT id FROM public.maodeobra_dias
          WHERE unidade_id=:uid AND data=:day AND grupo_setor=:grp FOR UPDATE
        """), {"uid": unit["id"], "day": dia, "grp": group}).first()
        if not marker:
            raise HTTPException(409, "Salve a mão de obra antes de confirmar")
        db.execute(text("""
          UPDATE public.maodeobra_dias SET confirmado_em=now(),confirmado_por_usuario_id=:user_id
          WHERE id=:id AND confirmado_em IS NULL
        """), {"user_id": user.id, "id": marker[0]})
        db.commit()
    except Exception:
        db.rollback()
        raise
    return _labor(db, unit, dia)


@router.post("/apontamentos/{dia}/confirmar")
def confirm_day(unidade: str, dia: date, db: Session = Depends(get_db), user: Usuario = Depends(get_current_user)):
    unit = _unit(db, unidade)
    _authorize(db, unit, user, write=True)
    _day(dia)
    try:
        marker = db.execute(text("""
          SELECT id,status FROM producao.apontamento_dia
          WHERE unidade_id=:uid AND data=:day FOR UPDATE
        """), {"uid": unit["id"], "day": dia}).mappings().first()
        if not marker or marker["status"] != "enviado":
            raise HTTPException(409, "Envie o apontamento antes de confirmar")
        posts = db.execute(text("""
          SELECT COALESCE(sum(i.quantidade),0) FROM producao.apontamento_item i
          WHERE apontamento_dia_id=:id
        """), {"id": marker["id"]}).scalar_one()
        people = _labor(db, unit, dia)["homens"]
        try:
            assert_can_confirm(int(posts), people)
        except ValueError as exc:
            raise HTTPException(409, str(exc)) from exc
        db.execute(text("""
          UPDATE producao.apontamento_dia SET status='confirmado',confirmado_em=now(),confirmado_por=:user
          WHERE id=:id
        """), {"user": user.username, "id": marker["id"]})
        db.commit()
    except Exception:
        db.rollback()
        raise
    return _production(db, unit, dia)


@router.get("/mensal")
def monthly(unidade: str, mes: str = Query(pattern=r"^\d{4}-(0[1-9]|1[0-2])$"),
            db: Session = Depends(get_db), user: Usuario = Depends(get_current_user)):
    unit = _unit(db, unidade)
    _authorize(db, unit, user)
    dates = [row[0] for row in db.execute(text("""
      SELECT d.data FROM producao.apontamento_dia d
      JOIN producao.apontamento_item i ON i.apontamento_dia_id=d.id
      WHERE d.unidade_id=:uid AND to_char(d.data,'YYYY-MM')=:mes AND d.data<=:today
      GROUP BY d.data HAVING sum(i.quantidade)>0 ORDER BY d.data
    """), {"uid": unit["id"], "mes": mes,
           "today": datetime.now(ZoneInfo("America/Sao_Paulo")).date()})]
    days = []
    for day in dates:
        production = _production(db, unit, day)
        labor = _labor(db, unit, day)
        days.append({"data": day, "status": production["status"], "postes": production["postes"],
                     "homens": labor["homens"], "mod": labor["mod"], "moi": labor["moi"],
                     "postes_homem": posts_per_person(production["postes"], labor["homens"]),
                     "volume_m3": production["volume_m3"],
                     "produtos_sem_volume": production["produtos_sem_volume"],
                     "itens": production["itens"]})
    meta = db.execute(text("""
      SELECT dias_uteis,pcs_dia,meta_postes_homem FROM producao.meta_producao
      WHERE unidade_id=:uid AND ano_mes=:mes
    """), {"uid": unit["id"], "mes": mes}).mappings().first()
    return {"unidade": unit, "mes": mes, "meta": dict(meta) if meta else None,
            "dias": days, "postes": sum(d["postes"] for d in days),
            "homens": sum((d["homens"] for d in days), Decimal("0")),
            "pendencias": [d["data"] for d in days if d["postes"] and not d["homens"]]}


