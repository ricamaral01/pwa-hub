"""Probe only the parallel test services with ephemeral test credentials."""
import json,shlex,urllib.request,urllib.error
from pathlib import Path
from urllib.parse import urlsplit
import psycopg
from psycopg.rows import dict_row
from itsdangerous import URLSafeTimedSerializer
S=Path('/opt/concrefer-unificado/homolog-next/staging/visual-completo');E=Path('/etc/concrefer-unificado/homolog')
def env(p):
 out={}
 for l in Path(p).read_text().splitlines():
  a=shlex.split(l)
  if len(a)==1 and '=' in a[0]:k,v=a[0].split('=',1);out[k]=v
 return out
conf=env(E/'visual-mapa.env');dsn=conf['MAPA_AUTH_DATABASE_URL'];assert urlsplit(dsn).path=='/mapa_visual_homolog_20261118'
with psycopg.connect(dsn,row_factory=dict_row) as db:
 db.execute('SET TRANSACTION READ ONLY');u=db.execute("SELECT id,updated_at FROM public.usuarios WHERE id='user-ricardo' AND ativo").fetchone()
cookie=URLSafeTimedSerializer(conf['MAPA_AUTH_SIGNING_KEY'],salt='mapa-login-v1').dumps({'scope':'session','id':u['id'],'updated_at':u['updated_at'].isoformat()})
base={'Host':'concrefer.concretrack.com.br:18446','Origin':'https://concrefer.concretrack.com.br:18446','Cookie':'mapa_unificado_homolog_session='+cookie}
def call(port,path,headers=None):
 req=urllib.request.Request('http://127.0.0.1:'+str(port)+path,headers={**base,**(headers or {})})
 try:
  with urllib.request.urlopen(req,timeout=12) as r:return r.status,r.read(),dict(r.headers)
 except urllib.error.HTTPError as e:return e.code,e.read(),dict(e.headers)
results=[]
for path in ['/me','/unified/screen-access/me','/unified/quick-access/me','/unified/users/catalog']:
 status,data,_=call(14152,path);results.append({'module':'mapa','path':path,'status':status,'error':data.decode(errors='replace')[:200] if status>=400 else None})
status,data,_=call(14152,'/unified/pcp-session');results.append({'module':'mapa','path':'/unified/pcp-session','status':status})
if status==200:
 token=json.loads(data)['access_token']
 for path,screen in [('/api/setores','dashboard'),('/api/programacao-semanal?semana=2030-01-07','programacaoSemanal12'),('/api/postes-series/previsao?semana=2030-01-07','postesNumerosSerie')]:
  st,b,_=call(14154,path,{'Authorization':'Bearer '+token,'X-Unificado-Screen':screen});results.append({'module':'pcp','path':path,'status':st,'error':b.decode(errors='replace')[:200] if st>=400 else None})
for port,name in [(14164,'laboratorio'),(14175,'cq'),(14166,'qualidade'),(14167,'suprimentos'),(14179,'logistica'),(14169,'dosagem'),(14168,'armacao'),(14187,'reporting'),(14188,'carta')]:
 st,b,_=call(port,'/openapi.json');paths=list(json.loads(b).get('paths',{})) if st==200 else []
 results.append({'module':name,'openapi_status':st,'route_count':len(paths),'sample_routes':[p for p in paths if any(x in p for x in ('health','catalog','context','unidades','traco'))][:12]})
(S/'generation-smoke.json').write_text(json.dumps(results,indent=2));print(json.dumps(results))
