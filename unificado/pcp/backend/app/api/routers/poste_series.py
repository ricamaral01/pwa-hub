"""Traceable annual serial numbers for Sector 3 only."""
from datetime import date,datetime
from typing import List,Literal
from zoneinfo import ZoneInfo
from uuid import UUID

from fastapi import APIRouter,Depends,HTTPException,Query
from fastapi.responses import Response
from pydantic import BaseModel,Field
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import require_roles
from app.models.usuario import NivelAcesso
from app.api.routers.armaduras import authorize,READ
from app.services import poste_series as service
from app.services import poste_series_report as reports
from app.services.armaduras import canonical,rows

router=APIRouter(prefix='/api/postes-series',tags=['postes-series'])


def access(db,user,write=False):
    authorize(db,user)
    if write and user.nivel_acesso not in {NivelAcesso.ADMIN,NivelAcesso.PCP,NivelAcesso.PRODUCAO}:
        raise HTTPException(403,'Seu perfil permite somente consultar as séries')


class SyncInput(BaseModel):
    inicio:date
    fim:date


class ConfirmItem(BaseModel):
    origem_id:UUID
    produto_id:int=Field(gt=0)


class ConfirmInput(BaseModel):
    itens:List[ConfirmItem]=Field(min_length=1,max_length=500)


class BalanceInput(BaseModel):
    modelo_id:int=Field(gt=0)
    ano:int=Field(ge=2026,le=2100)
    saldo_inicial:int=Field(ge=0,le=100000000)
    data_base:date
    motivo:str=Field(min_length=5,max_length=1000)
    revisao:int=Field(ge=0)


class ReportInput(BaseModel):
    semana:date
    escopo:Literal['dia','semana']='dia'
    dia:date|None=None
    modo:Literal['previsao','confirmados']='previsao'
    assinatura:str=Field(min_length=64,max_length=64)


@router.get('/relatorio')
def report_preview(semana:date,escopo:Literal['dia','semana']='dia',dia:date|None=None,
                   modo:Literal['previsao','confirmados']='previsao',
                   db:Session=Depends(get_db),user=Depends(require_roles(*READ))):
    access(db,user)
    data=service.forecast(db,semana)
    return {'relatorio':reports.build(data,escopo,dia,modo),'previsao':data}


@router.post('/emissoes',status_code=201)
def issue_report(body:ReportInput,db:Session=Depends(get_db),user=Depends(require_roles(*READ))):
    access(db,user)
    db.execute(text('SELECT pg_advisory_xact_lock(20261111,3)'))
    db.execute(text('LOCK TABLE public.programacoes_circular_s3,public.produtos IN SHARE MODE'))
    snapshot=reports.build(service.forecast(db,body.semana),body.escopo,body.dia,body.modo)
    if snapshot['assinatura']!=body.assinatura:
        raise HTTPException(409,'A numeração ou a programação mudou. Atualize a consulta antes de gerar o PDF')
    if not snapshot['linhas']:raise HTTPException(409,'Não há séries confirmadas neste período' if body.modo=='confirmados' else 'Não há produção programada neste período')
    day=body.dia if body.escopo=='dia' else None
    revision=rows(db,"""SELECT COALESCE(max(revisao),0)+1 AS revisao FROM public.poste_serie_emissao
      WHERE semana=:week AND escopo=:scope AND dia IS NOT DISTINCT FROM CAST(:day AS date) AND modo=:mode""",
      week=body.semana,scope=body.escopo,day=day,mode=body.modo)[0]['revisao']
    report_id=db.execute(text("SELECT nextval('public.poste_serie_emissao_id_seq')")).scalar_one()
    created=datetime.now(ZoneInfo('America/Sao_Paulo'))
    emission={'id':report_id,'revisao':revision,'responsavel':user.nome,'criado_em':created}
    content=reports.pdf(snapshot,emission)
    db.execute(text("""INSERT INTO public.poste_serie_emissao(id,semana,escopo,dia,modo,revisao,assinatura,snapshot,
      arquivo_pdf,responsavel,criado_por,criado_em)
      VALUES(:id,:week,:scope,:day,:mode,:revision,:hash,CAST(:snapshot AS jsonb),:pdf,:name,:user,:created)"""),
      {'id':report_id,'week':body.semana,'scope':body.escopo,'day':day,'mode':body.modo,'revision':revision,
       'hash':snapshot['assinatura'],'snapshot':canonical(snapshot),'pdf':content,'name':user.nome,'user':user.id,'created':created})
    service.audit(db,user,'pdf_series_emitido',{'emissao_id':report_id,'semana':body.semana,'dia':day,'modo':body.modo,'assinatura':snapshot['assinatura']})
    db.commit()
    return emission


@router.get('/emissoes')
def report_history(semana:date,db:Session=Depends(get_db),user=Depends(require_roles(*READ))):
    access(db,user)
    return rows(db,"""SELECT id,semana,escopo,dia,modo,revisao,responsavel,criado_em FROM public.poste_serie_emissao
      WHERE semana=:week ORDER BY id DESC LIMIT 100""",week=semana)


@router.get('/emissoes/{report_id}/pdf')
def report_download(report_id:int,db:Session=Depends(get_db),user=Depends(require_roles(*READ))):
    access(db,user)
    record=db.execute(text('SELECT arquivo_pdf FROM public.poste_serie_emissao WHERE id=:id'),{'id':report_id}).first()
    if not record:raise HTTPException(404,'Relatório de séries não encontrado')
    return Response(bytes(record[0]),media_type='application/pdf',headers={
        'Content-Disposition':f'attachment; filename="series-setor-3-emissao-{report_id}.pdf"','Cache-Control':'no-store'})


@router.get('/catalogo')
def catalog(db:Session=Depends(get_db),user=Depends(require_roles(*READ))):
    access(db,user)
    return service.catalog(db)


@router.get('/previsao')
def preview(semana:date,db:Session=Depends(get_db),user=Depends(require_roles(*READ))):
    access(db,user)
    return service.forecast(db,semana)


@router.get('/saldos')
def balances(ano:int=Query(...,ge=2026,le=2100),db:Session=Depends(get_db),user=Depends(require_roles(*READ))):
    access(db,user)
    return rows(db,"""SELECT m.id AS modelo_id,m.descricao,m.codigo,c.ano,c.saldo_inicial,c.ultimo_numero,
      c.data_base,COALESCE(c.revisao,0) AS revisao,c.motivo,
      EXISTS(SELECT 1 FROM public.poste_serie_registro r WHERE r.modelo_id=m.id AND r.ano=:year) AS possui_registros
      FROM public.poste_serie_modelo m LEFT JOIN public.poste_serie_contador c ON c.modelo_id=m.id AND c.ano=:year
      ORDER BY m.descricao""",year=ano)


@router.post('/saldos')
def save_balance(body:BalanceInput,db:Session=Depends(get_db),user=Depends(require_roles(*READ))):
    access(db,user,True)
    if user.nivel_acesso not in {NivelAcesso.ADMIN,NivelAcesso.PCP}:
        raise HTTPException(403,'Somente Planejamento pode definir saldos iniciais')
    if body.data_base.year!=body.ano or body.data_base>service.today():
        raise HTTPException(422,'A data de corte deve pertencer ao ano informado e não pode ser futura')
    if len(body.motivo.strip())<5:raise HTTPException(422,'Descreva o motivo do saldo inicial')
    db.execute(text('SELECT pg_advisory_xact_lock(20261111,3)'))
    if not rows(db,'SELECT id FROM public.poste_serie_modelo WHERE id=:id',id=body.modelo_id):
        raise HTTPException(404,'Modelo não encontrado')
    if rows(db,'SELECT id FROM public.poste_serie_registro WHERE modelo_id=:model AND ano=:year LIMIT 1',model=body.modelo_id,year=body.ano):
        raise HTTPException(409,'Saldo inicial bloqueado: já existem séries confirmadas neste ano. Os números não podem ser renumerados')
    before=rows(db,'SELECT * FROM public.poste_serie_contador WHERE modelo_id=:model AND ano=:year FOR UPDATE',model=body.modelo_id,year=body.ano)
    if (before[0]['revisao'] if before else 0)!=body.revisao:raise HTTPException(409,'Saldo alterado por outra pessoa; atualize a tela')
    db.execute(text("""INSERT INTO public.poste_serie_contador(modelo_id,ano,saldo_inicial,data_base,ultimo_numero,motivo,atualizado_por)
      VALUES(:model,:year,:balance,:base,:balance,:reason,:user)
      ON CONFLICT(modelo_id,ano) DO UPDATE SET saldo_inicial=EXCLUDED.saldo_inicial,ultimo_numero=EXCLUDED.ultimo_numero,
      data_base=EXCLUDED.data_base,motivo=EXCLUDED.motivo,atualizado_por=EXCLUDED.atualizado_por,
      atualizado_em=now(),revisao=poste_serie_contador.revisao+1"""),
      {'model':body.modelo_id,'year':body.ano,'balance':body.saldo_inicial,'base':body.data_base,'reason':body.motivo.strip(),'user':user.id})
    service.audit(db,user,'saldo_inicial',{'antes':before,'depois':body.model_dump()})
    db.commit()
    return {'ok':True}


@router.post('/sincronizar')
def sync(body:SyncInput,db:Session=Depends(get_db),user=Depends(require_roles(*READ))):
    access(db,user,True)
    return service.sync(db,body.inicio,body.fim,user)


@router.get('/execucoes')
def pending(inicio:date,fim:date,db:Session=Depends(get_db),user=Depends(require_roles(*READ))):
    access(db,user)
    if not 0<=(fim-inicio).days<=366:raise HTTPException(422,'Consulte até um ano de execução')
    return rows(db,"""SELECT e.origem_id,e.data_fabricacao,e.forma,e.modelo_origem,e.produto_sugerido,e.resolucao,
      e.pendencia,r.id AS registro_id,r.numero,r.ano,m.descricao AS modelo_confirmado
      FROM public.poste_serie_execucao e LEFT JOIN public.poste_serie_registro r USING(origem_id)
      LEFT JOIN public.poste_serie_modelo m ON m.id=r.modelo_id
      WHERE e.data_fabricacao BETWEEN :start AND :end ORDER BY e.data_fabricacao,e.forma,e.origem_id LIMIT 5000""",start=inicio,end=fim)


@router.post('/confirmar')
def confirm(body:ConfirmInput,db:Session=Depends(get_db),user=Depends(require_roles(*READ))):
    access(db,user,True)
    unique={str(item.origem_id):item for item in body.itens}
    queue=[]
    for origin in sorted(unique):
        found=rows(db,'SELECT * FROM public.poste_serie_execucao WHERE origem_id=:id',id=origin)
        if not found:raise HTTPException(404,'Execução não encontrada; sincronize o Mapa')
        queue.extend(found)
    actual={str(r['id']):r for r in service.executed(min(q['data_fabricacao'] for q in queue),max(q['data_fabricacao'] for q in queue))}
    for item in queue:
        current=actual.get(str(item['origem_id']))
        if not current or current['data_fabricacao']!=str(item['data_fabricacao']) or service.form_key(current['forma'])!=service.form_key(item['forma']):
            raise HTTPException(409,'A execução do Mapa mudou; sincronize antes de confirmar as séries')
        if current.get('modelo')!=item['modelo_origem'] or current.get('codigo_produto')!=item['origem_snapshot'].get('codigo_produto'):
            raise HTTPException(409,'O modelo da execução mudou; sincronize antes de confirmar')
    db.execute(text('SELECT pg_advisory_xact_lock(20261111,3)'))
    result=[];created=0
    for item in sorted(queue,key=lambda q:(q['data_fabricacao'],service.form_key(q['forma']),str(q['origem_id']))):
        chosen=unique[str(item['origem_id'])]
        record,new=service.assign(db,item['origem_id'],chosen.produto_id,user,'modelo_conferido_pelo_operador')
        result.append({'id':record['id'],'ano':record['ano'],'numero':record['numero'],'modelo_id':record['modelo_id']});created+=int(new)
    db.commit()
    return {'novos':created,'registros':result}


@router.get('/registros')
def records(ano:int=Query(...,ge=2026,le=2100),modelo_id:int|None=None,
            limite:int=Query(200,ge=1,le=1000),offset:int=Query(0,ge=0),
            db:Session=Depends(get_db),user=Depends(require_roles(*READ))):
    access(db,user)
    return rows(db,"""SELECT r.id,r.origem_id,r.modelo_id,r.ano,r.numero,r.data_fabricacao,r.forma,r.resolucao,
      r.registrado_em,m.descricao,m.codigo,u.nome AS registrado_por,e.pendencia
      FROM public.poste_serie_registro r JOIN public.poste_serie_modelo m ON m.id=r.modelo_id
      JOIN public.poste_serie_execucao e ON e.origem_id=r.origem_id
      LEFT JOIN public.usuarios u ON u.id=r.registrado_por
      WHERE r.ano=:year AND (:model IS NULL OR r.modelo_id=:model)
      ORDER BY r.registrado_em DESC,r.id DESC LIMIT :limit OFFSET :offset""",year=ano,model=modelo_id,limit=limite,offset=offset)
