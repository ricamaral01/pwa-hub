"""Exercise the existing request lifecycle using existing isolated test accounts."""
import json,requests
from datetime import datetime,timezone
from pathlib import Path
from homolog_session import test_cookie_for
BASE='https://concrefer.concretrack.com.br:18446';ROOT=Path(__file__).resolve().parents[2]
events=[]
def session(user):
 s=requests.Session();s.cookies.set('mapa_unificado_homolog_session',test_cookie_for(user),domain='concrefer.concretrack.com.br',path='/unificado/')
 r=s.get(BASE+'/unificado/suprimentos/session-renew',timeout=20);assert r.status_code==200,(user,r.status_code)
 return s
def call(s,method,path,payload=None):
 r=s.request(method,BASE+'/api/suprimentos'+path,json=payload,headers={'Origin':BASE},timeout=25)
 assert r.status_code in (200,201),(method,path,r.status_code,r.text[:400])
 events.append({'method':method,'path':path,'status':r.status_code});return r.json()
sol=session('e2e-suprimentos-sol');approvers=[session('e2e-suprimentos-aprov1'),session('e2e-suprimentos-aprov2')];alm=session('e2e-suprimentos-almox')
centers=call(sol,'GET','/cadastros/centros-custo?size=100')['items'];cc=next(x for x in centers if x['codigo']=='E2E-SUP')
measures=call(sol,'GET','/cadastros/unidades-medida?size=100')['items'];unit=next(x for x in measures if x['ativo'])
label='HOMOLOG visual fase 3 '+datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')
row=call(sol,'POST','/solicitacoes',{'cc_id':cc['id'],'urgencia':'NORMAL','justificativa':label,'itens':[{'descricao_livre':label,'qtd':1,'un':unit['id']}]})
id=row['id'];call(sol,'POST',f'/solicitacoes/{id}/enviar',{})
for s in approvers:
 current=call(sol,'GET',f'/solicitacoes/{id}')
 if current['status']=='EM_APROVACAO':call(s,'POST',f'/solicitacoes/{id}/aprovar',{'comentario':label})
current=call(sol,'GET',f'/solicitacoes/{id}');assert current['status']=='APROVADA',current['status']
item=current['itens'][0]['id'];call(alm,'POST',f'/itens/{item}/separar',{});call(alm,'POST',f'/itens/{item}/entregar',{'qtd':1})
call(sol,'POST',f'/solicitacoes/{id}/confirmar-recebimento',{})
current=call(sol,'GET',f'/solicitacoes/{id}');assert current['status']=='CONCLUIDA'
out={'test_origin':BASE,'request_id':id,'number':current['numero'],'label':label,'final_status':current['status'],'existing_roles':['SOLICITANTE','APROVADOR nível 1','APROVADOR nível 2','ALMOXARIFE'],'events':events,'permission_assignments_changed':False}
(ROOT/'docs/revisao-visual-unificado/homolog/fase-3/flow-results.json').write_text(json.dumps(out,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'number':current['numero'],'status':current['status'],'calls':len(events)}))
