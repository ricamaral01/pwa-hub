"""Daily reinforcement closure with BOM, FIFO and explained shortages."""
from __future__ import annotations

from collections import defaultdict
from datetime import date
from decimal import Decimal, ROUND_CEILING

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.orm import Session

from .auth import Context, context, need
from .banca import _bank
from .corte import audit, one
from .db import session

router=APIRouter(tags=["armacao-fechamento"])


class ManualIn(BaseModel):
    modelo_poste_id: int
    lote_codigo: str
    barras: int = Field(gt=0)


class AjusteIn(BaseModel):
    modelo_poste_id: int
    produto_codigo: int
    motivo: str = Field(min_length=3)


class ModeloIn(BaseModel):
    modelo_poste_id: int
    qtd_armaduras: int = Field(gt=0)


class CloseIn(BaseModel):
    data: date
    modelos: list[ModeloIn] = Field(min_length=1)
    consumos_manuais: list[ManualIn] = []
    ajustes: list[AjusteIn] = []
    requisicao_id: str | None = Field(default=None, min_length=8, max_length=80)


def _bom(db: Session, uid: int, model: int, day: date) -> dict[int,Decimal]:
    result: dict[int,Decimal]=defaultdict(Decimal)
    for row in db.execute(text("""SELECT produto_codigo,barras_por_armadura
      FROM armacao.armadura_modelo_bom WHERE unidade_id=:uid AND modelo_poste_id=:model
        AND vigente_desde<=:day AND (vigente_ate IS NULL OR vigente_ate>=:day)
      ORDER BY posicao,id"""),{"uid":uid,"model":model,"day":day}).mappings():
        result[row["produto_codigo"]]+=row["barras_por_armadura"]
    return result


def _feixes(db: Session, uid: int, bank: int):
    return [dict(row) for row in db.execute(text("""SELECT l.id,l.codigo,l.produto_codigo,
      l.saldo_barras,l.qtd_barras,l.status,e.lido_em,e.id AS entrada_id
      FROM armacao.armacao_entrada_feixe e JOIN armacao.aco_lote_corte l
      ON l.id=e.lote_corte_id AND l.unidade_id=e.unidade_id
      WHERE e.unidade_id=:uid AND e.banca_id=:bank AND e.ativa
        AND l.status NOT IN ('CANCELADO','CONSUMIDO')
      ORDER BY e.lido_em,e.id FOR UPDATE OF l,e"""),{"uid":uid,"bank":bank}).mappings()]


def _plan(db: Session, uid: int, bank: int, body: CloseIn):
    if len({m.modelo_poste_id for m in body.modelos})!=len(body.modelos):
        raise HTTPException(422,"Modelo repetido no fechamento")
    models={row["id"] for row in db.execute(text("""SELECT id FROM armacao.modelo_poste_ref
      WHERE unidade_id=:uid AND id=ANY(:ids) AND ativo"""),
      {"uid":uid,"ids":[m.modelo_poste_id for m in body.modelos]}).mappings()}
    if len(models)!=len(body.modelos): raise HTTPException(422,"Modelo inexistente nesta unidade")
    feixes=_feixes(db,uid,bank)
    by_code={item["codigo"]:item for item in feixes}
    plans=[]
    for model in body.modelos:
        bom=_bom(db,uid,model.modelo_poste_id,body.data)
        manual=[m for m in body.consumos_manuais if m.modelo_poste_id==model.modelo_poste_id]
        adjusted={a.produto_codigo:a.motivo for a in body.ajustes if a.modelo_poste_id==model.modelo_poste_id}
        if bom and manual: raise HTTPException(422,"Modelo com BOM não recebe consumo manual")
        if not bom and not manual: raise HTTPException(422,"Modelo sem BOM: informe feixe e barras")
        consumptions=[];shortages=[]
        if bom:
            for product,per_armadura in bom.items():
                theoretical=per_armadura*model.qtd_armaduras
                needed=int(theoretical.to_integral_value(rounding=ROUND_CEILING))
                remaining=needed
                for bundle in feixes:
                    if bundle["produto_codigo"]!=product or bundle["saldo_barras"]<=0: continue
                    take=min(remaining,bundle["saldo_barras"])
                    if take:
                        bundle["saldo_barras"]-=take;remaining-=take
                        consumptions.append((bundle["id"],product,theoretical,take,"BOM",None))
                    if not remaining: break
                if remaining:
                    if product not in adjusted:
                        raise HTTPException(409,{"produto_codigo":product,"faltam_barras":remaining,
                                                 "mensagem":"Leia outro feixe ou registre ajuste com motivo"})
                    shortages.append((product,remaining,adjusted[product]))
        else:
            for allocation in manual:
                bundle=by_code.get(allocation.lote_codigo)
                if not bundle: raise HTTPException(422,"Feixe manual não está ativo nesta banca")
                if bundle["saldo_barras"]<allocation.barras:
                    raise HTTPException(409,"Saldo insuficiente no feixe manual")
                bundle["saldo_barras"]-=allocation.barras
                consumptions.append((bundle["id"],bundle["produto_codigo"],
                                     Decimal(allocation.barras),allocation.barras,"MANUAL",None))
        plans.append((model,consumptions,shortages))
    return plans,feixes


@router.get("/bancas/{banca_id}/fechamento")
def preview(banca_id: int, data: date, ctx: Context=Depends(context), db: Session=Depends(session)):
    need(ctx,"armacao.banca")
    _bank(db,banca_id,ctx.unit_id)
    bundles=_feixes(db,ctx.unit_id,banca_id)
    stock: dict[int,int]=defaultdict(int)
    for bundle in bundles: stock[bundle["produto_codigo"]]+=bundle["saldo_barras"]
    models=[dict(row) for row in db.execute(text("""SELECT id,codigo,descricao FROM armacao.modelo_poste_ref
      WHERE unidade_id=:uid AND ativo ORDER BY descricao"""),{"uid":ctx.unit_id}).mappings()]
    for model in models:
        model["bom"]={str(code):str(qty) for code,qty in _bom(db,ctx.unit_id,model["id"],data).items()}
    return {"data":data,"modelos":models,"saldo_por_produto":stock,
            "feixes":[{"codigo":b["codigo"],"produto_codigo":b["produto_codigo"],
                       "saldo_barras":b["saldo_barras"]} for b in bundles]}


@router.post("/bancas/{banca_id}/fechamento",status_code=201)
def close_day(banca_id: int, body: CloseIn,
              ctx: Context=Depends(context), db: Session=Depends(session)):
    need(ctx,"armacao.banca",write=True)
    _bank(db,banca_id,ctx.unit_id)
    db.execute(text("SELECT id FROM armacao.armacao_banca WHERE id=:id FOR UPDATE"),{"id":banca_id})
    if body.requisicao_id:
        prior=[dict(row) for row in db.execute(text("""SELECT a.id AS apontamento_id,
          l.id AS armadura_lote_id,l.codigo,a.modelo_poste_id,a.qtd_armaduras AS qtd
          FROM armacao.armacao_apontamento a JOIN armacao.armadura_lote l ON l.apontamento_id=a.id
          WHERE a.unidade_id=:uid AND a.requisicao_id=:request ORDER BY a.id"""),
          {"uid":ctx.unit_id,"request":body.requisicao_id}).mappings()]
        if prior:
            if {p["modelo_poste_id"] for p in prior}!={m.modelo_poste_id for m in body.modelos}:
                raise HTTPException(409,"Requisição já usada em outro fechamento")
            return {"lotes":prior,"repetida":True}
    existing=db.execute(text("""SELECT modelo_poste_id FROM armacao.armacao_apontamento
      WHERE unidade_id=:uid AND banca_id=:bank AND data=:day AND armador_id=:actor
        AND modelo_poste_id=ANY(:models)"""),
      {"uid":ctx.unit_id,"bank":banca_id,"day":body.data,"actor":ctx.actor.id,
       "models":[m.modelo_poste_id for m in body.modelos]}).first()
    if existing: raise HTTPException(409,"Modelo já fechado por este armador neste dia")
    plans,bundles=_plan(db,ctx.unit_id,banca_id,body)
    result=[]
    for model,consumptions,shortages in plans:
        apont= db.execute(text("""INSERT INTO armacao.armacao_apontamento
          (unidade_id,data,banca_id,armador_id,modelo_poste_id,qtd_armaduras,status,fechado_em,requisicao_id)
          VALUES (:uid,:day,:bank,:actor,:model,:qty,'FECHADO',now(),:request) RETURNING id"""),
          {"uid":ctx.unit_id,"day":body.data,"bank":banca_id,"actor":ctx.actor.id,
           "model":model.modelo_poste_id,"qty":model.qtd_armaduras,"request":body.requisicao_id}).scalar_one()
        for bundle_id,product,theoretical,take,origin,reason in consumptions:
            db.execute(text("""INSERT INTO armacao.armacao_consumo
              (unidade_id,apontamento_id,lote_corte_id,produto_codigo,barras_teoricas,
               barras_baixadas,origem,ajuste_motivo)
              VALUES (:uid,:apont,:bundle,:product,:theoretical,:take,:origin,:reason)"""),
              {"uid":ctx.unit_id,"apont":apont,"bundle":bundle_id,"product":product,
               "theoretical":theoretical,"take":take,"origin":origin,"reason":reason})
        for product,missing,reason in shortages:
            db.execute(text("""INSERT INTO armacao.armacao_ajuste
              (unidade_id,apontamento_id,produto_codigo,barras_faltantes,motivo,registrado_por)
              VALUES (:uid,:apont,:product,:missing,:reason,:actor)"""),
              {"uid":ctx.unit_id,"apont":apont,"product":product,"missing":missing,
               "reason":reason,"actor":ctx.actor.id})
        seq=db.execute(text("""INSERT INTO armacao.sequencia_dia(unidade_id,data,tipo,proximo)
          VALUES (:uid,:day,'AR',2) ON CONFLICT(unidade_id,data,tipo)
          DO UPDATE SET proximo=armacao.sequencia_dia.proximo+1 RETURNING proximo-1"""),
          {"uid":ctx.unit_id,"day":body.data}).scalar_one()
        code=f"AR-{ctx.prefix}-{body.data:%y%m%d}-B{banca_id:02d}-{seq:04d}"
        lot=db.execute(text("""INSERT INTO armacao.armadura_lote
          (unidade_id,codigo,apontamento_id,modelo_poste_id,qtd,saldo)
          VALUES (:uid,:code,:apont,:model,:qty,:qty) RETURNING id"""),
          {"uid":ctx.unit_id,"code":code,"apont":apont,"model":model.modelo_poste_id,
           "qty":model.qtd_armaduras}).scalar_one()
        audit(db,ctx.unit_id,"armacao_apontamento",apont,"FECHAR",ctx.actor.id,
              after={"armadura_lote":code,"qtd":model.qtd_armaduras,
                     "ajustes":[{"produto_codigo":p,"faltam":n,"motivo":r} for p,n,r in shortages]})
        result.append({"apontamento_id":apont,"armadura_lote_id":lot,"codigo":code,
                       "modelo_poste_id":model.modelo_poste_id,"qtd":model.qtd_armaduras})
    for bundle in bundles:
        status="CONSUMIDO" if bundle["saldo_barras"]==0 else (
          "PARCIAL" if bundle["saldo_barras"]<bundle["qtd_barras"] else bundle["status"])
        db.execute(text("""UPDATE armacao.aco_lote_corte SET saldo_barras=:saldo,status=:status
          WHERE id=:id"""),{"saldo":bundle["saldo_barras"],"status":status,"id":bundle["id"]})
        if status=="CONSUMIDO":
            db.execute(text("""UPDATE armacao.armacao_entrada_feixe SET ativa=false
              WHERE lote_corte_id=:id AND ativa"""),{"id":bundle["id"]})
    db.commit()
    return {"lotes":result}


class CorrectIn(BaseModel):
    motivo: str = Field(min_length=3)
    qtd_armaduras: int = Field(gt=0)
    consumos_manuais: list[ManualIn] = []
    ajustes: list[AjusteIn] = []


@router.post("/apontamentos/{apontamento_id}/corrigir")
def correct(apontamento_id: int, body: CorrectIn,
            ctx: Context=Depends(context), db: Session=Depends(session)):
    need(ctx,"armacao.supervisor",write=True)
    apont=one(db,"""SELECT * FROM armacao.armacao_apontamento
      WHERE id=:id AND unidade_id=:uid FOR UPDATE""",id=apontamento_id,uid=ctx.unit_id)
    if not apont: raise HTTPException(404,"Apontamento não encontrado")
    lot=one(db,"SELECT * FROM armacao.armadura_lote WHERE apontamento_id=:id FOR UPDATE",id=apontamento_id)
    if not lot or lot["saldo"]!=lot["qtd"]:
        raise HTTPException(409,"Lote de armaduras já consumido; correção bloqueada")
    prior=[dict(row) for row in db.execute(text("""SELECT * FROM armacao.armacao_consumo
      WHERE apontamento_id=:id FOR UPDATE"""),{"id":apontamento_id}).mappings()]
    for item in prior:
        db.execute(text("""UPDATE armacao.aco_lote_corte SET
          saldo_barras=saldo_barras+:qty,status='NA_BANCA' WHERE id=:id"""),
          {"qty":item["barras_baixadas"],"id":item["lote_corte_id"]})
        db.execute(text("""UPDATE armacao.armacao_entrada_feixe SET ativa=true
          WHERE id=(SELECT max(id) FROM armacao.armacao_entrada_feixe
                    WHERE lote_corte_id=:id)"""),{"id":item["lote_corte_id"]})
    db.execute(text("DELETE FROM armacao.armacao_consumo WHERE apontamento_id=:id"),{"id":apontamento_id})
    db.execute(text("DELETE FROM armacao.armacao_ajuste WHERE apontamento_id=:id"),{"id":apontamento_id})
    revised=CloseIn(data=apont["data"],modelos=[ModeloIn(modelo_poste_id=apont["modelo_poste_id"],
                        qtd_armaduras=body.qtd_armaduras)],consumos_manuais=body.consumos_manuais,
                        ajustes=body.ajustes)
    plans,bundles=_plan(db,ctx.unit_id,apont["banca_id"],revised)
    model,consumptions,shortages=plans[0]
    for bundle_id,product,theoretical,take,origin,reason in consumptions:
        db.execute(text("""INSERT INTO armacao.armacao_consumo
          (unidade_id,apontamento_id,lote_corte_id,produto_codigo,barras_teoricas,
           barras_baixadas,origem,ajuste_motivo)
          VALUES (:uid,:apont,:bundle,:product,:theoretical,:take,:origin,:reason)"""),
          {"uid":ctx.unit_id,"apont":apontamento_id,"bundle":bundle_id,"product":product,
           "theoretical":theoretical,"take":take,"origin":origin,"reason":reason})
    for product,missing,reason in shortages:
        db.execute(text("""INSERT INTO armacao.armacao_ajuste
          (unidade_id,apontamento_id,produto_codigo,barras_faltantes,motivo,registrado_por)
          VALUES (:uid,:apont,:product,:missing,:reason,:actor)"""),
          {"uid":ctx.unit_id,"apont":apontamento_id,"product":product,"missing":missing,
           "reason":reason,"actor":ctx.actor.id})
    for bundle in bundles:
        status="CONSUMIDO" if bundle["saldo_barras"]==0 else (
          "PARCIAL" if bundle["saldo_barras"]<bundle["qtd_barras"] else "NA_BANCA")
        db.execute(text("UPDATE armacao.aco_lote_corte SET saldo_barras=:saldo,status=:status WHERE id=:id"),
                   {"saldo":bundle["saldo_barras"],"status":status,"id":bundle["id"]})
        if status=="CONSUMIDO":
            db.execute(text("UPDATE armacao.armacao_entrada_feixe SET ativa=false WHERE lote_corte_id=:id AND ativa"),
                       {"id":bundle["id"]})
    db.execute(text("""UPDATE armacao.armacao_apontamento
      SET qtd_armaduras=:qty,status='CORRIGIDO',corrigido_por=:actor,correcao_motivo=:reason
      WHERE id=:id"""),{"qty":body.qtd_armaduras,"actor":ctx.actor.id,
                        "reason":body.motivo,"id":apontamento_id})
    db.execute(text("UPDATE armacao.armadura_lote SET qtd=:qty,saldo=:qty WHERE id=:id"),
               {"qty":body.qtd_armaduras,"id":lot["id"]})
    audit(db,ctx.unit_id,"armacao_apontamento",apontamento_id,"CORRIGIR",ctx.actor.id,
          before={"qtd":apont["qtd_armaduras"]},after={"qtd":body.qtd_armaduras,
          "motivo":body.motivo})
    db.commit();return {"id":apontamento_id,"status":"CORRIGIDO","codigo":lot["codigo"]}
