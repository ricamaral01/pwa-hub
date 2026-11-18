"""Unit-scoped steel coils, private label photos and machine mounting."""
from __future__ import annotations

from datetime import date
from decimal import Decimal
from pathlib import Path
import os
import secrets
import logging

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.orm import Session

from .auth import Context, context, need
from .db import session
from .ocr import OcrResult, TesseractOcrProvider, parse_label

router = APIRouter(tags=["armacao-bobinas"])


def storage() -> Path:
    root = Path(os.getenv("ARMACAO_PRIVATE_STORAGE", "./private-armacao")).resolve()
    root.mkdir(parents=True, exist_ok=True)
    return root


class BobinaIn(BaseModel):
    produto_mp_codigo: int
    fornecedor: str = Field(min_length=2)
    norma: str | None = None
    corrida: str | None = None
    lote_fornecedor: str | None = None
    codigo_barras: str | None = None
    peso_liquido_kg: Decimal = Field(gt=0)
    data_fabricacao: date | None = None
    foto_token: str | None = None
    ocr_json: dict | None = None
    ocr_confianca: Decimal | None = None


@router.post("/bobinas/ocr")
async def ocr_bobina(foto: UploadFile = File(...), ctx: Context = Depends(context),
                     db: Session = Depends(session)):
    need(ctx, "armacao.corte", write=True)
    content = await foto.read(8_000_001)
    if len(content) > 8_000_000:
        raise HTTPException(413, "Foto excede 8 MB")
    if content.startswith(b"\xff\xd8\xff"):
        ext = ".jpg"
    elif content.startswith(b"\x89PNG\r\n\x1a\n"):
        ext = ".png"
    else:
        raise HTTPException(422, "Use JPEG ou PNG")
    token = secrets.token_hex(16)
    path = storage() / "staging" / str(ctx.unit_id)
    path.mkdir(parents=True, exist_ok=True)
    filename = path / (token + ext)
    filename.write_bytes(content)
    leitura_erro = None
    try:
        result = TesseractOcrProvider().read(str(filename))
    except Exception:
        logging.exception("Falha de OCR na etiqueta da bobina")
        result = OcrResult("", parse_label(""), 0.0)
        leitura_erro = "Não foi possível ler automaticamente. Confira a foto e preencha os dados."
    cls = result.fields["classe"]["valor"]
    bitola = result.fields["bitola_mm"]["valor"]
    suggested = None
    if cls and bitola:
        suggested = db.execute(text("""SELECT p.codigo FROM armacao.aco_produto p
            JOIN armacao.aco_produto_unidade pu ON pu.produto_codigo=p.codigo AND pu.unidade_id=:uid
            WHERE p.tipo='ROLO' AND p.classe=:cls AND p.bitola_mm=:bitola
              AND p.ativo AND pu.ativo LIMIT 1"""),
            {"uid":ctx.unit_id,"cls":cls,"bitola":Decimal(bitola)}).scalar_one_or_none()
    return {"foto_token":token+ext,"texto_bruto":result.text,"campos":result.fields,
            "confianca":result.confidence,"produto_mp_codigo_sugerido":suggested,
            "leitura_erro":leitura_erro}


@router.post("/bobinas", status_code=201)
def create_bobina(body: BobinaIn, ctx: Context = Depends(context), db: Session = Depends(session)):
    need(ctx, "armacao.corte", write=True)
    valid = db.execute(text("""SELECT 1 FROM armacao.aco_produto p
        JOIN armacao.aco_produto_unidade pu ON pu.produto_codigo=p.codigo
        WHERE p.codigo=:code AND p.tipo='ROLO' AND p.ativo AND pu.unidade_id=:uid AND pu.ativo"""),
        {"code":body.produto_mp_codigo,"uid":ctx.unit_id}).first()
    if not valid:
        raise HTTPException(422, "Rolo não ativo nesta unidade")
    foto_path = None
    if body.foto_token:
        if not __import__("re").fullmatch(r"[0-9a-f]{32}\.(jpg|png)", body.foto_token):
            raise HTTPException(422, "Foto inválida")
        staged = storage() / "staging" / str(ctx.unit_id) / body.foto_token
        if not staged.is_file():
            raise HTTPException(422, "Foto não encontrada")
        target_dir = storage() / "bobinas" / str(ctx.unit_id)
        target_dir.mkdir(parents=True, exist_ok=True)
        target = target_dir / body.foto_token
        staged.replace(target)
        foto_path = str(target)
    from psycopg.types.json import Jsonb
    values = body.model_dump(exclude={"foto_token"})
    values.update(uid=ctx.unit_id, user=ctx.actor.id, foto=foto_path,
                  ocr_json=Jsonb(body.ocr_json) if body.ocr_json else None)
    try:
        result = db.execute(text("""INSERT INTO armacao.aco_bobina
            (unidade_id,produto_mp_codigo,fornecedor,norma,corrida,lote_fornecedor,codigo_barras,
             peso_liquido_kg,data_fabricacao,foto_path,ocr_json,ocr_confianca,criado_por)
            VALUES (:uid,:produto_mp_codigo,:fornecedor,:norma,:corrida,:lote_fornecedor,:codigo_barras,
                    :peso_liquido_kg,:data_fabricacao,:foto,:ocr_json,:ocr_confianca,:user)
            RETURNING id"""), values).scalar_one()
        db.commit()
    except Exception:
        db.rollback()
        if foto_path: Path(foto_path).unlink(missing_ok=True)
        raise
    return {"id":result}


@router.get("/bobinas")
def list_bobinas(status: str | None = None, ctx: Context = Depends(context),
                 db: Session = Depends(session)):
    need(ctx, "armacao.corte")
    if status and status not in {"EM_USO","ENCERRADA"}:
        raise HTTPException(422, "Status inválido")
    query = """SELECT b.*,
      b.peso_liquido_kg-COALESCE((SELECT sum(l.peso_kg) FROM armacao.aco_lote_corte l
                                  WHERE l.bobina_id=b.id AND l.status<>'CANCELADO'),0) AS saldo_kg
      FROM armacao.aco_bobina b WHERE b.unidade_id=:uid"""
    params = {"uid": ctx.unit_id}
    if status:
        query += " AND b.status=:status"
        params["status"] = status
    query += " ORDER BY b.id DESC"
    return [dict(row) for row in db.execute(text(query), params).mappings()]


@router.get("/bobinas/{bobina_id}/foto")
def foto_bobina(bobina_id: int, ctx: Context = Depends(context), db: Session = Depends(session)):
    need(ctx, "armacao.corte")
    path = db.execute(text("SELECT foto_path FROM armacao.aco_bobina WHERE id=:id AND unidade_id=:uid"),
                      {"id":bobina_id,"uid":ctx.unit_id}).scalar_one_or_none()
    if not path or not Path(path).is_file():
        raise HTTPException(404, "Foto não encontrada")
    return FileResponse(path, media_type="image/png" if path.endswith(".png") else "image/jpeg")


@router.post("/bobinas/{bobina_id}/encerrar")
def encerrar(bobina_id: int, ctx: Context = Depends(context), db: Session = Depends(session)):
    need(ctx, "armacao.corte", write=True)
    row = db.execute(text("SELECT * FROM armacao.aco_bobina WHERE id=:id AND unidade_id=:uid FOR UPDATE"),
                     {"id":bobina_id,"uid":ctx.unit_id}).mappings().first()
    if not row: raise HTTPException(404, "Rolo não encontrado")
    if row["criado_por"] != ctx.actor.id: need(ctx,"armacao.supervisor",write=True)
    db.execute(text("UPDATE armacao.aco_maquina SET bobina_em_uso_id=NULL WHERE bobina_em_uso_id=:id AND unidade_id=:uid"),
               {"id":bobina_id,"uid":ctx.unit_id})
    db.execute(text("UPDATE armacao.aco_bobina SET status='ENCERRADA',encerrada_em=now() WHERE id=:id"),{"id":bobina_id})
    db.commit()
    return {"id":bobina_id,"status":"ENCERRADA"}


class MontarIn(BaseModel):
    bobina_id: int
    confirmar_troca: bool = False


@router.post("/maquinas/{maquina_id}/montar-bobina")
def montar(maquina_id: int, body: MontarIn, ctx: Context = Depends(context), db: Session = Depends(session)):
    need(ctx, "armacao.corte", write=True)
    machine = db.execute(text("SELECT * FROM armacao.aco_maquina WHERE id=:id AND unidade_id=:uid AND ativa FOR UPDATE"),
                         {"id":maquina_id,"uid":ctx.unit_id}).mappings().first()
    if not machine: raise HTTPException(404, "Máquina não encontrada")
    coil = db.execute(text("SELECT * FROM armacao.aco_bobina WHERE id=:id AND unidade_id=:uid FOR UPDATE"),
                      {"id":body.bobina_id,"uid":ctx.unit_id}).mappings().first()
    if not coil or coil["status"] != "EM_USO": raise HTTPException(422, "Rolo indisponível")
    if coil["maquina_id"] not in (None, maquina_id): raise HTTPException(409, "Rolo em outra máquina")
    old = machine["bobina_em_uso_id"]
    if old and old != body.bobina_id and not body.confirmar_troca:
        raise HTTPException(409, "Confirme o encerramento do rolo anterior")
    if old and old != body.bobina_id:
        db.execute(text("UPDATE armacao.aco_maquina SET bobina_em_uso_id=NULL WHERE id=:id"),{"id":maquina_id})
        db.execute(text("UPDATE armacao.aco_bobina SET status='ENCERRADA',encerrada_em=now() WHERE id=:id"),{"id":old})
    db.execute(text("UPDATE armacao.aco_bobina SET maquina_id=:mid,montada_em=now() WHERE id=:bid"),
               {"mid":maquina_id,"bid":body.bobina_id})
    db.execute(text("UPDATE armacao.aco_maquina SET bobina_em_uso_id=:bid WHERE id=:mid"),
               {"bid":body.bobina_id,"mid":maquina_id})
    db.commit()
    return {"maquina_id":maquina_id,"bobina_id":body.bobina_id}
