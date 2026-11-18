"""Campinas planning, working calendar and immutable armature report issues."""
from datetime import date, datetime
import json
from typing import Literal
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.encoders import jsonable_encoder
from fastapi.responses import Response
from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import require_roles
from app.models.usuario import NivelAcesso
from app.services.armaduras import build, calendar, canonical, fingerprint, pdf, rows

router = APIRouter(prefix="/api/armaduras", tags=["armaduras"])
READ = (NivelAcesso.ADMIN, NivelAcesso.PCP, NivelAcesso.PRODUCAO, NivelAcesso.CONSULTA)


def authorize(db, user, write=False):
    if write and user.nivel_acesso not in (NivelAcesso.ADMIN, NivelAcesso.PCP):
        raise HTTPException(403, "Somente Planejamento pode alterar o calendário")
    # Legacy Campinas accounts have no unit grants. Explicit out-of-unit
    # assignments must not open Campinas through a forged query parameter.
    grants = rows(db,"SELECT unidade_id FROM producao.usuario_unidade WHERE usuario_id=:id AND ativo",id=user.id)
    master = user.nivel_acesso == NivelAcesso.ADMIN and getattr(user,"username","").casefold() in {"ricardo","marcelo","alex","philippe"}
    if grants and not any(r["unidade_id"] == 1 for r in grants) and not master:
        raise HTTPException(403, "Sem acesso ao Planejamento de Campinas")


class CalendarInput(BaseModel):
    dias_semana: list[int] = Field(min_length=1,max_length=7)
    confirmado: bool = True
    revisao: int = Field(ge=1)


class ExceptionInput(BaseModel):
    trabalha: bool
    motivo: str = Field(min_length=3,max_length=200)
    revisao: int = Field(ge=1)


class IssueInput(BaseModel):
    semana: date
    grupo: Literal["12","34","todos"]
    assinatura: str = Field(min_length=64,max_length=64)


def report(db, semana, grupo):
    groups = [build(db,semana,g) for g in (["12","34"] if grupo == "todos" else [grupo])]
    return {"grupos":groups,"assinatura":fingerprint([g["assinatura"] for g in groups]),
            "pendencias":sorted({p for g in groups for p in g["pendencias"]})}


@router.get("/calendario")
def get_calendar(db: Session=Depends(get_db),user=Depends(require_roles(*READ))):
    authorize(db,user)
    return calendar(db)


@router.put("/calendario")
def put_calendar(body: CalendarInput,db: Session=Depends(get_db),user=Depends(require_roles(*READ))):
    authorize(db,user,True)
    if any(d not in range(6) for d in body.dias_semana) or len(set(body.dias_semana)) != len(body.dias_semana):
        raise HTTPException(422,"Dias da semana inválidos")
    result=db.execute(text("""UPDATE public.armaduras_calendario SET dias_semana=:days,
      confirmado=:confirmed,revisao=revisao+1,atualizado_por=:user,atualizado_em=now()
      WHERE unidade_id=1 AND revisao=:revision RETURNING revisao"""),
      {"days":body.dias_semana,"confirmed":body.confirmado,"user":user.id,"revision":body.revisao}).first()
    if not result:
        raise HTTPException(409,"Calendário alterado por outra pessoa. Recarregue a tela")
    db.commit()
    return calendar(db)


@router.put("/calendario/dias/{day}")
def put_exception(day:date,body:ExceptionInput,db:Session=Depends(get_db),user=Depends(require_roles(*READ))):
    authorize(db,user,True)
    if day.weekday()==6 and body.trabalha:
        raise HTTPException(422,"Domingo não faz parte do calendário de trabalho das armaduras")
    result=db.execute(text("""UPDATE public.armaduras_calendario SET revisao=revisao+1,
      atualizado_por=:user,atualizado_em=now() WHERE unidade_id=1 AND revisao=:revision RETURNING revisao"""),
      {"user":user.id,"revision":body.revisao}).first()
    if not result:
        raise HTTPException(409,"Calendário alterado. Recarregue a tela")
    db.execute(text("""INSERT INTO public.armaduras_calendario_dia(unidade_id,data,trabalha,motivo)
      VALUES(1,:day,:open,:reason) ON CONFLICT(unidade_id,data)
      DO UPDATE SET trabalha=EXCLUDED.trabalha,motivo=EXCLUDED.motivo"""),
      {"day":day,"open":body.trabalha,"reason":body.motivo.strip()})
    db.commit()
    return calendar(db)


@router.get("/programacao")
def programming(semana:date,grupo:Literal["12","34"]="12",data_armadura:date|None=None,
                db:Session=Depends(get_db),user=Depends(require_roles(*READ))):
    authorize(db,user)
    return build(db,semana,grupo,data_armadura)


@router.get("/relatorio")
def preview(semana:date,grupo:Literal["12","34","todos"]="12",
            db:Session=Depends(get_db),user=Depends(require_roles(*READ))):
    authorize(db,user)
    return report(db,semana,grupo)


@router.post("/emissoes",status_code=201)
def issue(body:IssueInput,db:Session=Depends(get_db),user=Depends(require_roles(*READ))):
    authorize(db,user)
    # Serialize issues/calendar changes and hold source rows stable until commit.
    # SHARE locks are short and prevent concurrent source edits from producing a
    # new PDF against a different revision than the one reviewed on screen.
    db.execute(text("SELECT pg_advisory_xact_lock(20261111,1)"))
    db.execute(text("LOCK TABLE public.armaduras_calendario,public.armaduras_calendario_dia,public.programacao_semana,public.programacao_semana_dia,public.programacao_semana_item,public.programacoes_circular_s3,public.programacoes_circular_s4,public.produtos IN SHARE MODE"))
    snapshot=report(db,body.semana,body.grupo)
    if snapshot["assinatura"] != body.assinatura:
        raise HTTPException(409,"A programação ou o calendário mudou. Atualize a prévia antes de emitir")
    if snapshot["pendencias"]:
        raise HTTPException(409,"; ".join(snapshot["pendencias"]))
    if not any(g["total"] for g in snapshot["grupos"]):
        raise HTTPException(409,"Não há armaduras programadas para emitir")
    revision=rows(db,"""SELECT COALESCE(MAX(revisao),0)+1 AS revisao FROM public.armaduras_emissao
      WHERE semana=:week AND grupo=:group""",week=body.semana,group=body.grupo)[0]["revisao"]
    # Serialise Sao Paulo timestamp once; avoid changing the report on reprint.
    created=datetime.now(ZoneInfo("America/Sao_Paulo")).isoformat(timespec="seconds")
    emission=rows(db,"""INSERT INTO public.armaduras_emissao(semana,grupo,revisao,assinatura,
      snapshot,responsavel,criado_por,criado_em) VALUES(:week,:group,:revision,:hash,CAST(:snapshot AS jsonb),:name,:user,:created)
      RETURNING id,revisao,responsavel,criado_em""",week=body.semana,group=body.grupo,revision=revision,
      hash=snapshot["assinatura"],snapshot=canonical(snapshot),name=user.nome,user=user.id,created=created)[0]
    content=pdf(jsonable_encoder(snapshot),jsonable_encoder(emission))
    db.execute(text("UPDATE public.armaduras_emissao SET arquivo_pdf=:pdf WHERE id=:id"),{"pdf":content,"id":emission["id"]})
    db.commit()
    return emission


@router.get("/emissoes")
def history(semana:date,grupo:Literal["12","34","todos"]="12",db:Session=Depends(get_db),user=Depends(require_roles(*READ))):
    authorize(db,user)
    current=report(db,semana,grupo)["assinatura"]
    records=rows(db,"""SELECT id,revisao,assinatura,responsavel,criado_em FROM public.armaduras_emissao
      WHERE semana=:week AND grupo=:group ORDER BY revisao DESC LIMIT 100""",week=semana,group=grupo)
    for record in records:
        record["atual"] = record["assinatura"] == current
    return records


@router.get("/emissoes/{emission_id}/pdf")
def download(emission_id:int,db:Session=Depends(get_db),user=Depends(require_roles(*READ))):
    authorize(db,user)
    result=db.execute(text("SELECT arquivo_pdf FROM public.armaduras_emissao WHERE id=:id"),{"id":emission_id}).first()
    if not result or not result[0]:
        raise HTTPException(404,"Emissão não encontrada")
    return Response(bytes(result[0]),media_type="application/pdf",headers={
        "Content-Disposition":f'attachment; filename="armaduras-emissao-{emission_id}.pdf"',"Cache-Control":"no-store"})
