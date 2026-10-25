"""Transições S1 em transações do banco dedicado."""
from __future__ import annotations
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from fastapi import HTTPException
from sqlalchemy import and_, insert, or_, select, text, update
from sqlalchemy.orm import Session
from .auth import Context, check_action
from .db import table
from .ids import uuid7

UTC = timezone.utc

def record_event(db: Session, ctx: Context, request_id, old: str | None, new: str,
                 comment: str | None = None, *, actor_id: str | None = None, actor_name: str | None = None,
                 target_type: str = "solicitacao"):
    db.execute(insert(table("sup_evento")).values(
        id=uuid7(), unidade_id=ctx.unit_id, alvo_tipo=target_type, alvo_id=request_id,
        de=old, para=new, por=actor_id or ctx.actor.id, por_nome=actor_name or ctx.actor.name,
        comentario=comment, criado_por=actor_id or ctx.actor.id,
        atualizado_por=actor_id or ctx.actor.id))

def get_request(db: Session, ctx: Context, request_id, *, lock=False) -> dict:
    t = table("sup_solicitacao")
    stmt = select(t).where(and_(t.c.id == request_id, t.c.unidade_id == ctx.unit_id))
    if lock:
        stmt = stmt.with_for_update()
    row = db.execute(stmt).mappings().one_or_none()
    if row is None:
        if db.execute(select(t.c.id).where(t.c.id == request_id)).scalar_one_or_none() is not None:
            raise HTTPException(403, "Solicitação de outra unidade")
        raise HTTPException(404, "Solicitação não encontrada")
    return dict(row)

def can_view(ctx: Context, request: dict) -> bool:
    cc = str(request["cc_id"])
    return ((request["solicitante_id"] == ctx.actor.id and ctx.has("solicitacao.ver_propria", cc))
            or ctx.has("solicitacao.ver_unidade", cc)
            or (request["status"] == "EM_APROVACAO" and ctx.has("solicitacao.ver_alcada", cc, request.get("nivel_atual"))))

def require_view(ctx: Context, request: dict):
    if not can_view(ctx, request):
        raise HTTPException(403, "Solicitação fora da sua alçada")

def change(db: Session, ctx: Context, request: dict, new: str, *, allowed: tuple[str, ...],
           comment: str | None = None, **extra):
    if request["status"] not in allowed:
        raise HTTPException(409, f"Transição {request['status']} → {new} inválida")
    old = request["status"]
    t = table("sup_solicitacao")
    values = {"status": new, "atualizado_por": ctx.actor.id,
              "atualizado_em": datetime.now(UTC), **extra}
    db.execute(update(t).where(and_(t.c.id == request["id"], t.c.unidade_id == ctx.unit_id)).values(**values))
    record_event(db, ctx, request["id"], old, new, comment)
    request.update(values)

def estimate(db: Session, ctx: Context, request_id):
    t = table("sup_solicitacao_item")
    items = db.execute(select(t).where(and_(t.c.solicitacao_id == request_id,
                                             t.c.unidade_id == ctx.unit_id,
                                             t.c.status != "CANCELADO"))).mappings().all()
    if not items:
        raise HTTPException(422, "Inclua pelo menos um item")
    total = sum((Decimal(str(row["qtd"])) * Decimal(str(row["preco_informado"] or 0)) for row in items), Decimal("0"))
    missing = any(row["preco_informado"] is None for row in items)
    return total.quantize(Decimal("0.01")), missing, items

def approval_levels(db: Session, ctx: Context, request: dict, items, total):
    t = table("sup_alcada")
    material = table("sup_material")
    categories = set()
    for item in items:
        if item["material_id"]:
            categories.add(db.execute(select(material.c.categoria).where(material.c.id == item["material_id"])).scalar_one())
    rules = db.execute(select(t).where(and_(t.c.unidade_id == ctx.unit_id, t.c.ativo.is_(True),
                or_(t.c.cc_id.is_(None), t.c.cc_id == request["cc_id"])))).mappings().all()
    # Specific CC/category rules override generic rules of the same level.
    applicable = [dict(r) for r in rules if r["categoria"] is None or r["categoria"] in categories]
    by_level = {}
    for rule in sorted(applicable, key=lambda r: (r["cc_id"] is not None, r["categoria"] is not None)):
        by_level[rule["nivel"]] = rule
    if not by_level or 1 not in by_level:
        raise HTTPException(409, "Alçada não configurada para esta unidade/CC")
    required = [1]
    for level in sorted(by_level):
        if level == 1:
            continue
        previous = by_level.get(level - 1)
        if previous and previous["valor_ate"] is not None and total > previous["valor_ate"]:
            required.append(level)
    return required

def sla(db: Session, ctx: Context, urgency: str):
    key = "sla_aprovacao_urgente_horas" if urgency != "NORMAL" else "sla_aprovacao_normal_horas"
    t = table("sup_parametro")
    hours = db.execute(select(t.c.valor).where(and_(t.c.unidade_id == ctx.unit_id,
                                                       t.c.chave == key, t.c.ativo.is_(True)))).scalar_one_or_none()
    if hours is None:
        raise HTTPException(409, "SLA não configurado")
    return datetime.now(UTC) + timedelta(hours=float(hours))

def allocate_number(db: Session, ctx: Context):
    seq = db.execute(text("""INSERT INTO suprimentos.sup_numero_solicitacao(unidade_id,proximo)
        VALUES (:unit,2) ON CONFLICT (unidade_id) DO UPDATE SET proximo=suprimentos.sup_numero_solicitacao.proximo+1
        RETURNING proximo-1"""), {"unit": ctx.unit_id}).scalar_one()
    return f"SOL-{seq:05d}"

def require_owner(ctx: Context, request: dict):
    if request["solicitante_id"] != ctx.actor.id and not ctx.has("solicitacao.ver_unidade", str(request["cc_id"])):
        raise HTTPException(403, "Somente o solicitante pode fazer esta ação")

def approve_one(db: Session, ctx: Context, request_id, decision: str, comment: str | None = None):
    request = get_request(db, ctx, request_id, lock=True)
    level = request["nivel_atual"]
    action = {"APROVADA": "solicitacao.aprovar", "DEVOLVIDA": "solicitacao.devolver",
              "REPROVADA": "solicitacao.reprovar"}[decision]
    check_action(ctx, action, str(request["cc_id"]), level, write=True, phase="S1", db=db)
    if request["status"] != "EM_APROVACAO":
        raise HTTPException(409, "Solicitação não está em aprovação")
    if decision != "APROVADA" and not (comment or "").strip():
        raise HTTPException(422, "Comentário obrigatório")
    db.execute(insert(table("sup_aprovacao")).values(
        id=uuid7(), solicitacao_id=request_id, unidade_id=ctx.unit_id, nivel=level,
        aprovador_id=ctx.actor.id, aprovador_nome=ctx.actor.name, decisao=decision,
        comentario=comment, criado_por=ctx.actor.id, atualizado_por=ctx.actor.id))
    if decision == "APROVADA" and level < request["niveis_total"]:
        t = table("sup_solicitacao")
        db.execute(update(t).where(t.c.id == request_id).values(nivel_atual=level + 1,
                     atualizado_por=ctx.actor.id, atualizado_em=datetime.now(UTC)))
        record_event(db, ctx, request_id, f"EM_APROVACAO:{level}", f"EM_APROVACAO:{level + 1}", comment)
        return {"id": str(request_id), "status": "EM_APROVACAO", "nivel_atual": level + 1}
    if decision == "APROVADA":
        change(db, ctx, request, "APROVADA", allowed=("EM_APROVACAO",), comment=comment, nivel_atual=None)
    else:
        change(db, ctx, request, decision, allowed=("EM_APROVACAO",), comment=comment, nivel_atual=None)
    return {"id": str(request_id), "status": decision, "nivel_atual": None}
