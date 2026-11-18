"""Sector-3 annual serial registry. Forecasts never allocate production numbers."""
from __future__ import annotations

from collections import defaultdict
from datetime import date,datetime,timedelta
import re
from zoneinfo import ZoneInfo
import httpx
from fastapi import HTTPException
from sqlalchemy import text

from app.core.config import settings
from app.services.armaduras import canonical,fingerprint,rows,source


def today():return datetime.now(ZoneInfo('America/Sao_Paulo')).date()


def norm(value):return re.sub('[^A-Z0-9]','',str(value or '').upper())


def form_key(value):
    value=norm(value)
    if value in {'DT15','DTBM25'}:return 'DT15'
    match=re.fullmatch(r'SC0*(\d+)',value)
    return 'SC'+str(int(match[1])) if match else value


def catalog(db):
    return rows(db,"""SELECT p.id AS produto_id,p.nome,p.codigo,m.id AS modelo_id,m.descricao,m.chave
      FROM public.poste_serie_produto v JOIN public.produtos p ON p.id=v.produto_id
      JOIN public.poste_serie_modelo m ON m.id=v.modelo_id ORDER BY m.descricao,p.id""")


def audit(db,user,action,details):
    db.execute(text("""INSERT INTO public.poste_serie_auditoria(acao,usuario_id,detalhes)
      VALUES(:action,:user,CAST(:details AS jsonb))"""),{'action':action,'user':user.id,'details':canonical(details)})


def executed(start,end):
    if not settings.SUPABASE_URL or not settings.SUPABASE_ANON_KEY:
        raise HTTPException(503,'Fonte de produção do Mapa não configurada')
    headers={'apikey':settings.SUPABASE_ANON_KEY,'Authorization':'Bearer '+settings.SUPABASE_ANON_KEY}
    params={'select':'id,data_fabricacao,setor,forma,modelo,codigo_produto,status',
            'setor':'eq.Setor 3','status':'in.(LIBERADO,INSPECIONADO)',
            'and':f'(data_fabricacao.gte.{start.isoformat()},data_fabricacao.lte.{end.isoformat()})',
            'order':'data_fabricacao.asc,forma.asc,id.asc','limit':1000}
    result=[]
    try:
        with httpx.Client(timeout=25) as client:
            for offset in range(0,100000,1000):
                response=client.get(settings.SUPABASE_URL.rstrip('/')+'/rest/v1/'+settings.SUPABASE_PRODUCAO_TABLE,
                                    headers=headers,params={**params,'offset':offset})
                response.raise_for_status();batch=response.json()
                if not isinstance(batch,list):raise ValueError('Invalid production response')
                result.extend(batch)
                if len(batch)<1000:return result
        raise ValueError('Production source exceeded pagination limit')
    except (httpx.HTTPError,ValueError) as exc:
        raise HTTPException(503,'Não foi possível consultar a produção executada do Mapa; nenhum número foi atribuído') from exc


def resolve(item,products,plans):
    """Explicit source identity is confirmed; a generic SC gets a suggestion only."""
    name=norm(item.get('modelo'));code=str(item.get('codigo_produto') or '').strip()
    matches=[p for p in products if norm(p['nome'])==name and (not code or p['codigo']==code)]
    if not matches and name not in {'','SC','DT'}:
        matches=[p for p in products if norm(p['nome'])==name]
        if code and matches and len({p['modelo_id'] for p in matches})==1:
            return matches[0]['produto_id'],'codigo_divergente'
    if matches and len({p['modelo_id'] for p in matches})==1:
        return matches[0]['produto_id'],'modelo_explicito'
    if name in {'','SC','DT'} and code:
        matches=[p for p in products if p['codigo']==code]
        if matches and len({p['modelo_id'] for p in matches})==1:
            return matches[0]['produto_id'],'codigo_explicito'
    slot=(item['data_fabricacao'],form_key(item['forma']))
    options={p['produto_id'] for p in plans if (str(p['data']),form_key(p.get('codigo_forma')))==slot and p.get('produto_id')}
    if len(options)==1:return next(iter(options)),'sugestao_programacao_forma'
    return None,'modelo_pendente'


def counter(db,model,year,lock=False):
    if year>=2027:
        db.execute(text("""INSERT INTO public.poste_serie_contador(modelo_id,ano,saldo_inicial,data_base,ultimo_numero,motivo)
          VALUES(:model,:year,0,:base,0,'Reinício anual automático: primeiro número é 1') ON CONFLICT DO NOTHING"""),
          {'model':model,'year':year,'base':date(year,1,1)})
    result=rows(db,'SELECT * FROM public.poste_serie_contador WHERE modelo_id=:model AND ano=:year'+(' FOR UPDATE' if lock else ''),model=model,year=year)
    return result[0] if result else None


def assign(db,origin,product,user,resolution):
    existing=rows(db,'SELECT * FROM public.poste_serie_registro WHERE origem_id=:id',id=origin)
    if existing:
        if existing[0]['produto_id']!=product:raise HTTPException(409,'Este poste já possui série confirmada para outro modelo')
        return existing[0],False
    queue=rows(db,'SELECT * FROM public.poste_serie_execucao WHERE origem_id=:id FOR UPDATE',id=origin)
    if not queue:raise HTTPException(404,'Execução não encontrada; sincronize o Mapa')
    item=queue[0]
    model=rows(db,'SELECT modelo_id FROM public.poste_serie_produto WHERE produto_id=:id',id=product)
    if not model:raise HTTPException(422,'Produto não pertence ao cadastro de modelos do setor 3')
    model=model[0]['modelo_id'];day=item['data_fabricacao'];year=day.year
    if day>today():raise HTTPException(422,'Produção futura não pode receber série confirmada')
    current=counter(db,model,year,True)
    if not current:raise HTTPException(409,'Saldo inicial pendente para este modelo e ano')
    # January starts at zero before the first production of that year.
    if day<=current['data_base'] and not (current['saldo_inicial']==0 and current['data_base']==date(year,1,1) and day==current['data_base']):
        raise HTTPException(409,'Esta produção pertence ao período já coberto pelo saldo inicial')
    if earlier_pending(db,model,day,current['data_base']):
        raise HTTPException(409,'Existem execuções anteriores deste modelo ou de modelo desconhecido sem série. Confira primeiro os dias anteriores')
    number=current['ultimo_numero']+1
    db.execute(text('UPDATE public.poste_serie_contador SET ultimo_numero=:n,atualizado_em=now() WHERE modelo_id=:model AND ano=:year'),{'n':number,'model':model,'year':year})
    record=rows(db,"""INSERT INTO public.poste_serie_registro(origem_id,modelo_id,ano,numero,produto_id,data_fabricacao,forma,resolucao,origem_snapshot,registrado_por)
      VALUES(:origin,:model,:year,:n,:product,:day,:form,:resolution,CAST(:snapshot AS jsonb),:user) RETURNING *""",
      origin=origin,model=model,year=year,n=number,product=product,day=day,form=item['forma'],resolution=resolution,
      snapshot=canonical(item['origem_snapshot']),user=user.id)[0]
    db.execute(text('UPDATE public.poste_serie_execucao SET pendencia=NULL WHERE origem_id=:id'),{'id':origin})
    audit(db,user,'numero_atribuido',{'origem_id':str(origin),'modelo_id':model,'ano':year,'numero':number,'resolucao':resolution})
    return record,True


def earlier_pending(db,model,day,base):
    return bool(rows(db,"""SELECT e.origem_id FROM public.poste_serie_execucao e
      LEFT JOIN public.poste_serie_produto p ON p.produto_id=e.produto_sugerido
      WHERE e.data_fabricacao>:base AND e.data_fabricacao<:day
      AND extract(year FROM e.data_fabricacao)=:year
      AND (e.produto_sugerido IS NULL OR p.modelo_id=:model)
      AND NOT EXISTS(SELECT 1 FROM public.poste_serie_registro r WHERE r.origem_id=e.origem_id)
      LIMIT 1""",base=base,day=day,year=day.year,model=model))


def sync(db,start,end,user):
    end=min(end,today())
    if start>end:raise HTTPException(422,'O período de execução ainda não começou')
    if (end-start).days>366:raise HTTPException(422,'Sincronize no máximo um ano por vez')
    # Fetch the gap since the opening balance as well. Opening a later week must
    # not skip unimported production from the preceding weeks.
    if start.year>=2027:
        start=date(start.year,1,1)
    else:
        bases=rows(db,'SELECT min(data_base) AS base FROM public.poste_serie_contador WHERE ano=:year',year=start.year)
        if bases and bases[0]['base']:
            start=min(start,bases[0]['base']+timedelta(days=1))
    actual=sorted(executed(start,end),key=lambda r:(r['data_fabricacao'],form_key(r['forma']),str(r['id'])))
    db.execute(text('SELECT pg_advisory_xact_lock(20261111,3)'))
    db.execute(text("""INSERT INTO public.poste_serie_modelo(chave,descricao,codigo)
      SELECT upper(regexp_replace(nome,'[^a-zA-Z0-9]','','g')),min(nome),min(codigo)
      FROM public.produtos WHERE setor_id=3 GROUP BY upper(regexp_replace(nome,'[^a-zA-Z0-9]','','g'))
      ON CONFLICT(chave) DO NOTHING"""))
    db.execute(text("""INSERT INTO public.poste_serie_produto(produto_id,modelo_id)
      SELECT p.id,m.id FROM public.produtos p JOIN public.poste_serie_modelo m
      ON m.chave=upper(regexp_replace(p.nome,'[^a-zA-Z0-9]','','g')) WHERE p.setor_id=3
      ON CONFLICT(produto_id) DO NOTHING"""))
    products=catalog(db);plans=[p for p in source(db,start,end,'34') if p['setor_id']==3]
    assigned=0
    for item in actual:
        if item.get('setor')!='Setor 3' or item.get('status') not in {'LIBERADO','INSPECIONADO'}:continue
        day=date.fromisoformat(item['data_fabricacao'])
        if not start<=day<=end:continue
        product,resolution=resolve(item,products,plans)
        digest=fingerprint(item)
        previous=rows(db,'SELECT e.assinatura,r.id FROM public.poste_serie_execucao e LEFT JOIN public.poste_serie_registro r USING(origem_id) WHERE e.origem_id=:id',id=item['id'])
        if previous and previous[0]['id']:
            if previous[0]['assinatura']!=digest:
                db.execute(text("UPDATE public.poste_serie_execucao SET pendencia='Origem alterada após atribuição da série; conferir o registro' WHERE origem_id=:id"),{'id':item['id']})
            continue
        pending='Confirme o modelo produzido' if resolution not in {'modelo_explicito','codigo_explicito'} else 'Saldo inicial pendente'
        db.execute(text("""INSERT INTO public.poste_serie_execucao(origem_id,data_fabricacao,forma,modelo_origem,produto_sugerido,resolucao,origem_snapshot,assinatura,pendencia)
          VALUES(:id,:day,:form,:name,:product,:resolution,CAST(:snapshot AS jsonb),:hash,:pending)
          ON CONFLICT(origem_id) DO UPDATE SET produto_sugerido=EXCLUDED.produto_sugerido,
          data_fabricacao=EXCLUDED.data_fabricacao,forma=EXCLUDED.forma,modelo_origem=EXCLUDED.modelo_origem,
          resolucao=EXCLUDED.resolucao,origem_snapshot=EXCLUDED.origem_snapshot,assinatura=EXCLUDED.assinatura,
          pendencia=EXCLUDED.pendencia,atualizado_em=now()"""),
          {'id':item['id'],'day':day,'form':item['forma'],'name':item.get('modelo') or '',
           'product':product,'resolution':resolution,'snapshot':canonical(item),'hash':digest,'pending':pending})
        if product and resolution in {'modelo_explicito','codigo_explicito'}:
            model=next(p['modelo_id'] for p in products if p['produto_id']==product)
            current=counter(db,model,day.year)
            if current and (day>current['data_base'] or (current['saldo_inicial']==0 and current['data_base']==date(day.year,1,1) and day==current['data_base'])):
                if earlier_pending(db,model,day,current['data_base']):
                    db.execute(text("UPDATE public.poste_serie_execucao SET pendencia='Conferir execuções anteriores antes de atribuir a série' WHERE origem_id=:id"),{'id':item['id']})
                else:
                    _,created=assign(db,item['id'],product,user,resolution);assigned+=int(created)
    audit(db,user,'sincronizacao',{'inicio':start,'fim':end,'execucoes':len(actual),'numeros_atribuidos':assigned})
    db.commit()
    return {'execucoes':len(actual),'numeros_atribuidos':assigned,'inicio_consultado':start,'fim_consultado':end}


def ranges(numbers):
    result=[]
    for n in sorted(set(numbers)):
        if result and result[-1][1]+1==n:result[-1][1]=n
        else:result.append([n,n])
    return result


def forecast(db,start):
    if start.weekday()!=0:raise HTTPException(422,'Selecione uma segunda-feira')
    if start.year<2026 or start.year>2100:raise HTTPException(422,'Ano fora do intervalo 2026 a 2100')
    end=start+timedelta(days=5)
    products=catalog(db);product_map={p['produto_id']:p for p in products}
    model_map={p['modelo_id']:p for p in products}
    annual=rows(db,'SELECT * FROM public.poste_serie_contador WHERE ano BETWEEN :a AND :b',a=start.year,b=end.year)
    annual={(r['modelo_id'],r['ano']):r for r in annual}
    plans=[p for p in source(db,date(start.year,1,1),end,'34') if p['setor_id']==3 and p['data'].weekday()!=6]
    registered=rows(db,'SELECT * FROM public.poste_serie_registro WHERE ano BETWEEN :a AND :b ORDER BY data_fabricacao,numero',a=start.year,b=end.year)
    occupied={(r['data_fabricacao'],form_key(r['forma'])) for r in registered}
    counters={}
    days=[start+timedelta(days=i) for i in range(6)]
    lines={}
    def state(model,year):
        item=annual.get((model,year))
        if item:return item
        if year>=2027:return {'saldo_inicial':0,'ultimo_numero':0,'data_base':date(year,1,1),'revisao':0}
        return None
    def line(model,year):
        key=(model,year)
        if key not in lines:
            info=model_map[model];current=state(model,year)
            lines[key]={'modelo_id':model,'produto_id':info['produto_id'],'descricao':info['descricao'],'codigo':info['codigo'],
              'ano':year,'saldo_inicial':current['saldo_inicial'] if current else None,
              'data_base':current['data_base'] if current else None,'ultimo_confirmado':current['ultimo_numero'] if current else None,
              'proximo_confirmado':current['ultimo_numero']+1 if current else None,'pendencia_saldo':current is None,
              'dias':{str(d):{'programado':0,'confirmados':[],'previsao':[],'quantidade_prevista':0} for d in days if d.year==year}}
        return lines[key]
    for (model,year),c in annual.items():line(model,year)
    # A year without production still displays the reset counter for previously
    # tracked models; no old-year rows are changed or removed.
    if start.year>=2027:
        for row in rows(db,'SELECT DISTINCT modelo_id FROM public.poste_serie_contador'):
            line(row['modelo_id'],start.year)
    for row in registered:
        if start<=row['data_fabricacao']<=end:
            line(row['modelo_id'],row['ano'])['dias'][str(row['data_fabricacao'])]['confirmados'].append(row['numero'])
    for plan in sorted(plans,key=lambda p:(p['data'],form_key(p['codigo_forma']),p['id'])):
        info=product_map.get(plan['produto_id'])
        if not info:continue
        day=plan['data'];model=info['modelo_id'];key=(model,day.year);current=state(*key)
        if day<start and (not current or day<current['data_base']):continue
        entry=line(*key) if day>=start else None
        if entry:entry['dias'][str(day)]['programado']+=int(plan['quantidade'])
        if not current or (day<=current['data_base'] and not (current['saldo_inicial']==0 and current['data_base']==date(day.year,1,1) and day==current['data_base'])):continue
        if (day,form_key(plan['codigo_forma'])) in occupied:continue
        cursor=counters.get(key,current['ultimo_numero'])
        count=int(plan['quantidade']);first=cursor+1;last=cursor+count;counters[key]=last
        if entry:
            cell=entry['dias'][str(day)];cell['quantidade_prevista']+=count;cell['previsao'].extend(range(first,last+1))
    refs=rows(db,'SELECT * FROM public.poste_serie_referencia WHERE semana=:start',start=start)
    references={r['modelo_id']:r for r in refs}
    for item in lines.values():
        ref=references.get(item['modelo_id']);cursor=item['saldo_inicial'] or 0
        item['referencia_recebida']=[];item['diverge_referencia']=False
        for i,day in enumerate(days):
            cell=item['dias'].get(str(day))
            if cell:
                cell['quantidade_confirmada']=len(cell['confirmados']);cell['confirmados']=ranges(cell['confirmados']);cell['previsao']=ranges(cell['previsao'])
            if ref:
                qty=ref['quantidades'][i]
                item['referencia_recebida'].append({'data':day,'quantidade':qty,'inicio':cursor+1 if qty else None,'fim':cursor+qty if qty else None})
                cursor+=qty
                if cell and qty!=cell['programado']:item['diverge_referencia']=True
    pending=rows(db,"""SELECT count(*) FILTER(WHERE r.id IS NULL) AS quantidade,
      count(*) FILTER(WHERE r.id IS NOT NULL AND e.pendencia IS NOT NULL) AS divergencias,max(e.atualizado_em) AS ultima_sincronizacao
      FROM public.poste_serie_execucao e LEFT JOIN public.poste_serie_registro r USING(origem_id)
      WHERE e.data_fabricacao BETWEEN :start AND :end""",start=start,end=end)[0]
    return {'inicio':start,'fim':end,'dias':days,'linhas':sorted(lines.values(),key=lambda r:(r['descricao'],r['ano'])),
            'execucoes_pendentes':pending['quantidade'],'divergencias_execucao':pending['divergencias'],'ultima_sincronizacao':pending['ultima_sincronizacao'],
            'aviso':'Previsões não reservam números. Execuções sem modelo confirmado permanecem pendentes. Numeração reinicia por modelo e ano; primeiro número é 1.'}
