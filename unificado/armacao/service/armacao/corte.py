"""Online cutting, immutable bundle weight, label and print dispatch."""
from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from io import BytesIO
import hmac
import os
import socket

from fastapi import APIRouter, Depends, Header, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.orm import Session
from psycopg.types.json import Jsonb
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas
import qrcode

from .auth import Context, context, need
from .db import session

router = APIRouter(tags=["armacao-corte"])


def one(db: Session, sql: str, **params):
    return db.execute(text(sql), params).mappings().first()


def audit(db: Session, uid: int, entity: str, entity_id: int, action: str,
          actor: str, before=None, after=None):
    db.execute(text("""INSERT INTO armacao.auditoria
      (unidade_id,entidade,entidade_id,acao,antes,depois,usuario_id)
      VALUES (:uid,:entity,:id,:action,:before,:after,:actor)"""),
      {"uid":uid,"entity":entity,"id":entity_id,"action":action,"actor":actor,
       "before":Jsonb(before) if before is not None else None,
       "after":Jsonb(after) if after is not None else None})


@router.get("/maquinas/{maquina_id}/produtos-disponiveis")
def available(maquina_id: int, ctx: Context = Depends(context), db: Session = Depends(session)):
    need(ctx,"armacao.corte")
    machine = one(db,"""SELECT b.* FROM armacao.aco_maquina m
       JOIN armacao.aco_bobina b ON b.id=m.bobina_em_uso_id
       WHERE m.id=:mid AND m.unidade_id=:uid AND b.status='EM_USO'""",mid=maquina_id,uid=ctx.unit_id)
    if not machine: raise HTTPException(409,"Monte um rolo na máquina")
    return [dict(row) for row in db.execute(text("""SELECT p.* FROM armacao.aco_produto p
      JOIN armacao.aco_produto_unidade pu ON pu.produto_codigo=p.codigo
      WHERE pu.unidade_id=:uid AND pu.ativo AND p.ativo AND p.tipo='BARRA_CORTE'
        AND p.mp_codigo=:mp ORDER BY p.comprimento_m,p.codigo"""),
        {"uid":ctx.unit_id,"mp":machine["produto_mp_codigo"]}).mappings()]


class CorteIn(BaseModel):
    maquina_id: int
    produto_codigo: int
    qtd_barras: int = Field(gt=0)
    ordem_producao: str | None = None


@router.post("/lotes-corte", status_code=201)
def cut(body: CorteIn, ctx: Context = Depends(context), db: Session = Depends(session)):
    need(ctx,"armacao.corte",write=True)
    machine = one(db,"""SELECT m.*,b.produto_mp_codigo,b.peso_liquido_kg FROM armacao.aco_maquina m
      JOIN armacao.aco_bobina b ON b.id=m.bobina_em_uso_id AND b.unidade_id=m.unidade_id
      WHERE m.id=:mid AND m.unidade_id=:uid AND m.ativa AND b.status='EM_USO' FOR UPDATE OF m,b""",
      mid=body.maquina_id,uid=ctx.unit_id)
    if not machine: raise HTTPException(409,"Máquina sem rolo em uso")
    product = one(db,"""SELECT p.* FROM armacao.aco_produto p
      JOIN armacao.aco_produto_unidade pu ON pu.produto_codigo=p.codigo
      WHERE p.codigo=:code AND p.tipo='BARRA_CORTE' AND p.ativo
        AND p.mp_codigo=:mp AND pu.unidade_id=:uid AND pu.ativo""",
      code=body.produto_codigo,mp=machine["produto_mp_codigo"],uid=ctx.unit_id)
    if not product: raise HTTPException(422,"Produto não pertence ao rolo ou está inativo")
    weight = (Decimal(body.qtd_barras)*product["peso_barra_kg"]).quantize(Decimal("0.01"))
    if weight <= 0: raise HTTPException(422,"Peso da barra não cadastrado")
    today = datetime.now().astimezone().date()
    number = db.execute(text("""INSERT INTO armacao.sequencia_dia(unidade_id,data,tipo,proximo)
      VALUES (:uid,:day,'LC',2) ON CONFLICT (unidade_id,data,tipo)
      DO UPDATE SET proximo=armacao.sequencia_dia.proximo+1
      RETURNING proximo-1"""),{"uid":ctx.unit_id,"day":today}).scalar_one()
    code = f"LC-{ctx.prefix}-{today:%y%m%d}-{number:04d}"
    item = one(db,"""INSERT INTO armacao.aco_lote_corte
      (unidade_id,codigo,bobina_id,produto_codigo,ordem_producao,qtd_barras,peso_kg,
       saldo_barras,maquina_id,operador_id)
      VALUES (:uid,:code,:bobina,:product,:op,:qty,:weight,:qty,:machine,:operator)
      RETURNING *""",uid=ctx.unit_id,code=code,bobina=machine["bobina_em_uso_id"],
      product=body.produto_codigo,op=body.ordem_producao,qty=body.qtd_barras,
      weight=weight,machine=body.maquina_id,operator=ctx.actor.id)
    balance = one(db,"""SELECT b.peso_liquido_kg-COALESCE(sum(l.peso_kg),0) AS saldo
      FROM armacao.aco_bobina b LEFT JOIN armacao.aco_lote_corte l
      ON l.bobina_id=b.id AND l.status<>'CANCELADO' WHERE b.id=:id GROUP BY b.id""",
      id=machine["bobina_em_uso_id"])["saldo"]
    threshold = -machine["peso_liquido_kg"]*Decimal(str(ctx.tolerance))
    alert = balance < threshold
    audit(db,ctx.unit_id,"aco_lote_corte",item["id"],"CORTAR",ctx.actor.id,
          after={"codigo":code,"peso_kg":str(weight),"saldo_rolo_kg":str(balance),"alerta":alert})
    db.commit()
    return {"codigo":code,"peso_kg":weight,"saldo_rolo_kg":balance,
            "alerta_supervisor":alert,"qrcode":f"CFAC1|{code}"}


@router.get("/lotes-corte/{codigo}")
def lot(codigo: str, ctx: Context = Depends(context), db: Session = Depends(session)):
    need(ctx,"armacao.corte")
    item = one(db,"""SELECT l.*,p.descricao,b.corrida,b.fornecedor,m.nome AS maquina
      FROM armacao.aco_lote_corte l JOIN armacao.aco_produto p ON p.codigo=l.produto_codigo
      JOIN armacao.aco_bobina b ON b.id=l.bobina_id
      JOIN armacao.aco_maquina m ON m.id=l.maquina_id
      WHERE l.codigo=:code AND l.unidade_id=:uid""",code=codigo,uid=ctx.unit_id)
    if not item: raise HTTPException(404,"Feixe não encontrado")
    return dict(item)


class CancelIn(BaseModel):
    motivo: str = Field(min_length=3)


@router.post("/lotes-corte/{codigo}/cancelar")
def cancel(codigo: str, body: CancelIn, ctx: Context = Depends(context), db: Session = Depends(session)):
    need(ctx,"armacao.supervisor",write=True)
    item = one(db,"SELECT * FROM armacao.aco_lote_corte WHERE codigo=:code AND unidade_id=:uid FOR UPDATE",
               code=codigo,uid=ctx.unit_id)
    if not item: raise HTTPException(404,"Feixe não encontrado")
    if item["saldo_barras"] != item["qtd_barras"] or item["status"] in {"CONSUMIDO","CANCELADO"}:
        raise HTTPException(409,"Feixe já consumido ou cancelado")
    db.execute(text("""UPDATE armacao.armacao_entrada_feixe SET ativa=false
      WHERE lote_corte_id=:id AND unidade_id=:uid"""),{"id":item["id"],"uid":ctx.unit_id})
    db.execute(text("""UPDATE armacao.aco_lote_corte SET status='CANCELADO',
      cancelado_motivo=:reason,cancelado_por=:user WHERE id=:id"""),
      {"reason":body.motivo,"user":ctx.actor.id,"id":item["id"]})
    audit(db,ctx.unit_id,"aco_lote_corte",item["id"],"CANCELAR",ctx.actor.id,
          before={"status":item["status"]},after={"status":"CANCELADO","motivo":body.motivo})
    db.commit()
    return {"codigo":codigo,"status":"CANCELADO"}


def _label_pdf(item: dict, via: int | None) -> bytes:
    out=BytesIO(); pdf=canvas.Canvas(out,pagesize=(100*mm,60*mm))
    pdf.setFont("Helvetica-Bold",14); pdf.drawString(4*mm,53*mm,item["codigo"])
    qr=qrcode.make(f"CFAC1|{item['codigo']}")
    qr_buffer=BytesIO(); qr.save(qr_buffer,format="PNG"); qr_buffer.seek(0)
    from reportlab.lib.utils import ImageReader
    pdf.drawImage(ImageReader(qr_buffer),70*mm,29*mm,26*mm,26*mm)
    lines=[f"{item['produto_codigo']} {item['descricao'][:35]}",
           f"{item['qtd_barras']} barras | {item['peso_kg']} kg",
           f"Corrida: {item['corrida'] or '-'}",
           f"Fornecedor: {item['fornecedor'][:40]}",
           f"Máquina: {item['maquina'][:30]}",
           f"Operador: {item['operador_id']}",
           f"{item['cortado_em']:%d/%m/%Y %H:%M} | " + (f"Via {via}" if via else "PDF")]
    pdf.setFont("Helvetica",7.5)
    for n,line in enumerate(lines): pdf.drawString(4*mm,(45-6*n)*mm,line)
    pdf.showPage(); pdf.save(); return out.getvalue()


def _label_pplb(item: dict, via: int) -> str:
    def safe(value): return str(value or "-").encode("ascii","replace").decode().replace('"',"'")[:55]
    fields=[item["codigo"],f"{item['produto_codigo']} {item['descricao'][:34]}",
            f"{item['qtd_barras']} barras / {item['peso_kg']} kg",
            f"Corrida {item['corrida'] or '-'} / {item['fornecedor'][:25]}",
            f"{item['maquina']} / {item['operador_id']} / Via {via}"]
    lines=["N","q800","Q480,24","D8"]
    for n,value in enumerate(fields):
        lines.append(f'A24,{24+n*52},0,3,1,1,N,"{safe(value)}"')
    lines.append(f'B24,306,0,QRCODE,2,5,M,0,"CFAC1|{item["codigo"]}"')
    lines.append("P1")
    return "\r\n".join(lines)+"\r\n"


class PrintIn(BaseModel):
    motivo: str | None = None
    impressora_id: int | None = None


@router.get("/lotes-corte/{codigo}/etiqueta.pdf")
def label_pdf_without_printer(codigo: str, ctx: Context = Depends(context),
                              db: Session = Depends(session)):
    """Let operators view or save a bundle label before a printer is installed."""
    need(ctx, "armacao.corte")
    item = one(db, """SELECT l.*,p.descricao,b.corrida,b.fornecedor,m.nome AS maquina
      FROM armacao.aco_lote_corte l
      JOIN armacao.aco_produto p ON p.codigo=l.produto_codigo
      JOIN armacao.aco_bobina b ON b.id=l.bobina_id
      JOIN armacao.aco_maquina m ON m.id=l.maquina_id
      WHERE l.codigo=:code AND l.unidade_id=:uid""", code=codigo, uid=ctx.unit_id)
    if not item:
        raise HTTPException(404, "Feixe não encontrado")
    if item["status"] == "CANCELADO":
        raise HTTPException(409, "Feixe cancelado")
    return Response(_label_pdf(item, None), media_type="application/pdf",
                    headers={"Content-Disposition": f'inline; filename="{codigo}.pdf"'})


@router.post("/lotes-corte/{codigo}/imprimir")
def print_label(codigo: str, body: PrintIn, ctx: Context = Depends(context), db: Session = Depends(session)):
    need(ctx,"armacao.corte",write=True)
    item = one(db,"""SELECT l.*,p.descricao,b.corrida,b.fornecedor,m.nome AS maquina,
      m.impressora_id AS maquina_impressora FROM armacao.aco_lote_corte l
      JOIN armacao.aco_produto p ON p.codigo=l.produto_codigo
      JOIN armacao.aco_bobina b ON b.id=l.bobina_id
      JOIN armacao.aco_maquina m ON m.id=l.maquina_id
      WHERE l.codigo=:code AND l.unidade_id=:uid FOR UPDATE OF l""",code=codigo,uid=ctx.unit_id)
    if not item: raise HTTPException(404,"Feixe não encontrado")
    if item["status"] == "CANCELADO": raise HTTPException(409,"Feixe cancelado")
    printer_id=body.impressora_id or item["maquina_impressora"]
    printer=one(db,"SELECT * FROM armacao.aco_impressora WHERE id=:id AND unidade_id=:uid AND ativa",
                id=printer_id,uid=ctx.unit_id)
    if not printer: raise HTTPException(422,"Configure uma impressora ativa")
    via=db.execute(text("SELECT COALESCE(max(via),0)+1 FROM armacao.aco_impressao WHERE lote_corte_id=:id"),
                   {"id":item["id"]}).scalar_one()
    if via>1 and not (body.motivo or "").strip(): raise HTTPException(422,"Informe o motivo da reimpressão")
    if printer["linguagem"] not in {"PPLB","PDF"}:
        raise HTTPException(422,"Linguagem da impressora ainda não homologada; use PPLB ou PDF")
    if printer["conexao"] in {"TCP","AGENTE_LOCAL"} and printer["linguagem"] != "PPLB":
        raise HTTPException(422,"TCP e agente local exigem PPLB; PDF é para navegador")
    payload = _label_pplb(item,via) if printer["linguagem"]=="PPLB" else _label_pdf(item,via).hex()
    status="PENDENTE" if printer["conexao"]=="AGENTE_LOCAL" else "ENVIADA"
    error=None
    if printer["conexao"]=="TCP":
        if not printer["host"]: raise HTTPException(422,"Host da impressora não configurado")
        try:
            with socket.create_connection((printer["host"],printer["porta"]),timeout=3) as conn:
                conn.sendall(payload.encode("ascii"))
        except OSError as exc:
            status="ERRO"; error=str(exc)[:300]
    result=db.execute(text("""INSERT INTO armacao.aco_impressao
      (unidade_id,lote_corte_id,impressora_id,via,motivo,payload,status,erro,usuario_id,impresso_em)
      VALUES (:uid,:lot,:printer,:via,:reason,:payload,:status,:error,:user,
              CASE WHEN :status='ENVIADA' THEN now() ELSE NULL END) RETURNING id"""),
      {"uid":ctx.unit_id,"lot":item["id"],"printer":printer_id,"via":via,"reason":body.motivo,
       "payload":payload,"status":status,"error":error,"user":ctx.actor.id}).scalar_one()
    audit(db,ctx.unit_id,"aco_impressao",result,"REIMPRIMIR" if via>1 else "IMPRIMIR",
          ctx.actor.id,after={"via":via,"status":status,"motivo":body.motivo})
    db.commit()
    return {"id":result,"via":via,"status":status,"erro":error,
            "pdf_url":f"/unificado/armacao/api/armacao/impressoes/{result}/pdf" if printer["conexao"]=="NAVEGADOR" else None}


@router.get("/impressoes/{print_id}/pdf")
def print_pdf(print_id: int, ctx: Context = Depends(context), db: Session = Depends(session)):
    need(ctx,"armacao.corte")
    row=one(db,"""SELECT l.*,p.descricao,b.corrida,b.fornecedor,m.nome AS maquina,
      i.via FROM armacao.aco_impressao i JOIN armacao.aco_lote_corte l ON l.id=i.lote_corte_id
      JOIN armacao.aco_produto p ON p.codigo=l.produto_codigo
      JOIN armacao.aco_bobina b ON b.id=l.bobina_id
      JOIN armacao.aco_maquina m ON m.id=l.maquina_id
      WHERE i.id=:id AND i.unidade_id=:uid""",id=print_id,uid=ctx.unit_id)
    if not row: raise HTTPException(404,"Impressão não encontrada")
    return Response(_label_pdf(row,row["via"]),media_type="application/pdf",
                    headers={"Content-Disposition":f'inline; filename="{row["codigo"]}.pdf"'})


def _agent_key(token: str | None):
    expected=os.getenv("ARMACAO_AGENT_TOKEN","")
    if not expected or not token or not hmac.compare_digest(token,expected):
        raise HTTPException(401,"Agente não autorizado")


@router.get("/impressoes/fila")
def print_queue(impressora_id: int, x_agent_token: str | None = Header(None,alias="X-Agent-Token"),
                db: Session = Depends(session)):
    _agent_key(x_agent_token)
    return [dict(row) for row in db.execute(text("""SELECT i.id,i.payload,i.via,p.modelo,p.linguagem
      FROM armacao.aco_impressao i JOIN armacao.aco_impressora p ON p.id=i.impressora_id
      WHERE i.impressora_id=:id AND i.status='PENDENTE' AND p.conexao='AGENTE_LOCAL'
      ORDER BY i.id LIMIT 10"""),{"id":impressora_id}).mappings()]


class AgentResult(BaseModel):
    status: str
    erro: str | None = None


@router.post("/impressoes/{print_id}/confirmar")
def confirm_print(print_id: int, body: AgentResult,
                  x_agent_token: str | None = Header(None,alias="X-Agent-Token"),
                  db: Session = Depends(session)):
    _agent_key(x_agent_token)
    if body.status not in {"ENVIADA","ERRO"}: raise HTTPException(422,"Status inválido")
    result=db.execute(text("""UPDATE armacao.aco_impressao SET status=:status,erro=:error,
      impresso_em=CASE WHEN :status='ENVIADA' THEN now() ELSE impresso_em END
      WHERE id=:id AND status='PENDENTE' RETURNING id"""),
      {"id":print_id,"status":body.status,"error":body.erro}).scalar_one_or_none()
    if result is None: raise HTTPException(409,"Impressão já confirmada")
    db.commit(); return {"id":result,"status":body.status}
