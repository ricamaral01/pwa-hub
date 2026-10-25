"""NC API. Every write combines business row, immutable event and outbox in one transaction."""
from __future__ import annotations

import hashlib
import json
import os
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from typing import Any
from urllib.parse import quote
from uuid import UUID, uuid4
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from fastapi.encoders import jsonable_encoder
from fastapi.responses import FileResponse, Response
from sqlalchemy import and_, insert, or_, select, update
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from .auth import Actor, actor, require
from .db import session, table
from .models import (ActionFinishIn, ActionIn, ActionPatch, CatalogIn, CatalogPatch, ContactPatch, CauseIn, ClosureIn, CommentIn, ContactIn, LinkIn, DocumentRefIn,
                     ContainmentIn, DraftIn, EffectivenessFollowupIn, EffectivenessIn, FormIn, ReasonIn, RegistrationIn, TriageIn)
from .pcp_catalog import fetch_catalog, snapshot
from .fl_sgq_07_pdf import render_rnc_form
from .rules import RuleError, draw_rnc_number, due_status, require_text, transition, validate_cause, validate_closure, validate_concession_approvals, validate_file, validate_registration, validate_verifier

router = APIRouter(prefix="/api", tags=["Qualidade"])
UTC = timezone.utc
MAX_FILE = 25 * 1024 * 1024
MIMES = frozenset({
    "application/pdf", "image/png", "image/jpeg", "image/webp", "text/plain",
    "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
})


def new_id():
    try:
        from uuid import uuid7
        return uuid7()
    except ImportError:
        return uuid4()


def fail_rule(error: RuleError):
    raise HTTPException(422, str(error)) from None


def one(db: Session, stmt):
    return db.execute(stmt).mappings().one_or_none()


def row(db: Session, name: str, key: UUID | str, *, lock: bool = False):
    t = table(name)
    stmt = select(t).where(t.c.id == key)
    if lock:
        stmt = stmt.with_for_update()
    result = one(db, stmt)
    if result is None:
        raise HTTPException(404, "Registro não encontrado.")
    return dict(result)


def rows(db: Session, name: str, where):
    t = table(name)
    return [dict(x) for x in db.execute(select(t).where(where)).mappings()]


def checked_reference(db: Session, name: str, key: UUID | str | None, company: UUID, unit: str):
    if key is None:
        return None
    record = row(db, name, key)
    if record["empresa_id"] != company or (record.get("unidade_codigo") and record["unidade_codigo"] != unit) or not record.get("ativo", True):
        raise HTTPException(422, f"{name} fora da empresa/unidade ou inativo.")
    return record


def ensure_unit(db: Session, company: UUID, unit: str, user: Actor):
    u = table("unidade")
    found = one(db, select(u).where(and_(u.c.codigo == unit, u.c.empresa_id == company, u.c.ativo.is_(True))))
    if not found or (user.unit and user.unit != unit):
        raise HTTPException(403, "Unidade indisponível.")


def area_ids(db: Session, user: Actor) -> frozenset[str]:
    if not user.areas:
        return frozenset()
    area = table("area")
    return frozenset(str(x) for x in db.execute(select(area.c.id).where(area.c.codigo.in_(user.areas))).scalars())


def can_read(nc: dict, user: Actor, allowed_areas: frozenset[str] = frozenset()) -> bool:
    if user.unit and user.unit != nc["unidade_codigo"]:
        return False
    if nc["status"] == "RASCUNHO":
        return user.superuser or nc["criado_por"] == user.id
    return bool(user.superuser or user.has("qualidade.nc.ver_todas")
                or nc["criado_por"] == user.id or nc["responsavel_id"] == user.id
                or (user.has("qualidade.nc.ver_area") and (str(nc["area_responsavel_id"]) in allowed_areas or str(nc["area_emissora_id"]) in allowed_areas)))


def get_nc(db: Session, key: UUID, user: Actor, *, lock: bool = False) -> dict:
    nc = row(db, "nc", key, lock=lock)
    if not can_read(nc, user, area_ids(db, user)):
        raise HTTPException(404, "NC não encontrada.")
    return nc


def can_treat(nc: dict, user: Actor, allowed_areas: frozenset[str] = frozenset()):
    if not user.has("qualidade.nc.tratar") or not (user.superuser or nc["criado_por"] == user.id or nc["responsavel_id"] == user.id or str(nc["area_responsavel_id"]) in allowed_areas):
        raise HTTPException(403, "Tratativa não concedida para esta NC.")


def event(db: Session, nc: dict, user: Actor, kind: str, *, prior=None, current=None, description=None, payload=None):
    db.execute(insert(table("nc_evento")).values(
        id=new_id(), nc_id=nc["id"], empresa_id=nc["empresa_id"], unidade_codigo=nc["unidade_codigo"],
        tipo=kind, status_anterior=prior, status_novo=current, descricao=description,
        payload=payload or {}, autor_id=user.id, autor_texto=user.name, criado_por=user.id,
    ))


def notify(db: Session, nc: dict, kind: str, recipient: str | None, *, due: datetime | None = None, suffix=""):
    if not recipient:
        return
    contact_table = table("usuario_contato")
    contact = one(db, select(contact_table).where(contact_table.c.usuario_id == recipient))
    email = contact["email"] if contact and contact["ativo"] else None
    key = f"{kind}:{nc['id']}:{recipient}:{suffix}"
    db.execute(pg_insert(table("notificacao_outbox")).values(
        id=new_id(), nc_id=nc["id"], empresa_id=nc["empresa_id"], unidade_codigo=nc["unidade_codigo"],
        evento=kind, destinatario_id=recipient, destinatario_email=email,
        payload={"nc_id": str(nc["id"]), "numero": nc.get("numero"), "evento": kind},
        enviar_apos=due or datetime.now(UTC), dedupe_key=key,
    ).on_conflict_do_nothing(index_elements=["dedupe_key"]))


def change_state(db: Session, nc: dict, user: Actor, action: str, *, description=None):
    try:
        target = transition(nc["status"], action)
    except RuleError as exc:
        fail_rule(exc)
    previous = nc["status"]
    db.execute(update(table("nc")).where(table("nc").c.id == nc["id"]).values(status=target, atualizado_em=datetime.now(UTC), atualizado_por=user.id))
    event(db, nc, user, action.upper(), prior=previous, current=target, description=description)
    nc["status"] = target
    return nc


def allocate_rnc_number(db: Session, company: UUID) -> tuple[str, int, int]:
    """Serialize per-company/year allocation, then draw a distinct public label."""
    year = datetime.now(ZoneInfo("America/Sao_Paulo")).year
    counter = table("nc_numero_contador")
    ordinal = db.execute(pg_insert(counter).values(
        empresa_id=company, ano=year, ultimo_numero=1)
        .on_conflict_do_update(index_elements=["empresa_id", "ano"],
                               set_={"ultimo_numero": counter.c.ultimo_numero + 1})
        .returning(counter.c.ultimo_numero)).scalar_one()
    if ordinal > 900000:
        raise HTTPException(409, "Limite anual de numeração atingido.")
    n = table("nc")
    try:
        number = draw_rnc_number(year, lambda candidate: one(db, select(n.c.id).where(
            and_(n.c.empresa_id == company, n.c.numero == candidate))) is not None)
    except RuleError as exc:
        raise HTTPException(409, str(exc)) from None
    return number, year, ordinal


@router.get("/health")
def health():
    return {"status": "ok"}


@router.get("/contexto")
def context(user: Actor = Depends(actor), db: Session = Depends(session)):
    companies = [dict(x) for x in db.execute(select(table("empresa")).order_by(table("empresa").c.nome)).mappings()]
    units = [dict(x) for x in db.execute(select(table("unidade")).where(table("unidade").c.ativo.is_(True)).order_by(table("unidade").c.nome)).mappings()]
    preference = one(db, select(table("preferencia_usuario")).where(table("preferencia_usuario").c.usuario_id == user.id))
    return jsonable_encoder({"user": {"id": user.id, "name": user.name, "actions": sorted(user.actions), "superuser": user.superuser},
                             "companies": companies, "units": [u for u in units if not user.unit or u["codigo"] == user.unit],
                             "active_unit": user.unit, "last_unit": preference["unidade_codigo"] if preference else None})


@router.get("/catalogos")
def catalogs(company: UUID, unit: str, user: Actor = Depends(actor), db: Session = Depends(session)):
    ensure_unit(db, company, unit, user)
    result = {}
    for name in ("origem", "tipo", "gravidade", "area", "disposicao", "local", "atividade"):
        t = table(name)
        result[name] = [dict(x) for x in db.execute(select(t).where(and_(t.c.empresa_id == company, t.c.ativo.is_(True), or_(t.c.unidade_codigo.is_(None), t.c.unidade_codigo == unit))).order_by(t.c.nome)).mappings()]
    return jsonable_encoder(result)


@router.get("/integracoes/pcp/{kind}")
def pcp_catalog(kind: str, user: Actor = Depends(actor)):
    if kind not in {"setores", "produtos"}:
        raise HTTPException(404, "Catálogo não encontrado.")
    return fetch_catalog(kind)


@router.post("/nc/rascunhos", status_code=201)
def draft(payload: DraftIn, user: Actor = Depends(require("qualidade.nc.abrir")), db: Session = Depends(session)):
    data = payload.model_dump(exclude_none=True)
    for field in ("setor_codigo_snapshot", "setor_nome_snapshot", "produto_codigo_snapshot", "produto_nome_snapshot"):
        data.pop(field, None)
    data.update(snapshot("setores", payload.setor_pcp_id))
    data.update(snapshot("produtos", payload.produto_pcp_id, sector=payload.setor_pcp_id))
    with db.begin():
        ensure_unit(db, payload.empresa_id, payload.unidade_codigo, user)
        for name, key in (("origem", payload.origem_id), ("tipo", payload.tipo_id), ("gravidade", payload.gravidade_id), ("area", payload.area_emissora_id),
                          ("local", payload.local_id), ("atividade", payload.atividade_id)):
            checked_reference(db, name, key, payload.empresa_id, payload.unidade_codigo)
        nc = {**data, "id": new_id(), "status": "RASCUNHO", "numero": None, "criado_por": user.id}
        db.execute(insert(table("nc")).values(**nc))
        event(db, nc, user, "RASCUNHO", current="RASCUNHO")
        db.execute(pg_insert(table("preferencia_usuario")).values(usuario_id=user.id, unidade_codigo=payload.unidade_codigo).on_conflict_do_update(index_elements=["usuario_id"], set_={"unidade_codigo": payload.unidade_codigo, "atualizado_em": datetime.now(UTC)}))
    return {"id": str(nc["id"]), "status": "RASCUNHO", "numero": None}


@router.post("/nc/{nc_id}/registrar")
def register(nc_id: UUID, payload: RegistrationIn, user: Actor = Depends(require("qualidade.nc.abrir")), db: Session = Depends(session)):
    with db.begin():
        nc = get_nc(db, nc_id, user, lock=True)
        if nc["criado_por"] != user.id and not user.superuser:
            raise HTTPException(403, "Somente o autor registra o rascunho.")
        if nc["status"] != "RASCUNHO":
            raise HTTPException(409, "NC já registrada.")
        updates = payload.model_dump(exclude_none=True, exclude={"mobile"})
        nc.update(updates)
        if payload.mobile:
            if not (nc.get("titulo") or "").strip():
                nc["titulo"] = nc["descricao"].strip()[:100]
                updates["titulo"] = nc["titulo"]
            if nc.get("data_deteccao") is None:
                nc["data_deteccao"] = datetime.now(UTC)
                updates["data_deteccao"] = nc["data_deteccao"]
        try:
            validate_registration(nc, mobile=payload.mobile)
        except RuleError as exc:
            fail_rule(exc)
        for name, key in (("origem", nc.get("origem_id")), ("tipo", nc.get("tipo_id")), ("gravidade", nc.get("gravidade_id"))):
            checked_reference(db, name, key, nc["empresa_id"], nc["unidade_codigo"])
        number, year, seq = allocate_rnc_number(db, nc["empresa_id"])
        n = table("nc")
        db.execute(update(n).where(n.c.id == nc_id).values(
            **updates, numero=number, numero_ano=year, numero_ordem=seq,
            status="REGISTRADA", atualizado_por=user.id))
        nc["numero"] = number
        event(db, nc, user, "REGISTRO", prior="RASCUNHO", current="REGISTRADA")
        if nc.get("cliente_afetado"):
            event(db, nc, user, "PENDENCIA_CLIENTE", description="Confirmar comunicação ao cliente.")
        notify(db, nc, "ATRIBUICAO", nc.get("responsavel_id"), suffix="registro")
    return {"id": str(nc_id), "numero": number, "status": "REGISTRADA"}


@router.post("/nc/{nc_id}/descartar")
def discard(nc_id: UUID, payload: ReasonIn, user: Actor = Depends(require("qualidade.nc.abrir")), db: Session = Depends(session)):
    with db.begin():
        nc = get_nc(db, nc_id, user, lock=True)
        if nc["criado_por"] != user.id and not user.superuser:
            raise HTTPException(403, "Somente o autor descarta o rascunho.")
        try:
            require_text(payload.motivo, "Motivo")
        except RuleError as exc:
            fail_rule(exc)
        change_state(db, nc, user, "descartar", description=f"Rascunho descartado: {payload.motivo}")
    return {"status": "CANCELADA"}


@router.get("/nc")
def list_nc(company: UUID, unit: str | None = None, status: str | None = None, gravidade: UUID | None = None,
            origem: UUID | None = None, area: UUID | None = None, busca: str | None = None,
            minhas: bool = False, atribuidas: bool = False, atraso: bool = False,
            aguardando_eficacia: bool = False, limit: int = Query(50, ge=1, le=200), offset: int = Query(0, ge=0),
            user: Actor = Depends(actor), db: Session = Depends(session)):
    n = table("nc")
    query = select(n).where(n.c.empresa_id == company)
    if user.unit:
        query = query.where(n.c.unidade_codigo == user.unit)
    if unit:
        query = query.where(n.c.unidade_codigo == unit)
    if status:
        query = query.where(n.c.status == status)
    if gravidade:
        query = query.where(n.c.gravidade_id == gravidade)
    if origem:
        query = query.where(n.c.origem_id == origem)
    if area:
        query = query.where(n.c.area_responsavel_id == area)
    if busca:
        query = query.where(or_(n.c.numero.ilike(f"%{busca}%"), n.c.titulo.ilike(f"%{busca}%")))
    if minhas:
        query = query.where(n.c.criado_por == user.id)
    if atribuidas:
        query = query.where(n.c.responsavel_id == user.id)
    if aguardando_eficacia:
        query = query.where(n.c.status == "VERIFICACAO_EFICACIA")
    if atraso:
        query = query.where(or_(n.c.prazo_etapa < date.today(), n.c.prazo_final < date.today()))
    all_rows = [dict(x) for x in db.execute(query.order_by(n.c.criado_em.desc())).mappings()]
    allowed = area_ids(db, user)
    visible = [x for x in all_rows if can_read(x, user, allowed)]
    for item in visible:
        item["em_atraso"] = due_status(item.get("prazo_etapa") or item.get("prazo_final"), item["status"])
    return {"items": jsonable_encoder(visible[offset:offset + limit]), "total": len(visible)}


@router.get("/painel")
def dashboard(company: UUID, unit: str | None = None, user: Actor = Depends(actor), db: Session = Depends(session)):
    n = table("nc")
    query = select(n).where(n.c.empresa_id == company)
    if user.unit:
        query = query.where(n.c.unidade_codigo == user.unit)
    if unit:
        query = query.where(n.c.unidade_codigo == unit)
    allowed = area_ids(db, user)
    data = [dict(x) for x in db.execute(query).mappings() if can_read(dict(x), user, allowed)]
    for item in data:
        item["em_atraso"] = due_status(item.get("prazo_etapa") or item.get("prazo_final"), item["status"])
    visible_ids = {x["id"] for x in data}
    actions = table("nc_acao")
    action_tasks = [dict(x) for x in db.execute(select(actions).where(and_(actions.c.quem_id == user.id, actions.c.status.not_in(("CONCLUIDA", "CANCELADA"))))).mappings() if x["nc_id"] in visible_ids]
    links = table("nc_vinculo")
    since = datetime.now(UTC) - timedelta(days=365)
    recurrence = {x["nc_id"] for x in db.execute(select(links.c.nc_id).where(and_(links.c.tipo == "REINCIDENCIA", links.c.criado_em >= since))).mappings() if x["nc_id"] in visible_ids}
    return jsonable_encoder({"abertas": sum(x["status"] not in ("ENCERRADA", "CANCELADA", "RASCUNHO") for x in data),
            "em_atraso": sum(bool(x["em_atraso"]) for x in data),
            "aguardando_eficacia": sum(x["status"] == "VERIFICACAO_EFICACIA" for x in data),
            "minhas_pendencias": [x for x in data if x.get("responsavel_id") == user.id and x["status"] not in ("ENCERRADA", "CANCELADA")],
            "acoes_pendentes": action_tasks,
            "reincidentes_12_meses": len(recurrence)})


@router.get("/nc/legado/{legacy_id}")
def legacy_lookup(legacy_id: UUID, user: Actor = Depends(actor), db: Session = Depends(session)):
    """Resolve a link from a read-only GED RNC without bypassing NC visibility."""
    n = table("nc")
    nc = one(db, select(n).where(n.c.id_legado == legacy_id))
    if not nc or (user.unit and nc["unidade_codigo"] != user.unit) or not can_read(nc, user, area_ids(db, user)):
        raise HTTPException(404, "NC migrada não encontrada.")
    return {"id": str(nc["id"]), "url": f"/unificado/qualidade/nc/{nc['id']}"}


@router.get("/nc/{nc_id}")
def detail(nc_id: UUID, user: Actor = Depends(actor), db: Session = Depends(session)):
    nc = get_nc(db, nc_id, user)
    result = {"nc": nc}
    for name in ("nc_contencao", "nc_causa", "nc_acao", "nc_eficacia", "nc_eficacia_acompanhamento", "nc_encerramento", "nc_anexo", "nc_evento", "nc_comentario", "nc_documento_ref", "nc_vinculo"):
        t = table(name)
        result[name] = rows(db, name, t.c.nc_id == nc_id)
    related_ids = [item["nc_relacionada_id"] for item in result["nc_vinculo"]]
    if related_ids:
        linked = table("nc")
        linked_numbers = dict(db.execute(select(linked.c.id, linked.c.numero).where(linked.c.id.in_(related_ids))).all())
        for item in result["nc_vinculo"]:
            item["numero_relacionado"] = linked_numbers.get(item["nc_relacionada_id"])
    result["campos_pendentes"] = [k for k in ("titulo", "descricao", "origem_id", "tipo_id", "gravidade_id", "data_deteccao") if not nc.get(k)] if nc["legado"] else []
    result["cliente_pendente"] = bool(nc.get("cliente_afetado") and not any(e["tipo"] == "CLIENTE_NOTIFICADO" for e in result["nc_evento"]))
    return jsonable_encoder(result)


@router.patch("/nc/{nc_id}/formulario")
def update_form(nc_id: UUID, payload: FormIn,
                user: Actor = Depends(require("qualidade.nc.tratar")), db: Session = Depends(session)):
    values = payload.model_dump(exclude_unset=True)
    if not values:
        raise HTTPException(422, "Informe ao menos um campo do formulário.")
    if "descricao" in values and not (values["descricao"] or "").strip():
        raise HTTPException(422, "Descrever o problema é obrigatório.")
    with db.begin():
        nc = get_nc(db, nc_id, user, lock=True)
        can_treat(nc, user, area_ids(db, user))
        if nc["status"] in ("ENCERRADA", "CANCELADA"):
            raise HTTPException(409, "RNC encerrada ou cancelada.")
        for name in ("local", "atividade"):
            if name + "_id" in values:
                checked_reference(db, name, values[name + "_id"], nc["empresa_id"], nc["unidade_codigo"])
        db.execute(update(table("nc")).where(table("nc").c.id == nc_id).values(
            **values, atualizado_em=datetime.now(UTC), atualizado_por=user.id))
        event(db, nc, user, "FORMULARIO_ATUALIZADO", description="Campos do FL-SGQ-07 atualizados.",
              payload={"campos": sorted(values)})
    return {"id": str(nc_id), "campos": sorted(values)}


@router.post("/nc/{nc_id}/confirmar-notificacao-cliente")
def confirm_client_notice(nc_id: UUID, payload: ReasonIn, user: Actor = Depends(require("qualidade.nc.tratar")), db: Session = Depends(session)):
    with db.begin():
        nc = get_nc(db, nc_id, user, lock=True)
        can_treat(nc, user, area_ids(db, user))
        if not nc.get("cliente_afetado"):
            raise HTTPException(422, "NC sem cliente afetado.")
        try:
            require_text(payload.motivo, "Comprovante ou referência da comunicação")
        except RuleError as exc:
            fail_rule(exc)
        event(db, nc, user, "CLIENTE_NOTIFICADO", description=payload.motivo)
    return {"cliente_pendente": False}


@router.post("/nc/{nc_id}/triagem")
def triage(nc_id: UUID, payload: TriageIn, user: Actor = Depends(require("qualidade.nc.triar")), db: Session = Depends(session)):
    with db.begin():
        nc = get_nc(db, nc_id, user, lock=True)
        for name, key in (("origem", payload.origem_id), ("gravidade", payload.gravidade_id), ("tipo", payload.tipo_id), ("area", payload.area_responsavel_id)):
            checked_reference(db, name, key, nc["empresa_id"], nc["unidade_codigo"])
        require_text(payload.responsavel_id, "Responsável")
        vals = payload.model_dump(exclude={"observacoes"}, exclude_none=True) | {"observacoes_triagem": payload.observacoes, "atribuido_por": user.id}
        if not (vals.get("origem_id") or nc.get("origem_id")):
            raise HTTPException(422, "Origem é obrigatória na triagem.")
        severity = row(db, "gravidade", payload.gravidade_id)
        if severity["prazo_causa_dias"] is not None:
            vals["prazo_etapa"] = date.today() + timedelta(days=severity["prazo_causa_dias"])
        if severity["prazo_final_dias"] is not None and payload.prazo_final > date.today() + timedelta(days=severity["prazo_final_dias"]):
            raise HTTPException(422, "Prazo final excede a política da gravidade.")
        db.execute(update(table("nc")).where(table("nc").c.id == nc_id).values(**vals))
        nc.update(vals)
        change_state(db, nc, user, "triar")
        notify(db, nc, "ATRIBUICAO", payload.responsavel_id, suffix="triagem")
        notify(db, nc, "PRAZO_2_DIAS", payload.responsavel_id, due=datetime.combine(payload.prazo_final - timedelta(days=2), datetime.min.time(), UTC), suffix=str(payload.prazo_final))
        notify(db, nc, "ATRASO", payload.responsavel_id, due=datetime.combine(payload.prazo_final + timedelta(days=1), datetime.min.time(), UTC), suffix=str(payload.prazo_final))
    return {"status": "CONTENCAO"}


@router.post("/nc/{nc_id}/contencoes", status_code=201)
def add_containment(nc_id: UUID, payload: ContainmentIn, user: Actor = Depends(require("qualidade.nc.tratar")), db: Session = Depends(session)):
    with db.begin():
        nc = get_nc(db, nc_id, user, lock=True)
        can_treat(nc, user, area_ids(db, user))
        if nc["status"] != "CONTENCAO":
            raise HTTPException(409, "NC fora da contenção.")
        disposition = checked_reference(db, "disposicao", payload.disposicao_id, nc["empresa_id"], nc["unidade_codigo"])
        if disposition["codigo"] == "CONCESSAO" and not payload.aprovador_id:
            raise HTTPException(422, "Escolha um aprovador para a concessão.")
        try:
            require_text(payload.descricao, "Descrição da contenção")
        except RuleError as exc:
            fail_rule(exc)
        cid = new_id()
        db.execute(insert(table("nc_contencao")).values(id=cid, nc_id=nc_id, empresa_id=nc["empresa_id"], unidade_codigo=nc["unidade_codigo"], criado_por=user.id, **payload.model_dump(exclude_none=True)))
        event(db, nc, user, "CONTENCAO", payload={"contencao_id": str(cid), "aprovador_id": payload.aprovador_id})
        if disposition["codigo"] == "CONCESSAO":
            notify(db, nc, "PEDIDO_APROVACAO", payload.aprovador_id, suffix=str(cid))
    return {"id": str(cid)}


@router.post("/nc/{nc_id}/contencoes/{contencao_id}/aprovar-concessao")
def approve_concession(nc_id: UUID, contencao_id: UUID, user: Actor = Depends(require("qualidade.nc.aprovar_concessao")), db: Session = Depends(session)):
    with db.begin():
        nc = get_nc(db, nc_id, user, lock=True)
        item = row(db, "nc_contencao", contencao_id)
        if item["nc_id"] != nc_id or item["empresa_id"] != nc["empresa_id"] or item["unidade_codigo"] != nc["unidade_codigo"]:
            raise HTTPException(404, "Contenção não encontrada.")
        db.execute(update(table("nc_contencao")).where(table("nc_contencao").c.id == contencao_id).values(concessao_aprovada_por=user.id, concessao_aprovada_em=datetime.now(UTC)))
        event(db, nc, user, "CONCESSAO_APROVADA", payload={"contencao_id": str(contencao_id)})
    return {"aprovada": True}


@router.post("/nc/{nc_id}/concluir-contencao")
def finish_containment(nc_id: UUID, user: Actor = Depends(require("qualidade.nc.tratar")), db: Session = Depends(session)):
    with db.begin():
        nc = get_nc(db, nc_id, user, lock=True)
        can_treat(nc, user, area_ids(db, user))
        items = rows(db, "nc_contencao", table("nc_contencao").c.nc_id == nc_id)
        if not items or any(x["disposicao_id"] is None for x in items):
            raise HTTPException(422, "Contenção exige disposição.")
        dispositions = {item["disposicao_id"]: row(db, "disposicao", item["disposicao_id"])["codigo"] for item in items}
        try:
            validate_concession_approvals(items, dispositions)
        except RuleError as exc:
            raise HTTPException(409, str(exc)) from None
        change_state(db, nc, user, "concluir_contencao")
    return {"status": "ANALISE_CAUSA"}


@router.post("/nc/{nc_id}/dispensar-corretiva")
def skip_corrective(nc_id: UUID, payload: ReasonIn, user: Actor = Depends(require("qualidade.nc.triar")), db: Session = Depends(session)):
    with db.begin():
        nc = get_nc(db, nc_id, user, lock=True)
        severity = row(db, "gravidade", nc["gravidade_id"])
        if severity["codigo"] == "MAIOR" or severity["acao_corretiva_obrigatoria"]:
            raise HTTPException(422, "NC Maior exige ação corretiva.")
        if severity["corretiva_se_recorrente"] and rows(db, "nc_vinculo", and_(table("nc_vinculo").c.nc_id == nc_id, table("nc_vinculo").c.tipo == "REINCIDENCIA")):
            raise HTTPException(422, "Reincidência exige ação corretiva.")
        try:
            require_text(payload.motivo, "Justificativa")
        except RuleError as exc:
            fail_rule(exc)
        change_state(db, nc, user, "dispensar_corretiva", description=payload.motivo)
    return {"status": "ENCERRAMENTO"}


@router.put("/nc/{nc_id}/causa")
def set_cause(nc_id: UUID, payload: CauseIn, user: Actor = Depends(require("qualidade.nc.tratar")), db: Session = Depends(session)):
    if payload.metodo not in ("5_PORQUES", "ISHIKAWA_6M", "PARETO", "ESTRATIFICACAO", "FALHA_CLASSIFICADA"):
        raise HTTPException(422, "Método inválido.")
    with db.begin():
        nc = get_nc(db, nc_id, user, lock=True)
        can_treat(nc, user, area_ids(db, user))
        if nc["status"] != "ANALISE_CAUSA":
            raise HTTPException(409, "NC fora da análise de causa.")
        existing = rows(db, "nc_causa", table("nc_causa").c.nc_id == nc_id)
        values = payload.model_dump(exclude={"porques"})
        if existing:
            cause_id = existing[0]["id"]
            db.execute(update(table("nc_causa")).where(table("nc_causa").c.id == cause_id).values(**values, atualizado_por=user.id))
        else:
            cause_id = new_id()
            db.execute(insert(table("nc_causa")).values(id=cause_id, nc_id=nc_id, empresa_id=nc["empresa_id"], unidade_codigo=nc["unidade_codigo"], criado_por=user.id, **values))
        previous = {x["ordem"]: x for x in rows(db, "nc_porque", table("nc_porque").c.nc_causa_id == cause_id)}
        if len(payload.porques) < len(previous):
            raise HTTPException(409, "Reduzir a cadeia dos 5 Porquês exige decisão de retenção dos dados anteriores.")
        for index, reason in enumerate(payload.porques, 1):
            if index in previous:
                db.execute(update(table("nc_porque")).where(table("nc_porque").c.id == previous[index]["id"]).values(texto=reason, atualizado_por=user.id))
            else:
                db.execute(insert(table("nc_porque")).values(id=new_id(), nc_causa_id=cause_id, empresa_id=nc["empresa_id"], unidade_codigo=nc["unidade_codigo"], ordem=index, texto=reason, criado_por=user.id))
        event(db, nc, user, "CAUSA_EDITADA", payload={"causa_id": str(cause_id)})
    return {"id": str(cause_id)}


@router.post("/nc/{nc_id}/concluir-causa")
def finish_cause(nc_id: UUID, user: Actor = Depends(require("qualidade.nc.tratar")), db: Session = Depends(session)):
    with db.begin():
        nc = get_nc(db, nc_id, user, lock=True)
        can_treat(nc, user, area_ids(db, user))
        causes = rows(db, "nc_causa", table("nc_causa").c.nc_id == nc_id)
        if not causes:
            raise HTTPException(422, "Registre a causa-raiz.")
        try:
            validate_cause(causes[0])
        except RuleError as exc:
            fail_rule(exc)
        change_state(db, nc, user, "concluir_causa")
    return {"status": "PLANO_ACAO"}


@router.post("/nc/{nc_id}/acoes", status_code=201)
def add_action(nc_id: UUID, payload: ActionIn, user: Actor = Depends(require("qualidade.nc.tratar")), db: Session = Depends(session)):
    with db.begin():
        nc = get_nc(db, nc_id, user, lock=True)
        can_treat(nc, user, area_ids(db, user))
        if nc["status"] != "PLANO_ACAO":
            raise HTTPException(409, "NC fora do plano de ação.")
        aid = new_id()
        db.execute(insert(table("nc_acao")).values(id=aid, nc_id=nc_id, empresa_id=nc["empresa_id"], unidade_codigo=nc["unidade_codigo"], status="PENDENTE", criado_por=user.id, **payload.model_dump()))
        event(db, nc, user, "ACAO_CRIADA", payload={"acao_id": str(aid)})
        if payload.quem_id:
            notify(db, nc, "ATRIBUICAO", payload.quem_id, suffix=str(aid))
            if payload.quando:
                notify(db, nc, "PRAZO_2_DIAS", payload.quem_id, due=datetime.combine(payload.quando - timedelta(days=2), datetime.min.time(), UTC), suffix=str(aid))
                notify(db, nc, "ATRASO", payload.quem_id, due=datetime.combine(payload.quando + timedelta(days=1), datetime.min.time(), UTC), suffix=str(aid))
    return {"id": str(aid)}


@router.post("/nc/{nc_id}/acoes/{action_id}/concluir")
def finish_action(nc_id: UUID, action_id: UUID, payload: ActionFinishIn, user: Actor = Depends(require("qualidade.nc.tratar")), db: Session = Depends(session)):
    with db.begin():
        nc = get_nc(db, nc_id, user, lock=True)
        can_treat(nc, user, area_ids(db, user))
        action = row(db, "nc_acao", action_id)
        if action["nc_id"] != nc_id or action["status"] == "CANCELADA":
            raise HTTPException(409, "Ação indisponível.")
        db.execute(update(table("nc_acao")).where(table("nc_acao").c.id == action_id).values(status="CONCLUIDA", evidencia=payload.evidencia, concluida_em=datetime.now(UTC), atualizado_por=user.id))
        event(db, nc, user, "ACAO_CONCLUIDA", payload={"acao_id": str(action_id)})
    return {"status": "CONCLUIDA"}


@router.patch("/nc/{nc_id}/acoes/{action_id}")
def edit_action(nc_id: UUID, action_id: UUID, payload: ActionPatch, user: Actor = Depends(require("qualidade.nc.tratar")), db: Session = Depends(session)):
    values = payload.model_dump(exclude_unset=True)
    if not values:
        raise HTTPException(422, "Nenhuma alteração informada.")
    if values.get("tipo") and values["tipo"] not in ("CONTENCAO", "CORRETIVA_IMEDIATA", "CORRETIVA", "PREVENTIVA"):
        raise HTTPException(422, "Tipo de ação inválido.")
    with db.begin():
        nc = get_nc(db, nc_id, user, lock=True)
        can_treat(nc, user, area_ids(db, user))
        item = row(db, "nc_acao", action_id)
        if item["nc_id"] != nc_id or item["status"] in ("CONCLUIDA", "CANCELADA"):
            raise HTTPException(409, "Ação fechada ou indisponível.")
        db.execute(update(table("nc_acao")).where(table("nc_acao").c.id == action_id).values(**values, atualizado_por=user.id))
        event(db, nc, user, "ACAO_EDITADA", payload={"acao_id": str(action_id), "campos": sorted(values)})
        if "quem_id" in values and values["quem_id"] != item["quem_id"]:
            notify(db, nc, "ATRIBUICAO", values["quem_id"], suffix=f"edit:{action_id}")
    return {"id": str(action_id), "alterada": True}


@router.post("/nc/{nc_id}/acoes/{action_id}/cancelar")
def cancel_action(nc_id: UUID, action_id: UUID, payload: ReasonIn, user: Actor = Depends(require("qualidade.nc.tratar")), db: Session = Depends(session)):
    with db.begin():
        nc = get_nc(db, nc_id, user, lock=True)
        can_treat(nc, user, area_ids(db, user))
        action = row(db, "nc_acao", action_id)
        if action["nc_id"] != nc_id or action["status"] == "CONCLUIDA":
            raise HTTPException(409, "Ação indisponível.")
        try:
            require_text(payload.motivo, "Motivo")
        except RuleError as exc:
            fail_rule(exc)
        db.execute(update(table("nc_acao")).where(table("nc_acao").c.id == action_id).values(status="CANCELADA", notas_verificacao=payload.motivo, atualizado_por=user.id))
        event(db, nc, user, "ACAO_CANCELADA", description=payload.motivo, payload={"acao_id": str(action_id)})
    return {"status": "CANCELADA"}


@router.post("/nc/{nc_id}/concluir-plano")
def finish_plan(nc_id: UUID, user: Actor = Depends(require("qualidade.nc.tratar")), db: Session = Depends(session)):
    with db.begin():
        nc = get_nc(db, nc_id, user, lock=True)
        can_treat(nc, user, area_ids(db, user))
        actions = rows(db, "nc_acao", table("nc_acao").c.nc_id == nc_id)
        if not actions or any(a["status"] not in ("CONCLUIDA", "CANCELADA") for a in actions):
            raise HTTPException(422, "Todas as ações devem estar concluídas ou canceladas com motivo.")
        severity = row(db, "gravidade", nc["gravidade_id"])
        if severity["codigo"] == "MAIOR" and not any(a["tipo"] == "CORRETIVA" and a["status"] == "CONCLUIDA" for a in actions):
            raise HTTPException(422, "NC Maior exige ação corretiva concluída.")
        change_state(db, nc, user, "concluir_plano")
    return {"status": "VERIFICACAO_EFICACIA"}


@router.post("/nc/{nc_id}/eficacia")
def effectiveness(nc_id: UUID, payload: EffectivenessIn, user: Actor = Depends(require("qualidade.nc.verificar_eficacia")), db: Session = Depends(session)):
    if payload.resultado not in ("EFICAZ", "NAO_EFICAZ"):
        raise HTTPException(422, "Resultado inválido.")
    successor_id = None
    successor_number = None
    with db.begin():
        nc = get_nc(db, nc_id, user, lock=True)
        if nc["status"] != "VERIFICACAO_EFICACIA":
            raise HTTPException(409, "NC fora da verificação de eficácia.")
        actions = rows(db, "nc_acao", table("nc_acao").c.nc_id == nc_id)
        try:
            validate_verifier(actions, user.id)
        except RuleError as exc:
            raise HTTPException(403, str(exc)) from None
        rounds = rows(db, "nc_eficacia", table("nc_eficacia").c.nc_id == nc_id)
        eid = new_id()
        db.execute(insert(table("nc_eficacia")).values(id=eid, nc_id=nc_id, empresa_id=nc["empresa_id"], unidade_codigo=nc["unidade_codigo"], rodada=len(rounds) + 1, criterio=payload.criterio, resultado=payload.resultado, notas=payload.notas, verificador_id=user.id, verificada_em=datetime.now(UTC), criado_por=user.id))
        event(db, nc, user, "EFICACIA", payload={"eficacia_id": str(eid), "resultado": payload.resultado})
        if payload.resultado == "NAO_EFICAZ":
            successor_number, year, ordinal = allocate_rnc_number(db, nc["empresa_id"])
            successor_id = new_id()
            successor = {
                "id": successor_id, "empresa_id": nc["empresa_id"],
                "unidade_codigo": nc["unidade_codigo"],
                "numero": successor_number, "numero_ano": year,
                "numero_ordem": ordinal, "numero_anterior_texto": nc["numero"],
                "titulo": f"Ação corretiva não eficaz - {nc['numero']}",
                "descricao": f"Nova RNC aberta após eficácia não confirmada na {nc['numero']}. {payload.notas or ''}".strip(),
                "origem_id": nc.get("origem_id"), "tipo_id": nc.get("tipo_id"),
                "gravidade_id": nc.get("gravidade_id"),
                "area_emissora_id": nc.get("area_responsavel_id") or nc.get("area_emissora_id"),
                "local_id": nc.get("local_id"), "atividade_id": nc.get("atividade_id"),
                "data_deteccao": datetime.now(UTC), "data_emissao": date.today(),
                "status": "REGISTRADA", "criado_por": user.id,
            }
            db.execute(insert(table("nc")).values(**successor))
            db.execute(insert(table("nc_vinculo")).values(
                id=new_id(), nc_id=nc_id, nc_relacionada_id=successor_id,
                empresa_id=nc["empresa_id"], unidade_codigo=nc["unidade_codigo"],
                tipo="INEFICACIA", criado_por=user.id))
            event(db, nc, user, "NOVA_RNC_VINCULADA", description=f"Eficácia não confirmada; nova RNC {successor_number}.",
                  payload={"rnc_id": str(successor_id), "rnc_numero": successor_number})
            event(db, successor, user, "REGISTRO", current="REGISTRADA",
                  description=f"Criada pela eficácia não confirmada na {nc['numero']}.",
                  payload={"rnc_origem_id": str(nc_id), "rnc_origem_numero": nc["numero"]})
        change_state(db, nc, user, "eficaz" if payload.resultado == "EFICAZ" else "ineficaz")
    return {"status": nc["status"], "rodada": len(rounds) + 1,
            "nova_rnc_id": str(successor_id) if successor_id else None,
            "nova_rnc_numero": successor_number}


@router.post("/nc/{nc_id}/eficacia/acompanhamento", status_code=201)
def add_effectiveness_followup(nc_id: UUID, payload: EffectivenessFollowupIn,
                               user: Actor = Depends(require("qualidade.nc.verificar_eficacia")),
                               db: Session = Depends(session)):
    try:
        evidence = require_text(payload.evidencia, "Evidência do acompanhamento")
    except RuleError as exc:
        fail_rule(exc)
    with db.begin():
        nc = get_nc(db, nc_id, user, lock=True)
        if nc["status"] != "VERIFICACAO_EFICACIA":
            raise HTTPException(409, "RNC fora da verificação de eficácia.")
        fid = new_id()
        db.execute(insert(table("nc_eficacia_acompanhamento")).values(
            id=fid, nc_id=nc_id, empresa_id=nc["empresa_id"],
            unidade_codigo=nc["unidade_codigo"], data=payload.data,
            evidencia=evidence, verificador_id=user.id, criado_por=user.id))
        event(db, nc, user, "ACOMPANHAMENTO_EFICACIA", payload={"acompanhamento_id": str(fid)})
    return {"id": str(fid)}


@router.put("/nc/{nc_id}/encerramento")
def prepare_closure(nc_id: UUID, payload: ClosureIn, user: Actor = Depends(require("qualidade.nc.tratar")), db: Session = Depends(session)):
    with db.begin():
        nc = get_nc(db, nc_id, user, lock=True)
        can_treat(nc, user, area_ids(db, user))
        if nc["status"] != "ENCERRAMENTO":
            raise HTTPException(409, "NC fora da etapa de encerramento.")
        existing = rows(db, "nc_encerramento", table("nc_encerramento").c.nc_id == nc_id)
        if existing:
            db.execute(update(table("nc_encerramento")).where(table("nc_encerramento").c.nc_id == nc_id).values(**payload.model_dump(), atualizado_por=user.id))
        else:
            db.execute(insert(table("nc_encerramento")).values(id=new_id(), nc_id=nc_id, empresa_id=nc["empresa_id"], unidade_codigo=nc["unidade_codigo"], criado_por=user.id, **payload.model_dump()))
        event(db, nc, user, "ENCERRAMENTO_PREPARADO")
        notify(db, nc, "PEDIDO_APROVACAO", nc.get("responsavel_id"), suffix="encerramento")
    return {"status": "ENCERRAMENTO"}


@router.post("/nc/{nc_id}/encerrar")
def close(nc_id: UUID, user: Actor = Depends(require("qualidade.nc.encerrar")), db: Session = Depends(session)):
    with db.begin():
        nc = get_nc(db, nc_id, user, lock=True)
        closure = rows(db, "nc_encerramento", table("nc_encerramento").c.nc_id == nc_id)
        if not closure:
            raise HTTPException(422, "Preencha o encerramento.")
        actions = rows(db, "nc_acao", table("nc_acao").c.nc_id == nc_id)
        efficacy = sorted(rows(db, "nc_eficacia", table("nc_eficacia").c.nc_id == nc_id), key=lambda x: x["rodada"])
        severity = row(db, "gravidade", nc["gravidade_id"])
        try:
            links = rows(db, "nc_vinculo", and_(table("nc_vinculo").c.nc_id == nc_id,
                                                 table("nc_vinculo").c.tipo == "INEFICACIA"))
            validate_closure(nc, closure[0], actions, efficacy, severity["codigo"],
                             successor_exists=bool(links))
        except RuleError as exc:
            fail_rule(exc)
        change_state(db, nc, user, "encerrar")
        db.execute(update(table("nc")).where(table("nc").c.id == nc_id).values(encerrada_em=datetime.now(UTC), encerrada_por=user.id))
        db.execute(update(table("nc_encerramento")).where(table("nc_encerramento").c.nc_id == nc_id).values(aprovado_por=user.id, aprovado_em=datetime.now(UTC)))
    return {"status": "ENCERRADA"}


@router.post("/nc/{nc_id}/reabrir")
def reopen(nc_id: UUID, payload: ReasonIn, user: Actor = Depends(require("qualidade.nc.encerrar")), db: Session = Depends(session)):
    with db.begin():
        nc = get_nc(db, nc_id, user, lock=True)
        try:
            require_text(payload.motivo, "Motivo")
        except RuleError as exc:
            fail_rule(exc)
        change_state(db, nc, user, "reabrir", description=payload.motivo)
        db.execute(update(table("nc")).where(table("nc").c.id == nc_id).values(reaberta_em=datetime.now(UTC), reaberta_por=user.id))
    return {"status": "ANALISE_CAUSA"}


@router.post("/nc/{nc_id}/cancelar")
def cancel(nc_id: UUID, payload: ReasonIn, user: Actor = Depends(require("qualidade.nc.triar")), db: Session = Depends(session)):
    with db.begin():
        nc = get_nc(db, nc_id, user, lock=True)
        try:
            require_text(payload.motivo, "Motivo")
        except RuleError as exc:
            fail_rule(exc)
        action = "cancelar_registrada" if nc["status"] == "REGISTRADA" else "cancelar_contencao"
        change_state(db, nc, user, action, description=payload.motivo)
    return {"status": "CANCELADA"}


@router.post("/nc/{nc_id}/comentarios", status_code=201)
def comment(nc_id: UUID, payload: CommentIn, user: Actor = Depends(actor), db: Session = Depends(session)):
    with db.begin():
        nc = get_nc(db, nc_id, user, lock=True)
        try:
            require_text(payload.texto, "Comentário")
        except RuleError as exc:
            fail_rule(exc)
        cid = new_id()
        db.execute(insert(table("nc_comentario")).values(id=cid, nc_id=nc_id, empresa_id=nc["empresa_id"], unidade_codigo=nc["unidade_codigo"], texto=payload.texto, autor_id=user.id, criado_por=user.id))
        event(db, nc, user, "COMENTARIO", payload={"comentario_id": str(cid)})
    return {"id": str(cid)}


@router.get("/nc/{nc_id}/semelhantes")
def similar(nc_id: UUID, user: Actor = Depends(actor), db: Session = Depends(session)):
    nc = get_nc(db, nc_id, user)
    n = table("nc")
    matches = []
    if nc["produto_pcp_id"]:
        matches.append(n.c.produto_pcp_id == nc["produto_pcp_id"])
    if nc["setor_pcp_id"]:
        matches.append(n.c.setor_pcp_id == nc["setor_pcp_id"])
    if not matches:
        return []
    stmt = select(n).where(and_(n.c.empresa_id == nc["empresa_id"], n.c.unidade_codigo == nc["unidade_codigo"], n.c.id != nc_id,
                                or_(*matches))).limit(10)
    allowed = area_ids(db, user)
    return jsonable_encoder([dict(x) for x in db.execute(stmt).mappings() if can_read(dict(x), user, allowed)])


@router.post("/nc/{nc_id}/vinculos", status_code=201)
def link_nc(nc_id: UUID, payload: LinkIn, user: Actor = Depends(require("qualidade.nc.tratar")), db: Session = Depends(session)):
    if payload.tipo not in ("REINCIDENCIA", "SEMELHANTE") or payload.relacionada_id == nc_id:
        raise HTTPException(422, "Vínculo inválido.")
    with db.begin():
        nc = get_nc(db, nc_id, user, lock=True)
        can_treat(nc, user, area_ids(db, user))
        related = get_nc(db, payload.relacionada_id, user)
        if related["empresa_id"] != nc["empresa_id"] or related["unidade_codigo"] != nc["unidade_codigo"]:
            raise HTTPException(422, "NC relacionada fora da empresa/unidade.")
        link_id = new_id()
        db.execute(pg_insert(table("nc_vinculo")).values(id=link_id, nc_id=nc_id, nc_relacionada_id=payload.relacionada_id, empresa_id=nc["empresa_id"], unidade_codigo=nc["unidade_codigo"], tipo=payload.tipo, criado_por=user.id).on_conflict_do_nothing(index_elements=["nc_id", "nc_relacionada_id", "tipo"]))
        event(db, nc, user, "VINCULO", payload={"relacionada_id": str(payload.relacionada_id), "tipo": payload.tipo})
    return {"id": str(link_id)}


@router.post("/nc/{nc_id}/documentos", status_code=201)
def add_document_reference(nc_id: UUID, payload: DocumentRefIn,
                           user: Actor = Depends(require("qualidade.nc.tratar")),
                           db: Session = Depends(session)):
    code = payload.codigo.strip().upper()
    if not 2 <= len(code) <= 80 or payload.papel not in {"REQUISITO", "A_REVISAR"}:
        raise HTTPException(422, "Referência GED inválida.")
    with db.begin():
        nc = get_nc(db, nc_id, user, lock=True)
        can_treat(nc, user, area_ids(db, user))
        ref_id = new_id()
        db.execute(insert(table("nc_documento_ref")).values(
            id=ref_id, nc_id=nc_id, empresa_id=nc["empresa_id"], unidade_codigo=nc["unidade_codigo"],
            codigo=code, revisao=payload.revisao.strip() if payload.revisao else None,
            papel=payload.papel, criado_por=user.id))
        event(db, nc, user, "DOCUMENTO_REF", payload={"codigo": code, "papel": payload.papel})
    return {"id": str(ref_id), "codigo": code}


@router.post("/nc/{nc_id}/anexos", status_code=201)
async def upload(nc_id: UUID, file: UploadFile = File(...), etapa: str = "GERAL", user: Actor = Depends(actor), db: Session = Depends(session)):
    mime = (file.content_type or "").split(";", 1)[0].lower()
    data = await file.read(MAX_FILE + 1)
    try:
        validate_file(mime, data)
    except RuleError as exc:
        raise HTTPException(413 if len(data) > MAX_FILE else 415, str(exc)) from None
    root = Path(os.getenv("QUALIDADE_UPLOAD_DIR", "/var/lib/qualidade/anexos")).resolve()
    if "public" in root.parts or "static" in root.parts:
        raise HTTPException(503, "Diretório de anexos inseguro.")
    attachment_id = new_id()
    relative = f"{nc_id}/{attachment_id}"
    target = root / relative
    target.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
    temporary = target.with_suffix(".tmp")
    temporary.write_bytes(data)
    try:
        with db.begin():
            nc = get_nc(db, nc_id, user, lock=True)
            if not (user.has("qualidade.nc.abrir") and nc["criado_por"] == user.id and nc["status"] in ("RASCUNHO", "REGISTRADA")):
                can_treat(nc, user, area_ids(db, user))
            db.execute(insert(table("nc_anexo")).values(id=attachment_id, nc_id=nc_id, empresa_id=nc["empresa_id"], unidade_codigo=nc["unidade_codigo"], nome_original=Path(file.filename or "anexo").name, nome_armazenado=str(attachment_id), mime=mime, tamanho=len(data), sha256=hashlib.sha256(data).hexdigest(), etapa=etapa, storage_path=relative, enviado_por=user.id, criado_por=user.id))
            event(db, nc, user, "ANEXO", payload={"anexo_id": str(attachment_id)})
        temporary.replace(target)
    finally:
        temporary.unlink(missing_ok=True)
    return {"id": str(attachment_id), "sha256": hashlib.sha256(data).hexdigest()}


@router.get("/nc/{nc_id}/anexos/{attachment_id}")
def download(nc_id: UUID, attachment_id: UUID, user: Actor = Depends(actor), db: Session = Depends(session)):
    nc = get_nc(db, nc_id, user)
    meta = row(db, "nc_anexo", attachment_id)
    if meta["nc_id"] != nc_id:
        raise HTTPException(404, "Anexo não encontrado.")
    root = Path(os.getenv("QUALIDADE_UPLOAD_DIR", "/var/lib/qualidade/anexos")).resolve()
    target = (root / meta["storage_path"]).resolve()
    if not target.is_relative_to(root) or not target.is_file():
        raise HTTPException(404, "Arquivo indisponível.")
    return FileResponse(target, media_type=meta["mime"], filename=meta["nome_original"], headers={"Cache-Control": "private, no-store"})


@router.get("/nc/{nc_id}/pdf")
def pdf(nc_id: UUID, user: Actor = Depends(actor), db: Session = Depends(session)):
    nc = get_nc(db, nc_id, user)
    catalog_names = {}
    for name in ("origem", "area", "local", "atividade"):
        key = name + "_id" if name != "area" else "area_emissora_id"
        if nc.get(key):
            catalog_names[key] = row(db, name, nc[key])["nome"]
    relation = table("nc_vinculo")
    link = one(db, select(relation).where(and_(relation.c.nc_id == nc_id,
                                                 relation.c.tipo == "INEFICACIA")))
    successor = row(db, "nc", link["nc_relacionada_id"])["numero"] if link else None
    def attached(name: str):
        t = table(name)
        return rows(db, name, t.c.nc_id == nc_id)
    pdf_bytes = render_rnc_form(
        nc, catalogs=catalog_names,
        containments=attached("nc_contencao"), causes=attached("nc_causa"),
        actions=attached("nc_acao"),
        followups=sorted(attached("nc_eficacia_acompanhamento"), key=lambda x: (x["data"], x["criado_em"])),
        efficacies=sorted(attached("nc_eficacia"), key=lambda x: x["rodada"]),
        closures=attached("nc_encerramento"), successor_number=successor)
    filename = f"RNC - Eletrônico - {nc['numero'] or 'Rascunho'}.pdf"
    return Response(pdf_bytes, media_type="application/pdf", headers={
        "Content-Disposition": f"attachment; filename=\"RNC - Eletronico - {nc['numero'] or 'Rascunho'}.pdf\"; filename*=UTF-8''{quote(filename)}",
        "Cache-Control": "private, no-store"})


@router.get("/cadastros/{name}")
def list_catalog(name: str, company: UUID, user: Actor = Depends(actor), db: Session = Depends(session)):
    if name not in ("origem", "tipo", "gravidade", "area", "disposicao", "local", "atividade"):
        raise HTTPException(404)
    t = table(name)
    return jsonable_encoder([dict(x) for x in db.execute(select(t).where(t.c.empresa_id == company)).mappings()])


@router.post("/cadastros/{name}", status_code=201)
def create_catalog(name: str, payload: CatalogIn, user: Actor = Depends(require("qualidade.nc.cadastros")), db: Session = Depends(session)):
    if name not in ("origem", "tipo", "area", "disposicao", "gravidade", "local", "atividade"):
        raise HTTPException(404)
    values = payload.model_dump()
    policy = ("prazo_causa_dias", "prazo_final_dias", "acao_corretiva_obrigatoria", "corretiva_se_recorrente")
    if name == "gravidade":
        if any(values[field] is None for field in policy[:2]) or any(
            values[field] is not None and values[field] < 0 for field in policy[:2]
        ):
            raise HTTPException(422, "Informe prazos não negativos para a gravidade.")
        for field in policy[2:]:
            values[field] = bool(values[field])
    else:
        for field in policy:
            values.pop(field)
    with db.begin():
        cid = new_id()
        db.execute(insert(table(name)).values(id=cid, criado_por=user.id, **values))
    return {"id": str(cid)}


@router.patch("/cadastros/{name}/{item_id}")
def patch_catalog(name: str, item_id: UUID, payload: CatalogPatch,
                  user: Actor = Depends(require("qualidade.nc.cadastros")), db: Session = Depends(session)):
    if name not in ("origem", "tipo", "area", "disposicao", "gravidade", "local", "atividade"):
        raise HTTPException(404)
    values = payload.model_dump(exclude_unset=True)
    if not values or any(value is None for value in values.values()):
        raise HTTPException(422, "Informe um campo para atualizar.")
    policy = {"prazo_causa_dias", "prazo_final_dias", "acao_corretiva_obrigatoria", "corretiva_se_recorrente"}
    if name != "gravidade" and policy.intersection(values):
        raise HTTPException(422, "Política de prazo e ação só se aplica à gravidade.")
    if any(values.get(field, 0) < 0 for field in ("prazo_causa_dias", "prazo_final_dias")):
        raise HTTPException(422, "Prazos não podem ser negativos.")
    for field in ("codigo", "nome"):
        if field in values:
            values[field] = values[field].strip()
            if not values[field]:
                raise HTTPException(422, f"{field} não pode ficar vazio.")
    t = table(name)
    try:
        with db.begin():
            current = one(db, select(t).where(t.c.id == item_id).with_for_update())
            if not current or (user.unit and current["unidade_codigo"] not in (None, user.unit)):
                raise HTTPException(404, "Cadastro não encontrado.")
            db.execute(update(t).where(t.c.id == item_id).values(**values, atualizado_por=user.id,
                                                               atualizado_em=datetime.now(UTC)))
    except IntegrityError:
        raise HTTPException(409, "Código já cadastrado.") from None
    return {"id": str(item_id), **values}


@router.get("/cadastros/contatos/usuarios")
def list_contacts(user: Actor = Depends(require("qualidade.nc.cadastros")), db: Session = Depends(session)):
    return jsonable_encoder([dict(x) for x in db.execute(select(table("usuario_contato")).order_by(table("usuario_contato").c.usuario_id)).mappings()])


@router.put("/cadastros/contatos/usuarios/{user_id}")
def set_contact(user_id: str, payload: ContactIn, user: Actor = Depends(require("qualidade.nc.cadastros")), db: Session = Depends(session)):
    from email.utils import parseaddr
    email = payload.email.strip()
    parsed = parseaddr(email)[1]
    if parsed != email or "@" not in parsed or len(parsed) > 254:
        raise HTTPException(422, "E-mail inválido.")
    with db.begin():
        t = table("usuario_contato")
        db.execute(pg_insert(t).values(usuario_id=user_id, email=email, ativo=True, criado_por=user.id)
                   .on_conflict_do_update(index_elements=["usuario_id"], set_={"email": email, "ativo": True, "atualizado_por": user.id, "atualizado_em": datetime.now(UTC)}))
    return {"usuario_id": user_id, "email": email}


@router.patch("/cadastros/contatos/usuarios/{user_id}")
def patch_contact(user_id: str, payload: ContactPatch,
                  user: Actor = Depends(require("qualidade.nc.cadastros")), db: Session = Depends(session)):
    from email.utils import parseaddr
    values = payload.model_dump(exclude_unset=True)
    if not values or any(value is None for value in values.values()):
        raise HTTPException(422, "Informe um campo para atualizar.")
    if "email" in values:
        email = values["email"].strip()
        if parseaddr(email)[1] != email or "@" not in email or len(email) > 254:
            raise HTTPException(422, "E-mail inválido.")
        values["email"] = email
    t = table("usuario_contato")
    with db.begin():
        current = one(db, select(t).where(t.c.usuario_id == user_id).with_for_update())
        if not current:
            raise HTTPException(404, "Contato não encontrado.")
        db.execute(update(t).where(t.c.usuario_id == user_id).values(**values, atualizado_por=user.id,
                                                                atualizado_em=datetime.now(UTC)))
    return {"usuario_id": user_id, **values}

