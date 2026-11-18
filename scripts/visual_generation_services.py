"""Provision parallel services; never overwrite/restart an existing published service."""
import hashlib,json,os,re,shlex,shutil,subprocess
from pathlib import Path
from urllib.parse import urlsplit
R=Path('/opt/concrefer-unificado');H=R/'homolog-next';S=H/'staging/visual-completo';G=H/'visual-full';G.mkdir(exist_ok=True)
E=Path('/etc/concrefer-unificado/homolog')
DB={'mapa':'mapa_visual_homolog_20261118','pcp':'pcp_visual_homolog_20261118','qualidade':'qualidade_visual_homolog_20261118','laboratorio':'laboratorio_visual_homolog_20261118','suprimentos':'suprimentos_visual_homolog_20261118','carta':'carta_traco_visual_homolog_20261118'}
def env(p):
 out={}
 if not Path(p).is_file():return out
 for line in Path(p).read_text().splitlines():
  try:a=shlex.split(line)
  except ValueError:continue
  if len(a)==1 and '=' in a[0]:k,v=a[0].split('=',1);out[k]=v
 return out
def combined(paths):
 out={}
 for p in paths:out.update(env(p))
 return out
mapa=combined([E/x for x in ['mapa-auth.env','mapa-writer.env','mapa-unified.env','mapa-lab.env','quality-gateway.env','usina.env','suprimentos-gateway.env']])
pcp=env(E/'pcp.env');quality=combined([E/'qualidade.env',E/'quality-gateway.env'])
lab=combined([Path('/etc/concrefer-unificado/laboratorio-homolog.env'),E/'mapa-lab.env',E/'quality-gateway.env'])
sup=combined([E/'suprimentos.env',E/'suprimentos-gateway.env'])
ports={13051:14151,13052:14152,13053:14153,13054:14154,13058:14158,13059:14159,13060:14160,13064:14164,13065:14164,13066:14166,13067:14169,13071:13171,13267:14167,13268:14168,13279:14179,3086:14186,13087:14185,3087:14187,3088:14188}
oldnames={'mapa_unificado_teste':DB['mapa'],'mapa_unificado_homolog_20261016':DB['mapa'],'pcp_unificado_teste':DB['pcp'],'pcp_unificado_homolog_20261016':DB['pcp'],'qualidade_homolog_20261016':DB['qualidade'],'concretrack_postes_homolog':DB['laboratorio'],'suprimentos_homolog_20261025':DB['suprimentos']}
def isolate(s):
 s=re.sub(r'https://concrefer\.concretrack\.com\.br(?!:)', 'https://concrefer.concretrack.com.br:18446',s)
 for old,new in oldnames.items():s=s.replace(old,new)
 for old,new in ports.items():s=s.replace('127.0.0.1:'+str(old),'127.0.0.1:'+str(new))
 s=s.replace('13058 if writing else 13051','14158 if writing else 14151')
 return s
def settings(data):
 out={k:isolate(v) for k,v in data.items()}
 for k in list(out):
  if re.search(r'SMTP|VAPID_PRIVATE|GOOGLE|SPREADSHEET|NF_PROVIDER_KEY|NF_PROVIDER_URL',k):out[k]=''
 return out
def dsn(original,name):
 value=re.sub(r'/[^/?]+(?=\?|$)','/'+name,original,count=1)
 u=urlsplit(value.replace('postgresql+psycopg://','postgresql://'));assert u.hostname in ('localhost','127.0.0.1') and u.path=='/'+name
 return value
def sa(value):return value.replace('postgresql://','postgresql+psycopg://',1)
mapa=settings(mapa);pcp=settings(pcp);quality=settings(quality);lab=settings(lab);sup=settings(sup)
# Preserve each existing isolated cookie name rather than creating cross-port cookies.
old_app=(H/'mapa-api/app.py').read_text();cookie_values={}
for k,v in re.findall(r'^(\w*COOKIE_NAME)\s*=\s*[\x22\x27]([^\x22\x27]+)',old_app,re.M):cookie_values[k]=v
mapa['USINAS_REPORTING_API_URL']='http://127.0.0.1:14187/api/'
mapa['SUPRIMENTOS_INTERNAL_URL']='http://127.0.0.1:14167'
# Exact published on/off flags, constrained to these two local-only features.
raw_unit=subprocess.check_output(['systemctl','cat','mapa-unificado-auth.service'],text=True)
for flag,value in re.findall(r'(USINAS_NOROESTE(?:_ESTOQUE_WRITE)?_ENABLED)=([01])',raw_unit):mapa[flag]=value
lab.update({'DATABASE_URL':dsn(lab['DATABASE_URL'],DB['laboratorio']),'LAB_UNIFIED_COPY':'1','LAB_GATEWAY_SIGNING_KEY':mapa['LAB_GATEWAY_SIGNING_KEY'],'QUALIDADE_GATEWAY_SIGNING_KEY':mapa['QUALIDADE_GATEWAY_SIGNING_KEY'],'DATA_DIR':str(G/'laboratorio/data'),'POSTES_UPLOAD_DIR':str(G/'laboratorio/uploads'),'POSTES_PUBLIC_ORIGIN':'https://concrefer.concretrack.com.br:18446','POSTES_CERTIFICATE_ORIGIN':'https://concrefer.concretrack.com.br:18446'})
quality.update({'QUALIDADE_EXPECTED_DATABASE':DB['qualidade'],'QUALIDADE_UPLOAD_DIR':str(G/'qualidade/uploads')})
sup.update({'SUPRIMENTOS_EXPECTED_DATABASE':DB['suprimentos'],'SUPRIMENTOS_UPLOAD_DIR':str(G/'suprimentos/uploads'),'SUPRIMENTOS_PUBLIC_DIR':str(H/'public/unificado/suprimentos')})
base_sql=dsn(pcp['DATABASE_URL'],DB['pcp']);map_sql=dsn(mapa['MAPA_AUTH_DATABASE_URL'],DB['mapa'])
log={'LOGISTICA_DATABASE_URL':sa(base_sql),'LOGISTICA_IAM_DATABASE_URL':sa(map_sql),'LOGISTICA_MAPA_SIGNING_KEY':mapa['MAPA_AUTH_SIGNING_KEY'],'LOGISTICA_ORIGIN':'https://concrefer.concretrack.com.br:18446','LOGISTICA_STORAGE':str(G/'logistica/storage')}
dos={'AMBIENTE':'hml','DATABASE_URL':sa(map_sql),'DATABASE_SCHEMA':'dosagem','MODO_PILOTO':'true','LAB_GATEWAY_SIGNING_KEY':mapa['LAB_GATEWAY_SIGNING_KEY'],'SUPABASE_URL':'','SUPABASE_ANON_KEY':''}
arm={'ARMACAO_DATABASE_URL':sa(base_sql),'ARMACAO_IAM_DATABASE_URL':sa(map_sql),'ARMACAO_MAPA_SIGNING_KEY':mapa['MAPA_AUTH_SIGNING_KEY'],'ARMACAO_ORIGIN':'https://concrefer.concretrack.com.br:18446','ARMACAO_PRIVATE_STORAGE':str(G/'armacao/storage')}
report={'USINAS_REPORTING_DATABASE_URL':map_sql,'MAPA_USINA_INTEGRATION_KEY':mapa.get('MAPA_USINA_INTEGRATION_KEY',''),'USINAS_REPORTING_SUPABASE_KEY':''}
cq={**lab,'CQ_DATA_DIR':str(G/'cq/data'),'CQ_HOMOLOG_BASE':'https://concrefer.concretrack.com.br:18446','CQ_VERIFY_BASE':'https://concrefer.concretrack.com.br:18446/v/','CQ_CP_NEW_URL':'https://concrefer.concretrack.com.br:18446/unificado/laboratorio/novo/postes/','CQ_ALLOWED_ORIGIN':'https://concrefer.concretrack.com.br:18446','CQ_LOGO_PATH':str(H/'public/unificado/assets/img/logo-concrefer.png')}
carta=combined([Path('/etc/concrefer/carta-traco-staging.env'),Path('/etc/concrefer/carta-traco-gateway.env'),Path('/etc/concrefer/carta-traco-pede.env')]);carta=settings(carta)
carta['CARTA_TRACO_DATABASE_URL']=dsn(map_sql,DB['carta'])
hub=env(E/'hub.env')
if 'CARTA_TRACO_PEDE_DATABASE_URL' in carta:
 assert 'PEDERNEIRAS_DATABASE_URL' in hub
 carta['CARTA_TRACO_PEDE_DATABASE_URL']=hub['PEDERNEIRAS_DATABASE_URL']
carta['LAB_GATEWAY_SIGNING_KEY']=mapa['LAB_GATEWAY_SIGNING_KEY']
modules={
 'mapa':(R/'mapa-api',R/'mapa-api/.venv',14152,'gunicorn --workers 2 --bind 127.0.0.1:14152 app:app',mapa),
 'pcp':(R/'pcp-api',H/'pcp-api/.venv-py310',14154,'uvicorn app.main:app --host 127.0.0.1 --port 14154',pcp),
 'qualidade':(Path('/opt/qualidade/service'),Path('/opt/qualidade/.venv'),14166,'uvicorn quality.main:app --host 127.0.0.1 --port 14166',quality),
 'laboratorio':(R/'laboratorio/service',Path('/opt/monitor_concreto/.venv'),14164,'uvicorn server.app:app --host 127.0.0.1 --port 14164 --no-proxy-headers',lab),
 'cq':(R/'cq',Path('/opt/monitor_concreto/.venv'),14175,'uvicorn app:app --host 127.0.0.1 --port 14175 --no-proxy-headers',cq),
 'suprimentos':(R/'suprimentos/service',R/'suprimentos/venv',14167,'uvicorn suprimentos.main:app --host 127.0.0.1 --port 14167',sup),
 'logistica':(R/'logistica-api',R/'logistica-api/.venv',14179,'uvicorn logistica.main:app --host 127.0.0.1 --port 14179',log),
 'dosagem':(R/'dosagem-native/api',R/'dosagem-native/api/.venv',14169,'uvicorn app.main:app --host 127.0.0.1 --port 14169 --proxy-headers --forwarded-allow-ips 127.0.0.1',dos),
 'armacao':(R/'armacao-api',R/'armacao-api/.venv',14168,'uvicorn armacao.main:app --host 127.0.0.1 --port 14168',arm),
 'reporting':(R/'usinas',R/'usinas/reporting-venv',14187,'uvicorn reporting_service.app:app --host 127.0.0.1 --port 14187',report),
 'carta':(R/'homolog/laboratorio/carta_traco_api',R/'homolog/laboratorio/carta_traco_api/carta-venv',14188,'uvicorn carta_traco_service.app:app --host 127.0.0.1 --port 14188',carta),
}
def copy_ignore(base,names):
 return [n for n in names if any(k in n.lower() for k in ['venv','node_modules','__pycache__','.before','backup','private','uploads','.env','.git','python-runtimes']) or n.endswith(('.dump','.tgz','.log','.bak','.key')) or n in ['data','reports','output']]
results=[]
for name,(src,venv,port,command,conf) in modules.items():
 marker=S/(name+'-provisioned.json')
 if marker.exists():results.append(json.loads(marker.read_text()));continue
 dest=G/name;dest.mkdir(exist_ok=True)
 if name=='pcp':
  for folder in ['app','alembic']:shutil.copytree(src/folder,dest/folder,dirs_exist_ok=True,ignore=copy_ignore)
  # These are versioned application catalogs, not operational data directories.
  for catalog in (src/'app/data').glob('*.json'):
   (dest/'app/data').mkdir(parents=True,exist_ok=True);shutil.copy2(catalog,dest/'app/data'/catalog.name)
  for filename in ['requirements.txt','alembic.ini']:
   if (src/filename).exists():shutil.copy2(src/filename,dest/filename)
 else:shutil.copytree(src,dest,dirs_exist_ok=True,ignore=copy_ignore)
 changes=[]
 for p in dest.rglob('*.py'):
  if '.venv' in p.parts:continue
  old=p.read_text();new=isolate(old)
  if name=='mapa' and p.name=='app.py':
   for key,value in cookie_values.items():new=re.sub(r'(?m)^('+key+r'\s*=\s*)[\x22\x27][^\x22\x27]+[\x22\x27]',lambda m:m[1]+repr(value),new)
  if name in ('mapa','laboratorio','cq'):
   for oldcookie,newcookie in [('mapa_unificado_session',cookie_values.get('COOKIE_NAME','mapa_unificado_homolog_session')),('unificado_laboratorio_session',cookie_values.get('LAB_COOKIE_NAME','unificado_homolog_laboratorio_session')),('unificado_qualidade_session',cookie_values.get('QUALITY_COOKIE_NAME','unificado_homolog_qualidade_session'))]:new=new.replace(oldcookie,newcookie)
  if new!=old:p.write_text(new);changes.append(str(p.relative_to(dest)))
 # Installed package bytes are copied read-only from the published Python env.
 lib=next((venv/'lib').glob('python*'));version=lib.name.removeprefix('python')
 py=venv/'bin/python';base=py.resolve()
 if not (dest/'.venv/bin/python').exists():subprocess.run([str(base),'-m','venv',str(dest/'.venv')],check=True,capture_output=True)
 site=dest/'.venv/lib'/lib.name/'site-packages'
 shutil.copytree(lib/'site-packages',site,dirs_exist_ok=True,ignore=shutil.ignore_patterns('__pycache__','__editable__*'))
 for p in site.glob('*.pth'):
  content=p.read_text(errors='replace')
  assert not re.search(r'^/opt/',content,re.M),('Production editable import',p.name)
 for folder in ['data','uploads','storage','home']:(dest/folder).mkdir(exist_ok=True)
 conf={**conf,'HOME':str(dest/'home'),'PYTHONUNBUFFERED':'1'}
 for k,v in conf.items():
  if ('DATABASE_URL' in k or k.endswith('_DSN')) and v:
   u=urlsplit(v.replace('postgresql+psycopg://','postgresql://'))
   assert u.hostname in ('localhost','127.0.0.1') and '_homolog' in u.path,(name,k,'Unsafe DSN')
  if re.search(r'SMTP|VAPID_PRIVATE|SPREADSHEET|GOOGLE|NF_PROVIDER_(KEY|URL)',k):assert not v,(name,k,'External writer enabled')
 ef=E/('visual-'+name+'.env');ef.write_text(''.join(k+'='+shlex.quote(v)+'\n' for k,v in conf.items()));ef.chmod(0o600)
 unit='unificado-visual-homolog-'+name+'.service';uf=Path('/etc/systemd/system')/unit
 uf.write_text('[Unit]\nDescription=Unificado visual homolog '+name+' isolated service\nAfter=postgresql.service\n[Service]\nWorkingDirectory='+str(dest)+'\nEnvironmentFile='+str(ef)+'\nExecStart='+str(dest/'.venv/bin/python')+' -m '+command+'\nRestart=on-failure\nRestartSec=3\nNoNewPrivileges=true\nPrivateTmp=true\nProtectHome=true\nProtectSystem=strict\nReadWritePaths='+str(G)+'\nIPAddressDeny=any\nIPAddressAllow=localhost\n[Install]\nWantedBy=multi-user.target\n')
 subprocess.run(['systemctl','daemon-reload'],check=True);subprocess.run(['systemctl','start',unit],check=True)
 result={'module':name,'service':unit,'port':port,'source':str(src),'destination':str(dest),'python':version,'isolation_adapted_files':changes,'production_service_restarted':False}
 marker.write_text(json.dumps(result,indent=2));results.append(result);print(json.dumps(result),flush=True)
(S/'generation-services.json').write_text(json.dumps(results,indent=2))
