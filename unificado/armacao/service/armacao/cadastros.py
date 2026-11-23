"""Unit-scoped machines, printers, banks, products and reinforcement BOM."""
from __future__ import annotations

import csv
from datetime import date, datetime
from decimal import Decimal
from io import StringIO
from typing import Literal

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import Response
from pydantic import BaseModel, Field, ValidationError
from sqlalchemy import text
from sqlalchemy.orm import Session

from .auth import Actor, Context, context, get_actor, need
from .db import session

router = APIRouter(tags=["armacao-cadastros"])


class MachineIn(BaseModel):
    nome: str = Field(min_length=2, max_length=120)
    tipo: Literal["DESBOBINADEIRA", "CORTE"]
    impressora_id: int | None = None
    ativa: bool = True


class PrinterIn(BaseModel):
    nome: str = Field(min_length=2, max_length=120)
    modelo: str | None = None
    linguagem: Literal["PPLA", "PPLB", "PPLZ", "PDF"] = "PPLB"
    conexao: Literal["TCP", "AGENTE_LOCAL", "NAVEGADOR"] = "NAVEGADOR"
    host: str | None = None
    porta: int = Field(default=9100, ge=1, le=65535)
    largura_mm: int = Field(default=100, ge=30, le=200)
    altura_mm: int = Field(default=60, ge=20, le=200)
    ativa: bool = True


class BankIn(BaseModel):
    nome: str = Field(min_length=2, max_length=120)
    setor: str | None = None
    ativa: bool = True


class ProductIn(BaseModel):
    codigo: int = Field(gt=0)
    grupo_consumo: str
    descricao: str
    unid: Literal["KG", "BR"]
    tipo: Literal["ROLO", "BARRA_MP", "BARRA_CORTE", "ARAME", "FIO"]
    classe: str | None = None
    bitola_mm: Decimal | None = None
    comprimento_m: Decimal = Decimal(0)
    peso_metro: Decimal = Decimal(0)
    peso_barra_kg: Decimal = Decimal(0)
    mp_codigo: int | None = None
    ativo: bool = True


class ActiveIn(BaseModel):
    ativo: bool


class BomIn(BaseModel):
    modelo_poste_id: int
    produto_codigo: int
    posicao: str = Field(min_length=1, max_length=30)
    barras_por_armadura: Decimal = Field(gt=0)
    vigente_desde: date
    vigente_ate: date | None = None


class ConfigIn(BaseModel):
    prefixo: str = Field(pattern=r"^[A-Z0-9]{2,8}$")
    tolerancia_saldo: Decimal = Field(ge=0, le=1)


def rows(db: Session, sql: str, **params):
    return [dict(row) for row in db.execute(text(sql), params).mappings()]


@router.get("/unidades")
def units(actor: Actor = Depends(get_actor), db: Session = Depends(session)):
    if not actor.actions:
        return []
    available = rows(db, """SELECT u.id,u.codigo,u.nome,c.enabled
                            FROM producao.unidade u JOIN armacao.configuracao_unidade c ON c.unidade_id=u.id
                            WHERE u.ativo ORDER BY u.id""")
    return [{**row,"actions":sorted(actor.actions),"master":actor.master} for row in available
            if actor.master or row["codigo"] in actor.units]


@router.get("/cadastros/configuracao")
def get_config(ctx: Context = Depends(context), db: Session = Depends(session)):
    need(ctx, "armacao.cadastros")
    return rows(db, "SELECT * FROM armacao.configuracao_unidade WHERE unidade_id=:uid", uid=ctx.unit_id)[0]


@router.put("/cadastros/configuracao")
def put_config(body: ConfigIn, ctx: Context = Depends(context), db: Session = Depends(session)):
    need(ctx, "armacao.cadastros", write=True)
    db.execute(text("""UPDATE armacao.configuracao_unidade
                       SET prefixo=:prefixo,tolerancia_saldo=:tolerance,atualizado_em=now()
                       WHERE unidade_id=:uid"""),
               {"prefixo": body.prefixo, "tolerance": body.tolerancia_saldo, "uid": ctx.unit_id})
    db.commit()
    return {"ok": True}


@router.get("/cadastros/produtos")
def products(ctx: Context = Depends(context), db: Session = Depends(session)):
    if "armacao.cadastros" not in ctx.actor.actions:
        need(ctx, "armacao.corte")
    return rows(db, """SELECT p.*,pu.ativo AS ativo_unidade
                       FROM armacao.aco_produto p JOIN armacao.aco_produto_unidade pu
                         ON pu.produto_codigo=p.codigo
                       WHERE pu.unidade_id=:uid ORDER BY p.classe,p.bitola_mm,p.tipo,p.codigo""", uid=ctx.unit_id)


@router.post("/cadastros/produtos", status_code=201)
def create_product(body: ProductIn, ctx: Context = Depends(context), db: Session = Depends(session)):
    need(ctx, "armacao.cadastros", write=True)
    values = body.model_dump()
    columns = ",".join(values)
    placeholders = ",".join(f":{key}" for key in values)
    db.execute(text(f"INSERT INTO armacao.aco_produto({columns}) VALUES ({placeholders})"), values)
    db.execute(text("""INSERT INTO armacao.aco_produto_unidade(unidade_id,produto_codigo,ativo)
                       SELECT id,:code,false FROM producao.unidade WHERE ativo"""), {"code": body.codigo})
    db.commit()
    return {"codigo": body.codigo}


@router.put("/cadastros/produtos/{codigo}")
def update_product(codigo: int, body: ProductIn,
                   ctx: Context = Depends(context), db: Session = Depends(session)):
    need(ctx, "armacao.cadastros", write=True)
    if codigo != body.codigo:
        raise HTTPException(422, "O código ERP não pode mudar")
    values = body.model_dump(exclude={"codigo"})
    assignments = ",".join(f"{key}=:{key}" for key in values)
    updated = db.execute(text(f"UPDATE armacao.aco_produto SET {assignments} WHERE codigo=:code RETURNING codigo"),
                         {"code": codigo, **values}).scalar_one_or_none()
    if updated is None: raise HTTPException(404, "Produto não encontrado")
    db.commit()
    return {"codigo": codigo}


@router.put("/cadastros/produtos/{codigo}/unidade")
def active_product(codigo: int, body: ActiveIn, ctx: Context = Depends(context), db: Session = Depends(session)):
    need(ctx, "armacao.cadastros", write=True)
    changed = db.execute(text("""UPDATE armacao.aco_produto_unidade SET ativo=:active
                                 WHERE unidade_id=:uid AND produto_codigo=:code RETURNING produto_codigo"""),
                         {"active": body.ativo, "uid": ctx.unit_id, "code": codigo}).scalar_one_or_none()
    if changed is None:
        raise HTTPException(404, "Produto não encontrado")
    db.commit()
    return {"codigo": codigo, "ativo": body.ativo}


@router.get("/cadastros/modelos")
def models(ctx: Context = Depends(context), db: Session = Depends(session)):
    need(ctx, "armacao.cadastros")
    return rows(db, "SELECT * FROM armacao.modelo_poste_ref WHERE unidade_id=:uid ORDER BY descricao", uid=ctx.unit_id)


@router.post("/cadastros/modelos/sincronizar")
def sync_models(ctx: Context = Depends(context), db: Session = Depends(session)):
    need(ctx, "armacao.cadastros", write=True)
    if ctx.unit_code == "campinas":
        source = rows(db, "SELECT id,codigo AS code,nome AS description FROM public.produtos")
        name = "CAMPINAS_PCP"
    else:
        source = rows(db, """SELECT id,cod_pro AS code,descricao AS description
                            FROM producao.produto WHERE unidade_id=:uid""", uid=ctx.unit_id)
        name = "PRODUCAO_UNIDADE"
    for item in source:
        db.execute(text("""INSERT INTO armacao.modelo_poste_ref
                           (unidade_id,fonte,origem_id,codigo,descricao)
                           VALUES (:uid,:source,:id,:code,:description)
                           ON CONFLICT (unidade_id,fonte,origem_id)
                           DO UPDATE SET codigo=EXCLUDED.codigo,descricao=EXCLUDED.descricao"""),
                   {"uid": ctx.unit_id, "source": name, **item})
    db.commit()
    return {"sincronizados": len(source)}


@router.get("/cadastros/bom")
def list_bom(ctx: Context = Depends(context), db: Session = Depends(session)):
    need(ctx, "armacao.cadastros")
    return rows(db, "SELECT * FROM armacao.armadura_modelo_bom WHERE unidade_id=:uid ORDER BY modelo_poste_id,posicao", uid=ctx.unit_id)


def _insert_bom(db: Session, uid: int, item: BomIn):
    if not db.execute(text("SELECT 1 FROM armacao.modelo_poste_ref WHERE id=:id AND unidade_id=:uid"),
                      {"id": item.modelo_poste_id, "uid": uid}).first():
        raise HTTPException(422, "Modelo de outra unidade ou inexistente")
    result = db.execute(text("""INSERT INTO armacao.armadura_modelo_bom
      (unidade_id,modelo_poste_id,produto_codigo,posicao,barras_por_armadura,vigente_desde,vigente_ate)
      VALUES (:uid,:model,:product,:position,:bars,:start,:end) RETURNING id"""),
        {"uid": uid, "model": item.modelo_poste_id, "product": item.produto_codigo,
         "position": item.posicao, "bars": item.barras_por_armadura,
         "start": item.vigente_desde, "end": item.vigente_ate}).scalar_one()
    return result


@router.post("/cadastros/bom", status_code=201)
def create_bom(body: BomIn, ctx: Context = Depends(context), db: Session = Depends(session)):
    need(ctx, "armacao.cadastros", write=True)
    result = _insert_bom(db, ctx.unit_id, body)
    db.commit()
    return {"id": result}


@router.put("/cadastros/bom/{bom_id}")
def update_bom(bom_id: int, body: BomIn,
               ctx: Context = Depends(context), db: Session = Depends(session)):
    need(ctx, "armacao.cadastros", write=True)
    if not db.execute(text("SELECT 1 FROM armacao.modelo_poste_ref WHERE id=:id AND unidade_id=:uid"),
                      {"id": body.modelo_poste_id, "uid": ctx.unit_id}).first():
        raise HTTPException(422, "Modelo de outra unidade ou inexistente")
    updated=db.execute(text("""UPDATE armacao.armadura_modelo_bom
      SET modelo_poste_id=:model,produto_codigo=:product,posicao=:position,
          barras_por_armadura=:bars,vigente_desde=:start,vigente_ate=:end
      WHERE id=:id AND unidade_id=:uid RETURNING id"""),
      {"id":bom_id,"uid":ctx.unit_id,"model":body.modelo_poste_id,
       "product":body.produto_codigo,"position":body.posicao,
       "bars":body.barras_por_armadura,"start":body.vigente_desde,"end":body.vigente_ate}).scalar_one_or_none()
    if updated is None: raise HTTPException(404,"BOM não encontrada")
    db.commit();return {"id":updated}


@router.post("/cadastros/bom/importar")
async def import_bom(arquivo: UploadFile = File(...), ctx: Context = Depends(context),
                     db: Session = Depends(session)):
    need(ctx, "armacao.cadastros", write=True)
    content = await arquivo.read(1_000_001)
    if len(content) > 1_000_000:
        raise HTTPException(413, "CSV excede 1 MB")
    try:
        source = csv.DictReader(StringIO(content.decode("utf-8-sig")))
        values = [BomIn(modelo_poste_id=int(row["modelo"]), produto_codigo=int(row["codigo"]),
                        posicao=row["posicao"], barras_por_armadura=Decimal(row["barras"]),
                        vigente_desde=date.fromisoformat(row["vigente_desde"])) for row in source]
    except (UnicodeError, KeyError, ValueError, ValidationError) as exc:
        raise HTTPException(422, f"CSV inválido: {exc}") from exc
    if not values or len(values) > 1000:
        raise HTTPException(422, "Informe de 1 a 1000 linhas")
    for item in values:
        _insert_bom(db, ctx.unit_id, item)
    db.commit()
    return {"importados": len(values)}


TABLES = {"maquinas": ("aco_maquina", MachineIn), "impressoras": ("aco_impressora", PrinterIn),
          "bancas": ("armacao_banca", BankIn)}


def _catalog_table(kind: str):
    if kind not in TABLES:
        raise HTTPException(404, "Cadastro desconhecido")
    return TABLES[kind][0]


@router.get("/cadastros/impressoras/{printer_id}/teste")
def printer_test(printer_id: int, ctx: Context = Depends(context), db: Session = Depends(session)):
    need(ctx,"armacao.cadastros")
    printer=db.execute(text("SELECT id FROM armacao.aco_impressora WHERE id=:id AND unidade_id=:uid"),
                       {"id":printer_id,"uid":ctx.unit_id}).scalar_one_or_none()
    if printer is None: raise HTTPException(404,"Impressora não encontrada")
    from .corte import _label_pdf
    sample={"codigo":"TESTE-ARGOX","produto_codigo":0,"descricao":"Conferir área e alinhamento",
            "qtd_barras":1,"peso_kg":Decimal("1.00"),"corrida":"TESTE","fornecedor":"Concrefer",
            "maquina":"Teste de impressora","operador_id":ctx.actor.id,"cortado_em":datetime.now()}
    return Response(_label_pdf(sample,1),media_type="application/pdf",
                    headers={"Content-Disposition":"inline; filename=teste-armacao.pdf"})


@router.get("/cadastros/{kind}")
def list_catalog(kind: str, ctx: Context = Depends(context), db: Session = Depends(session)):
    table = _catalog_table(kind)
    if "armacao.cadastros" not in ctx.actor.actions:
        need(ctx, "armacao.corte" if kind == "maquinas" else
             "armacao.banca" if kind == "bancas" else "armacao.cadastros")
    return rows(db, f"SELECT * FROM armacao.{table} WHERE unidade_id=:uid ORDER BY id", uid=ctx.unit_id)


@router.post("/cadastros/{kind}", status_code=201)
def create_catalog(kind: str, body: dict, ctx: Context = Depends(context), db: Session = Depends(session)):
    need(ctx, "armacao.cadastros", write=True)
    table = _catalog_table(kind)
    parsed = TABLES[kind][1].model_validate(body).model_dump()
    if kind == "maquinas" and parsed["impressora_id"] is not None:
        if not db.execute(text("SELECT 1 FROM armacao.aco_impressora WHERE id=:id AND unidade_id=:uid"),
                          {"id": parsed["impressora_id"], "uid": ctx.unit_id}).first():
            raise HTTPException(422, "Impressora de outra unidade ou inexistente")
    columns = ",".join(["unidade_id", *parsed])
    values = ",".join([":uid", *[f":{key}" for key in parsed]])
    result = db.execute(text(f"INSERT INTO armacao.{table} ({columns}) VALUES ({values}) RETURNING id"),
                        {"uid": ctx.unit_id, **parsed}).scalar_one()
    db.commit()
    return {"id": result}


@router.put("/cadastros/{kind}/{record_id}")
def update_catalog(kind: str, record_id: int, body: dict,
                   ctx: Context = Depends(context), db: Session = Depends(session)):
    need(ctx, "armacao.cadastros", write=True)
    table = _catalog_table(kind)
    parsed = TABLES[kind][1].model_validate(body).model_dump()
    if kind == "maquinas" and parsed["impressora_id"] is not None:
        if not db.execute(text("SELECT 1 FROM armacao.aco_impressora WHERE id=:id AND unidade_id=:uid"),
                          {"id": parsed["impressora_id"], "uid": ctx.unit_id}).first():
            raise HTTPException(422, "Impressora de outra unidade ou inexistente")
    assignments = ",".join(f"{key}=:{key}" for key in parsed)
    updated = db.execute(text(f"UPDATE armacao.{table} SET {assignments} WHERE id=:id AND unidade_id=:uid RETURNING id"),
                         {"id": record_id, "uid": ctx.unit_id, **parsed}).scalar_one_or_none()
    if updated is None:
        raise HTTPException(404, "Cadastro não encontrado na unidade")
    db.commit()
    return {"id": updated}


