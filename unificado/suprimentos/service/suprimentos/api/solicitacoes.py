"""Solicitações S1. Toda mutação usa uma transação e emite evento."""
from __future__ import annotations

import hashlib
import os
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal, InvalidOperation
from pathlib import Path
from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, Request, UploadFile
from fastapi.encoders import jsonable_encoder
from fastapi.responses import FileResponse
from sqlalchemy import and_, func, insert, or_, select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..auth import Actor, check_action, context, current_actor
from ..db import session, table
from ..ids import uuid7
from ..workflow import (allocate_number, approval_levels, approve_one, can_view, change,
                        estimate, get_request, record_event, require_owner, require_view, sla)

router = APIRouter(prefix="/api/suprimentos", tags=["Solicitações"])
UTC = timezone.utc
STATUSES = {"RASCUNHO", "EM_APROVACAO", "DEVOLVIDA", "APROVADA", "EM_ATENDIMENTO", "ENTREGUE", "CONCLUIDA", "REPROVADA", "CANCELADA"}
URGENCIES = {"NORMAL", "URGENTE", "PAROU_PRODUCAO"}


def parsed_id(value: str) -> UUID:
    try:
        return UUID(value)
    except ValueError:
        raise HTTPException(404, "Solicitação não encontrada") from None


def payload_items(db: Session, ctx, items: list[dict]):
    if not isinstance(items, list) or not 1 <= len(items) <= 100:
        raise HTTPException(422, "Informe de 1 a 100 itens")
    material = table("sup_material")
    measures = table("sup_unidade_medida")
    result = []
    for raw in items:
        try:
            mid = UUID(raw["material_id"]) if raw.get("material_id") else None
            description = (raw.get("descricao_livre") or "").strip() or None
            if (mid is None) == (description is None):
                raise ValueError("Informe material ou descrição livre")
            quantity = Decimal(str(raw["qtd"]).replace(",", "."))
            if quantity <= 0 or quantity.as_tuple().exponent < -4:
                raise ValueError("Quantidade inválida")
            measure = UUID(raw["un"])
            if db.execute(select(measures.c.id).where(and_(measures.c.id == measure, measures.c.ativo.is_(True)))).scalar_one_or_none() is None:
                raise ValueError("Unidade de medida indisponível")
            if mid:
                found = db.execute(select(material).where(and_(material.c.id == mid, material.c.ativo.is_(True), material.c.dominio == "almoxarifado"))).mappings().one_or_none()
                if not found:
                    raise ValueError("Material indisponível no almoxarifado")
            price = raw.get("preco_informado")
            if price is not None:
                check_action(ctx, "solicitacao.precificar", write=True, phase="S1", db=db)
                price = Decimal(str(price).replace(",", "."))
                if price < 0:
                    raise ValueError("Preço inválido")
            result.append(dict(id=uuid7(), material_id=mid, descricao_livre=description,
                               qtd=quantity, un=measure, preco_informado=price))
        except (KeyError, ValueError, TypeError, InvalidOperation) as exc:
            raise HTTPException(422, f"Item inválido: {exc}") from None
    return result


def request_detail(db: Session, ctx, request: dict):
    item = table("sup_solicitacao_item")
    event = table("sup_evento")
    photo = table("sup_solicitacao_foto")
    items = db.execute(select(item).where(and_(item.c.solicitacao_id == request["id"], item.c.unidade_id == ctx.unit_id))).mappings().all()
    events = db.execute(select(event).where(and_(event.c.unidade_id == ctx.unit_id, event.c.alvo_tipo == "solicitacao", event.c.alvo_id == request["id"])).order_by(event.c.em)).mappings().all()
    photos = db.execute(select(photo.c.id, photo.c.nome_original, photo.c.tamanho).where(and_(photo.c.solicitacao_id == request["id"], photo.c.unidade_id == ctx.unit_id))).mappings().all()
    return jsonable_encoder({**request, "itens": [dict(x) for x in items], "eventos": [dict(x) for x in events], "fotos": [dict(x) for x in photos]})


def create_request(data: dict, unidade: str, origin: str, user: Actor, db: Session, *, require_uuid=False):
    ctx = context(unidade, user, db)
    cc = table("sup_centro_custo")
    try:
        cc_id = UUID(data["cc_id"])
        client_uuid = UUID(data["client_uuid"]) if data.get("client_uuid") else None
        if require_uuid and client_uuid is None:
            raise ValueError("client_uuid obrigatório")
        urgency = data.get("urgencia", "NORMAL")
        if urgency not in URGENCIES:
            raise ValueError("Urgência inválida")
        justification = (data.get("justificativa") or "").strip()
        if urgency == "PAROU_PRODUCAO" and len(justification) < 20:
            raise ValueError("Parou produção exige justificativa de pelo menos 20 caracteres")
        needed = date.fromisoformat(data["precisa_em"]) if data.get("precisa_em") else None
    except (KeyError, ValueError, TypeError) as exc:
        raise HTTPException(422, f"Dados inválidos: {exc}") from None
    check_action(ctx, "solicitacao.criar", str(cc_id), write=True, phase="S1", db=db)
    if db.execute(select(cc.c.id).where(and_(cc.c.id == cc_id, cc.c.unidade_id == ctx.unit_id, cc.c.ativo.is_(True)))).scalar_one_or_none() is None:
        raise HTTPException(422, "Centro de custo indisponível")
    t = table("sup_solicitacao")
    if client_uuid:
        existing = db.execute(select(t).where(and_(t.c.unidade_id == ctx.unit_id, t.c.client_uuid == client_uuid))).mappings().one_or_none()
        if existing:
            if existing["solicitante_id"] != user.id:
                raise HTTPException(409, "client_uuid já utilizado")
            return request_detail(db, ctx, dict(existing)), False
    items = payload_items(db, ctx, data.get("itens"))
    request_id = uuid7()
    row = dict(id=request_id, unidade_id=ctx.unit_id, numero=allocate_number(db, ctx), cc_id=cc_id,
               solicitante_id=user.id, solicitante_nome=user.name, origem=origin,
               urgencia=urgency, precisa_em=needed, justificativa=justification,
               status="RASCUNHO", client_uuid=client_uuid, criado_por=user.id, atualizado_por=user.id)
    try:
        db.execute(insert(t).values(**row))
        item_t = table("sup_solicitacao_item")
        for item in items:
            db.execute(insert(item_t).values(**item, solicitacao_id=request_id, unidade_id=ctx.unit_id,
                                             criado_por=user.id, atualizado_por=user.id))
        record_event(db, ctx, request_id, None, "RASCUNHO")
        db.commit()
    except IntegrityError:
        db.rollback()
        if client_uuid:
            found = db.execute(select(t).where(and_(t.c.unidade_id == ctx.unit_id, t.c.client_uuid == client_uuid))).mappings().one_or_none()
            if found and found["solicitante_id"] == user.id:
                return request_detail(db, ctx, dict(found)), False
        raise HTTPException(409, "Conflito ao criar solicitação") from None
    return request_detail(db, ctx, get_request(db, ctx, request_id)), True


@router.get("/solicitacoes")
def list_requests(unidade: str = "campinas", status: str | None = None, minha_alcada: bool = False,
                  origem: str | None = None, urgencia: str | None = None, cc_id: str | None = None, q: str = "",
                  page: int = Query(1, ge=1), size: int = Query(25, ge=1, le=100),
                  user: Actor = Depends(current_actor), db: Session = Depends(session)):
    ctx = context(unidade, user, db)
    t = table("sup_solicitacao")
    conditions = [t.c.unidade_id == ctx.unit_id]
    if status:
        if status not in STATUSES:
            raise HTTPException(422, "Situação inválida")
        conditions.append(t.c.status == status)
    if origem:
        conditions.append(t.c.origem == origem)
    if urgencia:
        conditions.append(t.c.urgencia == urgencia)
    if cc_id:
        try:
            conditions.append(t.c.cc_id == UUID(cc_id))
        except ValueError:
            raise HTTPException(422, "Centro de custo inválido") from None
    if q:
        conditions.append(or_(t.c.numero.ilike(f"%{q[:80]}%"), t.c.solicitante_nome.ilike(f"%{q[:80]}%")))
    rows = db.execute(select(t).where(and_(*conditions)).order_by(t.c.criado_em.desc())).mappings().all()
    visible = [dict(row) for row in rows if can_view(ctx, row) and (not minha_alcada or
               (row["status"] == "EM_APROVACAO" and ctx.has("solicitacao.aprovar", str(row["cc_id"]), row["nivel_atual"]))) ]
    selected = visible[(page-1)*size:page*size]
    if selected:
        item = table("sup_solicitacao_item")
        material = table("sup_material")
        items = db.execute(select(item.c.solicitacao_id, item.c.descricao_livre, material.c.descricao)
                           .outerjoin(material, item.c.material_id == material.c.id)
                           .where(and_(item.c.unidade_id == ctx.unit_id,
                                        item.c.solicitacao_id.in_([row["id"] for row in selected])))).all()
        summaries = {}
        for entry in items:
            summaries.setdefault(entry.solicitacao_id, []).append(entry.descricao_livre or entry.descricao or "Material")
        for row in selected:
            names = summaries.get(row["id"], [])
            row["resumo"] = ", ".join(names[:2]) + (f" +{len(names)-2}" if len(names) > 2 else "")
    return {"total": len(visible), "page": page, "size": size,
            "items": jsonable_encoder(selected)}


@router.post("/solicitacoes", status_code=201)
def create_web(data: dict, unidade: str = "campinas", user: Actor = Depends(current_actor), db: Session = Depends(session)):
    result, _ = create_request(data, unidade, "web", user, db)
    return result


@router.post("/pwa/solicitacoes")
def create_pwa(data: dict, unidade: str = "campinas", user: Actor = Depends(current_actor), db: Session = Depends(session)):
    result, _ = create_request(data, unidade, "pwa", user, db, require_uuid=True)
    return result


@router.get("/solicitacoes/{request_id}")
def detail(request_id: str, unidade: str = "campinas", user: Actor = Depends(current_actor), db: Session = Depends(session)):
    ctx = context(unidade, user, db)
    request = get_request(db, ctx, parsed_id(request_id))
    require_view(ctx, request)
    return request_detail(db, ctx, request)


@router.patch("/solicitacoes/{request_id}")
def edit_request(request_id: str, data: dict, unidade: str = "campinas", user: Actor = Depends(current_actor), db: Session = Depends(session)):
    ctx = context(unidade, user, db)
    request = get_request(db, ctx, parsed_id(request_id), lock=True)
    require_owner(ctx, request)
    check_action(ctx, "solicitacao.criar", str(request["cc_id"]), write=True, phase="S1", db=db)
    if request["status"] not in {"RASCUNHO", "DEVOLVIDA"}:
        raise HTTPException(409, "Solicitação não editável")
    values = {}
    if "urgencia" in data:
        if data["urgencia"] not in URGENCIES:
            raise HTTPException(422, "Urgência inválida")
        values["urgencia"] = data["urgencia"]
    if "justificativa" in data:
        values["justificativa"] = str(data["justificativa"]).strip()
    if "precisa_em" in data:
        try:
            values["precisa_em"] = date.fromisoformat(data["precisa_em"]) if data["precisa_em"] else None
        except ValueError:
            raise HTTPException(422, "Data inválida") from None
    if "itens" in data:
        values["itens"] = payload_items(db, ctx, data["itens"])
    if set(data) - {"urgencia", "justificativa", "precisa_em", "itens"}:
        raise HTTPException(422, "Campos inválidos")
    if not values:
        raise HTTPException(422, "Nenhuma alteração")
    urgency = values.get("urgencia", request["urgencia"])
    reason = values.get("justificativa", request["justificativa"] or "")
    if urgency == "PAROU_PRODUCAO" and len(reason) < 20:
        raise HTTPException(422, "Parou produção exige justificativa de pelo menos 20 caracteres")
    new_items = values.pop("itens", None)
    t = table("sup_solicitacao")
    db.execute(update(t).where(t.c.id == request["id"]).values(**values, atualizado_por=user.id, atualizado_em=datetime.now(UTC)))
    if new_items is not None:
        item_t = table("sup_solicitacao_item")
        db.execute(item_t.delete().where(and_(item_t.c.solicitacao_id == request["id"], item_t.c.unidade_id == ctx.unit_id)))
        for item in new_items:
            db.execute(insert(item_t).values(**item, solicitacao_id=request["id"], unidade_id=ctx.unit_id,
                                             criado_por=user.id, atualizado_por=user.id))
    record_event(db, ctx, request["id"], request["status"], request["status"], "Solicitação editada")
    db.commit()
    return request_detail(db, ctx, get_request(db, ctx, request["id"]))


@router.post("/solicitacoes/{request_id}/enviar")
def send_request(request_id: str, unidade: str = "campinas", user: Actor = Depends(current_actor), db: Session = Depends(session)):
    ctx = context(unidade, user, db)
    request = get_request(db, ctx, parsed_id(request_id), lock=True)
    require_owner(ctx, request)
    check_action(ctx, "solicitacao.criar", str(request["cc_id"]), write=True, phase="S1", db=db)
    if request["status"] not in {"RASCUNHO", "DEVOLVIDA"}:
        raise HTTPException(409, "Solicitação já enviada")
    total, missing, items = estimate(db, ctx, request["id"])
    levels = approval_levels(db, ctx, request, items, total)
    change(db, ctx, request, "EM_APROVACAO", allowed=("RASCUNHO", "DEVOLVIDA"),
           nivel_atual=levels[0], niveis_total=len(levels), valor_estimado=total,
           sem_preco=missing, vence_em=sla(db, ctx, request["urgencia"]))
    db.commit()
    return request_detail(db, ctx, request)


@router.post("/solicitacoes/aprovar-lote")
def approve_batch(data: dict, unidade: str = "campinas", user: Actor = Depends(current_actor), db: Session = Depends(session)):
    ctx = context(unidade, user, db)
    ids = data.get("ids")
    decision = data.get("decisao", "APROVADA")
    comment = data.get("comentario")
    if not isinstance(ids, list) or not ids or len(ids) > 100 or decision not in {"APROVADA", "DEVOLVIDA", "REPROVADA"}:
        raise HTTPException(422, "Lote inválido")
    results = []
    for identifier in ids:
        try:
            with db.begin_nested():
                result = approve_one(db, ctx, parsed_id(identifier), decision, comment)
            results.append({"id": identifier, "ok": True, **result})
        except HTTPException as exc:
            results.append({"id": identifier, "ok": False, "status_code": exc.status_code, "erro": exc.detail})
    db.commit()
    return {"resultados": results}


@router.post("/solicitacoes/{request_id}/aprovar")
@router.post("/solicitacoes/{request_id}/devolver")
@router.post("/solicitacoes/{request_id}/reprovar")
def decide(request_id: str, request: Request, data: dict | None = None, unidade: str = "campinas",
           user: Actor = Depends(current_actor), db: Session = Depends(session)):
    mapping = {"aprovar": "APROVADA", "devolver": "DEVOLVIDA", "reprovar": "REPROVADA"}
    decision = request.url.path.rsplit("/", 1)[-1]
    ctx = context(unidade, user, db)
    result = approve_one(db, ctx, parsed_id(request_id), mapping[decision], (data or {}).get("comentario"))
    db.commit()
    return result


@router.post("/solicitacoes/{request_id}/cancelar")
def cancel_request(request_id: str, unidade: str = "campinas", user: Actor = Depends(current_actor), db: Session = Depends(session)):
    ctx = context(unidade, user, db)
    request = get_request(db, ctx, parsed_id(request_id), lock=True)
    require_owner(ctx, request)
    check_action(ctx, "solicitacao.criar", str(request["cc_id"]), write=True, phase="S1", db=db)
    item = table("sup_solicitacao_item")
    if db.execute(select(func.count()).select_from(item).where(and_(item.c.solicitacao_id == request["id"], item.c.status != "PENDENTE"))).scalar_one():
        raise HTTPException(409, "Item já em atendimento")
    change(db, ctx, request, "CANCELADA", allowed=("RASCUNHO", "DEVOLVIDA", "EM_APROVACAO", "APROVADA"))
    db.commit()
    return {"status": "CANCELADA"}


def item_for_action(db, ctx, item_id):
    t = table("sup_solicitacao_item")
    row = db.execute(select(t).where(and_(t.c.id == parsed_id(item_id), t.c.unidade_id == ctx.unit_id)).with_for_update()).mappings().one_or_none()
    if not row:
        raise HTTPException(404, "Item não encontrado")
    request = get_request(db, ctx, row["solicitacao_id"], lock=True)
    return dict(row), request


@router.post("/itens/{item_id}/separar")
def separate(item_id: str, unidade: str = "campinas", user: Actor = Depends(current_actor), db: Session = Depends(session)):
    ctx = context(unidade, user, db)
    item, request = item_for_action(db, ctx, item_id)
    check_action(ctx, "solicitacao.separar", str(request["cc_id"]), write=True, phase="S1", db=db)
    if request["status"] not in {"APROVADA", "EM_ATENDIMENTO"} or item["status"] != "PENDENTE":
        raise HTTPException(409, "Item não pode ser separado")
    t = table("sup_solicitacao_item")
    db.execute(update(t).where(t.c.id == item["id"]).values(status="SEPARADO", atualizado_por=user.id, atualizado_em=datetime.now(UTC)))
    record_event(db, ctx, item["id"], "PENDENTE", "SEPARADO", f"Solicitação {request['numero']}", target_type="item")
    if request["status"] == "APROVADA":
        change(db, ctx, request, "EM_ATENDIMENTO", allowed=("APROVADA",))
    db.commit()
    return {"status": "SEPARADO"}


@router.post("/itens/{item_id}/entregar")
def deliver(item_id: str, data: dict, unidade: str = "campinas", user: Actor = Depends(current_actor), db: Session = Depends(session)):
    ctx = context(unidade, user, db)
    item, request = item_for_action(db, ctx, item_id)
    check_action(ctx, "solicitacao.entregar", str(request["cc_id"]), write=True, phase="S1", db=db)
    if request["status"] != "EM_ATENDIMENTO" or item["status"] != "SEPARADO":
        raise HTTPException(409, "Item não pode ser entregue")
    try:
        quantity = Decimal(str(data["qtd"]).replace(",", "."))
    except (KeyError, ValueError, InvalidOperation):
        raise HTTPException(422, "Quantidade inválida") from None
    delivered = item["qtd_entregue"] + quantity
    if quantity <= 0 or delivered > item["qtd"]:
        raise HTTPException(422, "Quantidade excede o pedido")
    new_status = "ENTREGUE" if delivered == item["qtd"] else "SEPARADO"
    t = table("sup_solicitacao_item")
    db.execute(update(t).where(t.c.id == item["id"]).values(qtd_entregue=delivered, status=new_status,
             atualizado_por=user.id, atualizado_em=datetime.now(UTC)))
    record_event(db, ctx, item["id"], item["status"], new_status, f"Solicitação {request['numero']}: {quantity}", target_type="item")
    remaining = db.execute(select(func.count()).select_from(t).where(and_(t.c.solicitacao_id == request["id"],
              t.c.status.not_in(("ENTREGUE", "CANCELADO"))))).scalar_one()
    if remaining == 0:
        change(db, ctx, request, "ENTREGUE", allowed=("EM_ATENDIMENTO",), entregue_em=datetime.now(UTC))
    db.commit()
    return {"status": new_status, "qtd_entregue": str(delivered), "solicitacao_status": request["status"]}


@router.post("/itens/{item_id}/preco")
def price_item(item_id: str, data: dict, unidade: str = "campinas", user: Actor = Depends(current_actor), db: Session = Depends(session)):
    ctx = context(unidade, user, db)
    item, request = item_for_action(db, ctx, item_id)
    check_action(ctx, "solicitacao.precificar", str(request["cc_id"]), write=True, phase="S1", db=db)
    if request["status"] not in {"RASCUNHO", "DEVOLVIDA"}:
        raise HTTPException(409, "Preço só pode ser alterado antes do envio")
    try:
        value = Decimal(str(data["preco"]).replace(",", "."))
        if value < 0:
            raise ValueError()
    except (KeyError, ValueError, InvalidOperation):
        raise HTTPException(422, "Preço inválido") from None
    t = table("sup_solicitacao_item")
    db.execute(update(t).where(t.c.id == item["id"]).values(preco_informado=value,
             atualizado_por=user.id, atualizado_em=datetime.now(UTC)))
    record_event(db, ctx, item["id"], "SEM_PRECO", "PRECIFICADO", f"Solicitação {request['numero']}", target_type="item")
    db.commit()
    return {"preco_informado": str(value)}


@router.post("/itens/{item_id}/cancelar")
def cancel_item(item_id: str, data: dict | None = None, unidade: str = "campinas",
                user: Actor = Depends(current_actor), db: Session = Depends(session)):
    ctx = context(unidade, user, db)
    item, request = item_for_action(db, ctx, item_id)
    check_action(ctx, "solicitacao.separar", str(request["cc_id"]), write=True, phase="S1", db=db)
    if request["status"] not in {"APROVADA", "EM_ATENDIMENTO"} or item["status"] != "PENDENTE":
        raise HTTPException(409, "Item não pode ser cancelado")
    t = table("sup_solicitacao_item")
    remaining_before = db.execute(select(func.count()).select_from(t).where(and_(t.c.solicitacao_id == request["id"],
              t.c.id != item["id"], t.c.status != "CANCELADO"))).scalar_one()
    if remaining_before == 0:
        raise HTTPException(409, "O último item deve ser atendido; o solicitante pode cancelar a solicitação antes do atendimento")
    db.execute(update(t).where(t.c.id == item["id"]).values(status="CANCELADO",
             atualizado_por=user.id, atualizado_em=datetime.now(UTC)))
    record_event(db, ctx, item["id"], "PENDENTE", "CANCELADO",
                 (data or {}).get("comentario") or f"Solicitação {request['numero']}", target_type="item")
    if request["status"] == "APROVADA":
        change(db, ctx, request, "EM_ATENDIMENTO", allowed=("APROVADA",))
    remaining = db.execute(select(func.count()).select_from(t).where(and_(t.c.solicitacao_id == request["id"],
              t.c.status.not_in(("ENTREGUE", "CANCELADO"))))).scalar_one()
    if remaining == 0:
        change(db, ctx, request, "ENTREGUE", allowed=("EM_ATENDIMENTO",), entregue_em=datetime.now(UTC))
    db.commit()
    return {"status": "CANCELADO", "solicitacao_status": request["status"]}


@router.post("/itens/{item_id}/vincular-material")
def link_material(item_id: str, data: dict, unidade: str = "campinas", user: Actor = Depends(current_actor), db: Session = Depends(session)):
    ctx = context(unidade, user, db)
    item, request = item_for_action(db, ctx, item_id)
    check_action(ctx, "solicitacao.vincular_material", str(request["cc_id"]), write=True, phase="S1", db=db)
    if not item["descricao_livre"] or request["status"] in {"ENTREGUE", "CONCLUIDA", "CANCELADA", "REPROVADA"}:
        raise HTTPException(409, "Item não vinculável")
    try:
        mid = UUID(data["material_id"])
    except (KeyError, ValueError):
        raise HTTPException(422, "Material inválido") from None
    m = table("sup_material")
    if db.execute(select(m.c.id).where(and_(m.c.id == mid, m.c.ativo.is_(True), m.c.dominio == "almoxarifado"))).scalar_one_or_none() is None:
        raise HTTPException(422, "Material indisponível")
    t = table("sup_solicitacao_item")
    db.execute(update(t).where(t.c.id == item["id"]).values(material_id=mid, descricao_livre=None,
             atualizado_por=user.id, atualizado_em=datetime.now(UTC)))
    record_event(db, ctx, item["id"], "LIVRE", "VINCULADO", f"{item['descricao_livre']} → {mid}", target_type="item")
    db.commit()
    return {"material_id": str(mid)}


@router.post("/solicitacoes/{request_id}/confirmar-recebimento")
def confirm_delivery(request_id: str, unidade: str = "campinas", user: Actor = Depends(current_actor), db: Session = Depends(session)):
    ctx = context(unidade, user, db)
    request = get_request(db, ctx, parsed_id(request_id), lock=True)
    require_owner(ctx, request)
    check_action(ctx, "solicitacao.confirmar", str(request["cc_id"]), write=True, phase="S1", db=db)
    change(db, ctx, request, "CONCLUIDA", allowed=("ENTREGUE",), confirmado_em=datetime.now(UTC))
    db.commit()
    return {"status": "CONCLUIDA"}


@router.post("/solicitacoes/{request_id}/recebi-com-problema")
def delivery_problem(request_id: str, data: dict, unidade: str = "campinas", user: Actor = Depends(current_actor), db: Session = Depends(session)):
    ctx = context(unidade, user, db)
    request = get_request(db, ctx, parsed_id(request_id), lock=True)
    require_owner(ctx, request)
    check_action(ctx, "solicitacao.confirmar", str(request["cc_id"]), write=True, phase="S1", db=db)
    comment = str(data.get("comentario") or "").strip()
    if not comment:
        raise HTTPException(422, "Descreva o problema")
    change(db, ctx, request, "EM_ATENDIMENTO", allowed=("ENTREGUE",), comment=comment, entregue_em=None)
    db.commit()
    return {"status": "EM_ATENDIMENTO"}


@router.post("/solicitacoes/{request_id}/reentregar")
def redeliver(request_id: str, data: dict, unidade: str = "campinas", user: Actor = Depends(current_actor), db: Session = Depends(session)):
    """Almoxarife registra a solução após relato de problema, preservando quantidades originais."""
    ctx = context(unidade, user, db)
    request = get_request(db, ctx, parsed_id(request_id), lock=True)
    check_action(ctx, "solicitacao.entregar", str(request["cc_id"]), write=True, phase="S1", db=db)
    comment = str(data.get("comentario") or "").strip()
    if not comment:
        raise HTTPException(422, "Descreva a solução do problema")
    event = table("sup_evento")
    problem = db.execute(select(event.c.id).where(and_(event.c.unidade_id == ctx.unit_id,
        event.c.alvo_tipo == "solicitacao", event.c.alvo_id == request["id"],
        event.c.de == "ENTREGUE", event.c.para == "EM_ATENDIMENTO")).limit(1)).scalar_one_or_none()
    if request["status"] != "EM_ATENDIMENTO" or not problem:
        raise HTTPException(409, "Não há problema de entrega aberto")
    change(db, ctx, request, "ENTREGUE", allowed=("EM_ATENDIMENTO",), comment=comment,
           entregue_em=datetime.now(UTC))
    db.commit()
    return {"status": "ENTREGUE"}


def upload_root() -> Path:
    raw = os.getenv("SUPRIMENTOS_UPLOAD_DIR", "")
    if not raw:
        raise HTTPException(503, "Armazenamento privado não configurado")
    root = Path(raw).resolve()
    public = os.getenv("SUPRIMENTOS_PUBLIC_DIR", "")
    if public and (root == Path(public).resolve() or Path(public).resolve() in root.parents):
        raise HTTPException(503, "Armazenamento dentro do webroot")
    return root


@router.post("/solicitacoes/{request_id}/fotos", status_code=201)
async def add_photo(request_id: str, arquivo: UploadFile = File(...), client_uuid: str | None = Form(None), unidade: str = "campinas",
                    user: Actor = Depends(current_actor), db: Session = Depends(session)):
    ctx = context(unidade, user, db)
    request = get_request(db, ctx, parsed_id(request_id), lock=True)
    require_owner(ctx, request)
    check_action(ctx, "solicitacao.criar", str(request["cc_id"]), write=True, phase="S1", db=db)
    try:
        client_id = UUID(client_uuid) if client_uuid else None
    except ValueError:
        raise HTTPException(422, "client_uuid da foto inválido") from None
    content = await arquivo.read(2_097_153)
    if len(content) > 2_097_152:
        raise HTTPException(413, "Foto excede 2 MB")
    if not (content.startswith(b"\xff\xd8\xff") or content.startswith(b"\x89PNG\r\n\x1a\n")):
        raise HTTPException(422, "Imagem JPEG ou PNG obrigatória")
    digest = hashlib.sha256(content).hexdigest()
    t = table("sup_solicitacao_foto")
    if client_id:
        existing = db.execute(select(t).where(and_(t.c.solicitacao_id == request["id"],
            t.c.unidade_id == ctx.unit_id, t.c.client_uuid == client_id))).mappings().one_or_none()
        if existing:
            if existing["sha256"] != digest:
                raise HTTPException(409, "Identificador de foto reutilizado com outro conteúdo")
            return {"id": str(existing["id"]), "sha256": digest, "tamanho": existing["tamanho"]}
    if request["status"] not in {"RASCUNHO", "DEVOLVIDA"}:
        raise HTTPException(409, "Fotos só podem ser incluídas antes do envio")
    count = db.execute(select(func.count()).select_from(t).where(and_(t.c.solicitacao_id == request["id"], t.c.unidade_id == ctx.unit_id))).scalar_one()
    if count >= 3:
        raise HTTPException(422, "Limite de 3 fotos")
    mime = "image/jpeg" if content.startswith(b"\xff") else "image/png"
    photo_id = uuid7()
    root = upload_root()
    folder = root / str(ctx.unit_id) / str(request["id"])
    folder.mkdir(parents=True, exist_ok=True, mode=0o700)
    path = folder / str(photo_id)
    with path.open("xb") as stream:
        stream.write(content)
    path.chmod(0o600)
    try:
        db.execute(insert(t).values(id=photo_id, solicitacao_id=request["id"], unidade_id=ctx.unit_id,
                   storage_path=str(path), sha256=digest, mime=mime, tamanho=len(content), client_uuid=client_id,
                   nome_original=Path(arquivo.filename or "foto").name[:120], criado_por=user.id, atualizado_por=user.id))
        db.commit()
    except Exception:
        db.rollback()
        path.unlink(missing_ok=True)
        raise
    return {"id": str(photo_id), "sha256": digest, "tamanho": len(content)}


@router.get("/solicitacoes/{request_id}/fotos/{photo_id}")
def get_photo(request_id: str, photo_id: str, unidade: str = "campinas", user: Actor = Depends(current_actor), db: Session = Depends(session)):
    ctx = context(unidade, user, db)
    request = get_request(db, ctx, parsed_id(request_id))
    require_view(ctx, request)
    t = table("sup_solicitacao_foto")
    row = db.execute(select(t).where(and_(t.c.id == parsed_id(photo_id), t.c.solicitacao_id == request["id"], t.c.unidade_id == ctx.unit_id))).mappings().one_or_none()
    if not row:
        raise HTTPException(404, "Foto não encontrada")
    path = Path(row["storage_path"]).resolve()
    if upload_root() not in path.parents or not path.is_file():
        raise HTTPException(404, "Foto indisponível")
    return FileResponse(path, media_type=row["mime"], filename=row["nome_original"], headers={"Cache-Control": "private, no-store"})


@router.get("/pwa/inicio")
def pwa_home(unidade: str = "campinas", user: Actor = Depends(current_actor), db: Session = Depends(session)):
    ctx = context(unidade, user, db)
    t = table("sup_solicitacao")
    own = db.execute(select(t).where(and_(t.c.unidade_id == ctx.unit_id, t.c.solicitante_id == user.id)).order_by(t.c.criado_em.desc()).limit(50)).mappings().all()
    pending = db.execute(select(t).where(and_(t.c.unidade_id == ctx.unit_id, t.c.status == "EM_APROVACAO"))).mappings().all()
    approvals = [dict(row) for row in pending if ctx.has("solicitacao.aprovar", str(row["cc_id"]), row["nivel_atual"])]
    return jsonable_encoder({"nome": user.name, "unidade": unidade, "minhas": [dict(x) for x in own],
                             "aprovar": approvals, "entregas_confirmar": sum(x["status"] == "ENTREGUE" for x in own)})


@router.get("/pwa/catalogo")
def pwa_catalog(q: str = "", unidade: str = "campinas", user: Actor = Depends(current_actor), db: Session = Depends(session)):
    ctx = context(unidade, user, db)
    check_action(ctx, "catalogo.ver")
    t = table("sup_material")
    m = table("sup_unidade_medida")
    stmt = select(t.c.id, t.c.codigo, t.c.descricao, m.c.id.label("un_id"),
                  m.c.sigla.label("unidade"), t.c.categoria).join(m, t.c.un_estoque == m.c.id).where(and_(t.c.ativo.is_(True), t.c.dominio == "almoxarifado"))
    if q:
        stmt = stmt.where(or_(t.c.codigo.ilike(f"%{q[:80]}%"), t.c.descricao.ilike(f"%{q[:80]}%")))
    return {"items": jsonable_encoder([dict(r) for r in db.execute(stmt.order_by(t.c.descricao).limit(100)).mappings()]),
            "atualizado_em": datetime.now(UTC).isoformat()}


@router.get("/pwa/mais-pedidos")
def pwa_frequent(cc_id: str, unidade: str = "campinas", user: Actor = Depends(current_actor), db: Session = Depends(session)):
    ctx = context(unidade, user, db)
    try:
        cc_uuid = UUID(cc_id)
    except ValueError:
        raise HTTPException(422, "Centro de custo inválido") from None
    if not any(ctx.has(action, cc_id) for action in
               ("solicitacao.criar", "solicitacao.ver_alcada", "solicitacao.ver_unidade")):
        raise HTTPException(403, "Sem acesso a este centro de custo")
    cc = table("sup_centro_custo")
    if db.execute(select(cc.c.id).where(and_(cc.c.id == cc_uuid, cc.c.unidade_id == ctx.unit_id))).scalar_one_or_none() is None:
        raise HTTPException(403, "Centro de custo de outra unidade")
    request = table("sup_solicitacao")
    item = table("sup_solicitacao_item")
    material = table("sup_material")
    rows = db.execute(select(material.c.id, material.c.codigo, material.c.descricao,
                             material.c.un_estoque.label("un_id"), func.count().label("pedidos"))
                      .join(item, item.c.material_id == material.c.id)
                      .join(request, request.c.id == item.c.solicitacao_id)
                      .where(and_(request.c.unidade_id == ctx.unit_id, request.c.cc_id == cc_uuid,
                                  request.c.status.not_in(("RASCUNHO", "CANCELADA", "REPROVADA")),
                                  material.c.ativo.is_(True), material.c.dominio == "almoxarifado"))
                      .group_by(material.c.id).order_by(func.count().desc()).limit(5)).mappings().all()
    return {"items": jsonable_encoder([dict(row) for row in rows])}


def close_delivered(db: Session, *, now: datetime | None = None) -> int:
    """Chamável pelo timer; bloqueio de linha mantém idempotência sob concorrência."""
    now = now or datetime.now(UTC)
    t = table("sup_solicitacao")
    p = table("sup_parametro")
    rows = db.execute(select(t).where(t.c.status == "ENTREGUE").with_for_update(skip_locked=True)).mappings().all()
    closed = 0
    for row in rows:
        hours = db.execute(select(p.c.valor).where(and_(p.c.unidade_id == row["unidade_id"], p.c.chave == "fechamento_auto_horas", p.c.ativo.is_(True)))).scalar_one_or_none()
        if hours is None or row["entregue_em"] is None or row["entregue_em"] + timedelta(hours=float(hours)) > now:
            continue
        ctx = context_for_auto(row)
        db.execute(update(t).where(and_(t.c.id == row["id"], t.c.status == "ENTREGUE")).values(status="CONCLUIDA", confirmado_em=now, atualizado_em=now, atualizado_por="auto"))
        record_event(db, ctx, row["id"], "ENTREGUE", "CONCLUIDA", "Fechamento automático", actor_id="auto", actor_name="Sistema")
        closed += 1
    db.commit()
    return closed


def context_for_auto(row):
    from ..auth import Context
    return Context(Actor("auto", "Sistema"), row["unidade_id"], "auto", ())
