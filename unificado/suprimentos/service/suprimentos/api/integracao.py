"""S4: contrato local com o Estoque da usina migrado ao Laboratório.

A flag S4 permanece desligada até o Laboratório estar pronto. Este módulo não lê
nem escreve tabelas legadas da usina e não altera o estoque físico do Laboratório.
"""
from __future__ import annotations

from datetime import date, datetime, timedelta, timezone
from decimal import Decimal, InvalidOperation

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.encoders import jsonable_encoder
from sqlalchemy import and_, func, insert, select, text, update
from sqlalchemy.orm import Session

from ..auth import Actor, Context, check_action, context, current_actor
from ..db import session, table
from ..ids import uuid7
from ..integration_auth import Laboratory, laboratory
from ..workflow import change, get_request, record_event
from .compras import money, order, order_items, weights

router = APIRouter(prefix="/api/suprimentos/integracao", tags=["Laboratório S4"])
UTC = timezone.utc


def number(raw, label="Quantidade") -> Decimal:
    try:
        value=Decimal(str(raw).replace(",","."))
        if not value.is_finite() or value<=0 or value.as_tuple().exponent < -4:
            raise InvalidOperation()
        return value
    except (TypeError,InvalidOperation):
        raise HTTPException(422,f"{label} inválida") from None


def ident(raw, label="Registro"):
    from uuid import UUID
    try:
        return UUID(str(raw))
    except (ValueError,TypeError):
        raise HTTPException(422,f"{label} inválido") from None


def service_context(db: Session, lab: Laboratory, unidade: str) -> Context:
    if lab.unit != unidade:
        raise HTTPException(403,"Assertion emitida para outra unidade")
    u=table("sup_unidade")
    row=db.execute(select(u).where(and_(u.c.codigo==unidade,u.c.ativo.is_(True)))).mappings().one_or_none()
    if not row:
        raise HTTPException(403,"Unidade indisponível")
    f=table("sup_flag")
    enabled=db.execute(select(f.c.habilitado).where(and_(f.c.unidade_id==row["id"],
        f.c.fase=="S4"))).scalar_one_or_none()
    if not enabled:
        raise HTTPException(403,"Integração S4 desligada para a unidade")
    return Context(Actor("service:laboratorio","Laboratório"),row["id"],unidade,())


def user_context(db: Session, user: Actor, unidade: str) -> Context:
    ctx=context(unidade,user,db)
    for role in ctx.roles:
        cc = str(role["cc_id"]) if role["cc_id"] else None
        if ctx.has("compras.cotar", cc):
            check_action(ctx,"compras.cotar",cc,write=True,phase="S4",db=db)
            return ctx
    raise HTTPException(403,"Consulta de ressuprimento requer Compras")


@router.post("/sugestoes", status_code=201)
def receive_suggestion(data: dict, unidade: str="campinas",
                       lab: Laboratory=Depends(laboratory), db: Session=Depends(session)):
    ctx=service_context(db,lab,unidade)
    if data.get("origem")!="estoque_usina":
        raise HTTPException(422,"Origem deve ser estoque_usina")
    key=str(data.get("chave_idempotencia") or "").strip()
    silo=str(data.get("silo_destino") or "").strip()
    if not key or len(key)>120 or not silo or len(silo)>120:
        raise HTTPException(422,"Chave de origem e silo de destino obrigatórios")
    material_id=ident(data.get("material_id"),"Material")
    qty=number(data.get("quantidade"))
    try:
        deadline=date.fromisoformat(data["data_limite"])
    except (KeyError,TypeError,ValueError):
        raise HTTPException(422,"Data limite em AAAA-MM-DD obrigatória") from None
    m,mu=table("sup_material"),table("sup_material_unidade")
    item=db.execute(select(m.c.id).join(mu,mu.c.material_id==m.c.id).where(and_(
        m.c.id==material_id,mu.c.unidade_id==ctx.unit_id,m.c.dominio=="insumo_usina",
        m.c.ativo.is_(True),mu.c.ativo.is_(True)))).scalar_one_or_none()
    if item is None:
        raise HTTPException(422,"Material não é insumo da usina ativo nesta unidade")
    db.execute(text('SELECT pg_advisory_xact_lock(hashtextextended(:key,79451314))'),
        {"key":f"{ctx.unit_id}:{key}"})
    t=table("sup_sugestao_ressuprimento")
    existing=db.execute(select(t).where(and_(t.c.unidade_id==ctx.unit_id,
        t.c.origem=="estoque_usina",t.c.chave_origem==key))).mappings().one_or_none()
    if existing:
        if (existing["material_id"]!=material_id or existing["qtd"]!=qty or
            existing["data_limite"]!=deadline or existing["destino_ref"]!=silo):
            raise HTTPException(409,"Chave de origem reutilizada com outro conteúdo")
        return jsonable_encoder({"id":existing["id"],"status":existing["status"],
            "repetida":True})
    sid=uuid7()
    db.execute(insert(t).values(id=sid,unidade_id=ctx.unit_id,origem="estoque_usina",
        material_id=material_id,qtd=qty,data_limite=deadline,destino_ref=silo,
        chave_origem=key,status="SUGERIDA",criado_por=ctx.actor.id,
        atualizado_por=ctx.actor.id))
    record_event(db,ctx,sid,None,"SUGERIDA",
        f"Silo {silo}; quantidade {qty}; até {deadline}",target_type="sugestao_usina")
    db.commit()
    return {"id":str(sid),"status":"SUGERIDA","repetida":False}


@router.get("/sugestoes")
def list_suggestions(unidade: str="campinas",status: str="SUGERIDA",
                     page: int=Query(1,ge=1),size: int=Query(40,ge=1,le=100),
                     user: Actor=Depends(current_actor),db: Session=Depends(session)):
    ctx=user_context(db,user,unidade)
    t=table("sup_sugestao_ressuprimento")
    where=[t.c.unidade_id==ctx.unit_id,t.c.origem=="estoque_usina"]
    if status:
        where.append(t.c.status==status)
    rows=db.execute(select(t).where(and_(*where)).order_by(t.c.criado_em.desc())
        .limit(size).offset((page-1)*size)).mappings().all()
    total=db.execute(select(func.count()).select_from(t).where(and_(*where))).scalar_one()
    material=table("sup_material")
    enriched=[]
    for row in rows:
        description=db.execute(select(material.c.descricao).where(
            material.c.id==row["material_id"])).scalar_one_or_none()
        enriched.append({**row,"material_descricao":description})
    return jsonable_encoder({"total":total,"page":page,"size":size,
        "items":enriched})


def lab_iqf(db,ctx,purchase,qty,document_ref,inspection,user_id):
    """Avaliação provisória: qualidade/documentos só pontuam quando vierem do Lab."""
    profile=table("sup_fornecedor_unidade")
    supplier=db.execute(select(profile).where(profile.c.id==purchase["fornecedor_unidade_id"])
        .with_for_update()).mappings().one()
    if purchase["entrega_prevista"]:
        late=(date.today()-purchase["entrega_prevista"]).days
        prazo=5 if late<=0 else 4 if late<=3 else 3 if late<=7 else 2 if late<=15 else 1
    else:prazo=3
    scores={"prazo":prazo,"quantidade":5,
        "qualidade":1 if inspection=="REPROVADO" else 3 if inspection in (None,"CONDICIONAL") else 5,
        "documentacao":5 if document_ref else 3,"atendimento":3}
    weighted=money(sum(Decimal(scores[key])*weight for key,weight in weights(db,ctx).items())/5)
    eval_id=uuid7();t=table("sup_fornecedor_avaliacao")
    db.execute(insert(t).values(id=eval_id,unidade_id=ctx.unit_id,
        fornecedor_unidade_id=supplier["id"],pedido_id=purchase["id"],
        **{f"nota_{key}":value for key,value in scores.items()},iqf=weighted,
        comentario="Automático da integração Laboratório; atendimento provisório 3/5",
        criado_por=user_id,atualizado_por=user_id))
    average=db.execute(select(func.avg(t.c.iqf)).where(and_(t.c.unidade_id==ctx.unit_id,
        t.c.fornecedor_unidade_id==supplier["id"],t.c.estornada_em.is_(None),
        t.c.avaliado_em>=datetime.now(UTC)-timedelta(days=365)))).scalar_one()
    db.execute(update(profile).where(profile.c.id==supplier["id"]).values(iqf=money(average),
        atualizado_por=user_id,atualizado_em=datetime.now(UTC)))
    return eval_id


@router.post("/pedidos/{order_id}/recebido")
def laboratory_received(order_id: str,data: dict,unidade: str="campinas",
                        lab: Laboratory=Depends(laboratory),db: Session=Depends(session)):
    ctx=service_context(db,lab,unidade)
    key=str(data.get("chave_idempotencia") or "").strip()
    if not key or len(key)>120:
        raise HTTPException(422,"Chave de idempotência obrigatória")
    item_id=ident(data.get("pedido_item_id"),"Item do pedido")
    qty=number(data.get("quantidade"))
    nf=str(data.get("numero_nf") or "").strip()
    document_ref=str(data.get("documento_ref") or "").strip() or None
    inspection=data.get("inspecao_status")
    if inspection not in (None,"LIBERADO","CONDICIONAL","REPROVADO"):
        raise HTTPException(422,"Inspeção inválida")
    if inspection=="REPROVADO":
        raise HTTPException(409,"Entrada reprovada não baixa o pedido")
    if nf and len(nf)>40 or document_ref and len(document_ref)>120:
        raise HTTPException(422,"Referência fiscal longa demais")
    db.execute(text('SELECT pg_advisory_xact_lock(hashtextextended(:key,79451314))'),
        {"key":f"{ctx.unit_id}:{key}"})
    t=table("sup_integracao_recebimento")
    existing=db.execute(select(t).where(and_(t.c.unidade_id==ctx.unit_id,
        t.c.chave_idempotencia==key))).mappings().one_or_none()
    if existing:
        if (existing["pedido_id"]!=ident(order_id,"Pedido") or
            existing["pedido_item_id"]!=item_id or existing["quantidade"]!=qty or
            (existing["numero_nf"] or "")!=nf or existing["documento_ref"]!=document_ref or
            existing["inspecao_status"]!=inspection):
            raise HTTPException(409,"Chave de recebimento reutilizada com outro conteúdo")
        return jsonable_encoder({"id":existing["id"],"status":"RECEBIDO",
            "avaliacao_id":existing["avaliacao_id"],"repetida":True})
    purchase=order(db,ctx,order_id,lock=True)
    if purchase["status"] not in {"ENVIADO","PARCIAL"}:
        raise HTTPException(409,"Pedido não aguarda entrada do Laboratório")
    po=table("sup_pedido_item")
    line=db.execute(select(po).where(and_(po.c.id==item_id,po.c.pedido_id==purchase["id"],
        po.c.unidade_id==ctx.unit_id)).with_for_update()).mappings().one_or_none()
    if not line:
        raise HTTPException(404,"Item não pertence ao pedido")
    request_item=table("sup_solicitacao_item")
    source=db.execute(select(request_item).where(and_(request_item.c.id==line["solicitacao_item_id"],
        request_item.c.unidade_id==ctx.unit_id)).with_for_update()).mappings().one()
    material=table("sup_material")
    domain=db.execute(select(material.c.dominio).where(material.c.id==source["material_id"])).scalar_one_or_none()
    if domain!="insumo_usina":
        raise HTTPException(409,"Item não é insumo da usina")
    if line["qtd_recebida"]+qty>line["qtd"] or source["qtd_entregue"]+qty>source["qtd"]:
        raise HTTPException(409,"Quantidade acima do saldo do pedido ou solicitação")
    callback_id=uuid7()
    evaluation_id=lab_iqf(db,ctx,purchase,qty,document_ref,inspection,ctx.actor.id)
    db.execute(insert(t).values(id=callback_id,unidade_id=ctx.unit_id,pedido_id=purchase["id"],
        pedido_item_id=item_id,quantidade=qty,numero_nf=nf or None,
        documento_ref=document_ref,inspecao_status=inspection,chave_idempotencia=key,
        avaliacao_id=evaluation_id,criado_por=ctx.actor.id,atualizado_por=ctx.actor.id))
    db.execute(update(po).where(po.c.id==line["id"]).values(qtd_recebida=line["qtd_recebida"]+qty,
        atualizado_por=ctx.actor.id,atualizado_em=datetime.now(UTC)))
    delivered=source["qtd_entregue"]+qty
    db.execute(update(request_item).where(request_item.c.id==source["id"]).values(
        qtd_entregue=delivered,status="ENTREGUE" if delivered==source["qtd"] else "SEPARADO",
        atualizado_por=ctx.actor.id,atualizado_em=datetime.now(UTC)))
    request=get_request(db,ctx,source["solicitacao_id"],lock=True)
    if request["status"]=="APROVADA":
        change(db,ctx,request,"EM_ATENDIMENTO",allowed=("APROVADA",))
    remaining_request=db.execute(select(func.count()).select_from(request_item).where(and_(
        request_item.c.solicitacao_id==request["id"],request_item.c.unidade_id==ctx.unit_id,
        request_item.c.status.not_in(("ENTREGUE","CANCELADO"))))).scalar_one()
    if remaining_request==0:
        current=get_request(db,ctx,request["id"],lock=True)
        change(db,ctx,current,"ENTREGUE",allowed=("EM_ATENDIMENTO",),
            entregue_em=datetime.now(UTC))
    remaining_order=db.execute(select(func.count()).select_from(po).where(and_(
        po.c.pedido_id==purchase["id"],po.c.unidade_id==ctx.unit_id,
        po.c.qtd_recebida<po.c.qtd))).scalar_one()
    new_status="PARCIAL" if remaining_order else "RECEBIDO"
    db.execute(update(table("sup_pedido")).where(table("sup_pedido").c.id==purchase["id"])
        .values(status=new_status,nf_numero=nf or purchase["nf_numero"],
                atualizado_por=ctx.actor.id,atualizado_em=datetime.now(UTC)))
    record_event(db,ctx,purchase["id"],purchase["status"],new_status,
        f"Entrada do Laboratório {callback_id}; item {item_id}; quantidade {qty}",target_type="pedido")
    db.commit()
    return {"id":str(callback_id),"status":"RECEBIDO","pedido_status":new_status,
            "avaliacao_id":str(evaluation_id),"repetida":False}
