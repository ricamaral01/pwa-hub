"""Bundle check-in and controlled transfer between welding benches."""
from __future__ import annotations

import re

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.orm import Session

from .auth import Context, context, need
from .corte import audit, one
from .db import session

router = APIRouter(tags=["armacao-banca"])


class ScanIn(BaseModel):
    qr: str
    origem: str = "QR"


def _code(qr: str) -> str:
    value=qr.strip()
    if value.startswith("CFAC1|"): value=value[6:]
    if not re.fullmatch(r"LC-[A-Z0-9]{2,8}-\d{6}-\d{4,}",value):
        raise HTTPException(422,"QR de feixe inválido")
    return value


def _bank(db: Session, bank_id: int, uid: int):
    bank=one(db,"SELECT * FROM armacao.armacao_banca WHERE id=:id AND unidade_id=:uid AND ativa",
             id=bank_id,uid=uid)
    if not bank: raise HTTPException(404,"Banca não encontrada nesta unidade")
    return bank


def _lot(db: Session, code: str, uid: int):
    lot=one(db,"SELECT * FROM armacao.aco_lote_corte WHERE codigo=:code FOR UPDATE",code=code)
    if not lot: raise HTTPException(404,"Feixe não encontrado")
    if lot["unidade_id"] != uid: raise HTTPException(403,"Feixe de outra unidade")
    if lot["status"] in {"CANCELADO","CONSUMIDO"} or lot["saldo_barras"] == 0:
        raise HTTPException(409,"Feixe cancelado ou consumido")
    return lot


@router.post("/bancas/{banca_id}/entradas")
def check_in(banca_id: int, body: ScanIn,
             ctx: Context = Depends(context), db: Session = Depends(session)):
    need(ctx,"armacao.banca",write=True)
    _bank(db,banca_id,ctx.unit_id)
    lot=_lot(db,_code(body.qr),ctx.unit_id)
    current=one(db,"""SELECT e.*,b.nome AS banca_nome FROM armacao.armacao_entrada_feixe e
      JOIN armacao.armacao_banca b ON b.id=e.banca_id
      WHERE e.lote_corte_id=:id AND e.ativa""",id=lot["id"])
    if current:
        if current["banca_id"]==banca_id:
            db.rollback()
            return {"codigo":lot["codigo"],"resultado":"JA_NA_BANCA","mensagem":"Feixe já lido nesta banca"}
        db.rollback()
        raise HTTPException(409,{"codigo":lot["codigo"],"resultado":"TRANSFERIR",
                                 "banca_atual":current["banca_nome"],"entrada_id":current["id"]})
    result=db.execute(text("""INSERT INTO armacao.armacao_entrada_feixe
      (unidade_id,lote_corte_id,banca_id,armador_id,origem)
      VALUES (:uid,:lot,:bank,:actor,:origin) RETURNING id"""),
      {"uid":ctx.unit_id,"lot":lot["id"],"bank":banca_id,"actor":ctx.actor.id,
       "origin":"MANUAL" if body.origem=="MANUAL" else "QR"}).scalar_one()
    db.execute(text("UPDATE armacao.aco_lote_corte SET status='NA_BANCA' WHERE id=:id"),{"id":lot["id"]})
    audit(db,ctx.unit_id,"armacao_entrada_feixe",result,"LER",ctx.actor.id,
          after={"lote":lot["codigo"],"banca_id":banca_id})
    db.commit()
    return {"codigo":lot["codigo"],"resultado":"ENTROU","entrada_id":result}


class TransferIn(BaseModel):
    qr: str
    confirmar: bool


@router.post("/bancas/{banca_id}/transferir")
def transfer(banca_id: int, body: TransferIn,
             ctx: Context = Depends(context), db: Session = Depends(session)):
    need(ctx,"armacao.banca",write=True)
    if not body.confirmar: raise HTTPException(422,"Confirme a transferência")
    _bank(db,banca_id,ctx.unit_id)
    lot=_lot(db,_code(body.qr),ctx.unit_id)
    current=one(db,"""SELECT * FROM armacao.armacao_entrada_feixe
      WHERE lote_corte_id=:id AND ativa FOR UPDATE""",id=lot["id"])
    if not current: raise HTTPException(409,"Feixe sem banca de origem")
    if current["banca_id"]==banca_id: raise HTTPException(409,"Feixe já está nesta banca")
    db.execute(text("UPDATE armacao.armacao_entrada_feixe SET ativa=false WHERE id=:id"),{"id":current["id"]})
    result=db.execute(text("""INSERT INTO armacao.armacao_entrada_feixe
      (unidade_id,lote_corte_id,banca_id,armador_id,origem)
      VALUES (:uid,:lot,:bank,:actor,'TRANSFERENCIA') RETURNING id"""),
      {"uid":ctx.unit_id,"lot":lot["id"],"bank":banca_id,"actor":ctx.actor.id}).scalar_one()
    audit(db,ctx.unit_id,"armacao_entrada_feixe",result,"TRANSFERIR",ctx.actor.id,
          before={"banca_id":current["banca_id"],"entrada_id":current["id"]},
          after={"banca_id":banca_id,"entrada_id":result})
    db.commit()
    return {"codigo":lot["codigo"],"resultado":"TRANSFERIDO","entrada_id":result}


@router.get("/bancas/{banca_id}/feixes")
def bank_bundles(banca_id: int, ctx: Context = Depends(context), db: Session = Depends(session)):
    need(ctx,"armacao.banca")
    _bank(db,banca_id,ctx.unit_id)
    return [dict(row) for row in db.execute(text("""SELECT e.id AS entrada_id,e.lido_em,e.origem,
      l.codigo,l.produto_codigo,l.qtd_barras,l.saldo_barras,l.status,p.descricao
      FROM armacao.armacao_entrada_feixe e
      JOIN armacao.aco_lote_corte l ON l.id=e.lote_corte_id
      JOIN armacao.aco_produto p ON p.codigo=l.produto_codigo
      WHERE e.banca_id=:bank AND e.unidade_id=:uid AND e.ativa
      ORDER BY e.lido_em,e.id"""),{"bank":banca_id,"uid":ctx.unit_id}).mappings()]
