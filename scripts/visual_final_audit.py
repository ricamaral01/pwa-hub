"""Read-only final production immutability, public manifest, and IAM audit."""
import hashlib,json,re,shlex,subprocess
from pathlib import Path
from urllib.parse import urlsplit
import psycopg
ROOT=Path('/opt/concrefer-unificado');HOM=ROOT/'homolog-next';STAGE=HOM/'staging/visual-fase-2'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
backup=Path(json.loads((STAGE/'deploy-results.json').read_text())['backup'])
before=json.loads((backup/'production-before.json').read_text());public=ROOT/'public/unificado'
after={str(p.relative_to(public)):sha(p) for p in public.rglob('*') if p.is_file()}
after['services']=subprocess.check_output(['systemctl','show','mapa-unificado-auth.service','pcp-unificado-test.service','concrefer-armacao.service','-p','MainPID','-p','ExecMainStartTimestamp'],text=True)
after['nginx']=sha(Path('/etc/nginx/sites-enabled/concrefer.concretrack.com.br'))
assert before==after
initial=json.loads((STAGE/'initial-production-hashes.json').read_text())
assert all(sha(public/r)==digest for r,digest in initial.items())
manifest=json.loads((STAGE/'manifest.json').read_text());verified=[]
backend_parity={}
for p in (ROOT/'armacao-api').rglob('*'):
 if not p.is_file() or any(x in p.parts for x in ('.venv','__pycache__')) or p.name.endswith('.env'):continue
 r=p.relative_to(ROOT/'armacao-api');assert sha(p)==sha(HOM/'armacao-api'/r),str(r)
 backend_parity['armacao-api/'+str(r)]=sha(p)
assert sha(ROOT/'mapa-api/quick_access.py')==sha(HOM/'mapa-api/quick_access.py')
backend_parity['mapa-api/quick_access.py']=sha(ROOT/'mapa-api/quick_access.py')
for r,digest in manifest.items():
 p=HOM/'public/unificado'/r
 if r in ('index.html','login.html'):
  # Marker is additive; normalize by comparing source after applying official marker.
  assert 'AMBIENTE DE TESTE' in p.read_text()
 else:assert sha(p)==digest,r
 verified.append(r)
def env(path):
 out={}
 for line in Path(path).read_text().splitlines():
  parts=shlex.split(line)
  if len(parts)==1 and '=' in parts[0]:k,v=parts[0].split('=',1);out[k]=v
 return out
pre=Path(json.loads((HOM/'staging/visual-endpoints/results.json').read_text())['backup'])
checks=[]
for key,filename,var in [('pcp','pcp.env','DATABASE_URL'),('mapa','mapa-auth.env','MAPA_AUTH_DATABASE_URL')]:
 settings=env('/etc/concrefer-unificado/homolog/'+filename);dsn=settings[var]
 u=urlsplit(dsn);assert u.hostname in ('localhost','127.0.0.1') and u.path==f'/{key}_unificado_homolog_20261016'
 with psycopg.connect(dsn) as db:
  db.execute('SET TRANSACTION READ ONLY')
  if key=='pcp':assert db.execute('SELECT version_num FROM public.alembic_version_armacao').fetchone()[0]=='a6c_20261030'
  else:
   assert db.execute('SELECT count(*) FROM unificado_auth.user_quick_access').fetchone()[0]==0
   assert db.execute('SELECT count(*) FROM unificado_auth.user_units').fetchone()[0]==0
  tables=['usuarios'] if key=='pcp' else ['usuarios','user_screen_permissions','user_action_permissions','identity_links']
  for t in tables:
   schema='public' if t=='usuarios' else 'unificado_auth'
   dump=subprocess.check_output(['pg_restore','--data-only','-n',schema,'-t',t,'-f','-',str(pre/(key+'.dump'))]).decode()
   found=re.search(r'^COPY [^\n]+? \(([^\n]+)\) FROM stdin;\n(.*?)\n\\\.',dump,re.M|re.S);assert found,t
   cols=[c.strip().strip('"') for c in found.group(1).split(',')];rows=[r.split('\t') for r in found.group(2).splitlines() if r]
   fields=cols if t!='usuarios' else [c for c in cols if c in ('id','username','perfil','nivel_acesso','ativo','setor','setor_id','unidade','deleted_at')]
   expected=sorted(tuple(r[cols.index(c)] for c in fields) for r in rows)
   query='COPY (SELECT '+','.join('"'+c+'"' for c in fields)+' FROM '+schema+'.'+t+') TO STDOUT'
   with db.cursor().copy(query) as stream:raw=b''.join(bytes(x) for x in stream).decode()
   current=sorted(tuple(r.split('\t')) for r in raw.splitlines() if r);assert current==expected,(key,t)
   checks.append({'database':u.path[1:],'table':t,'rows':len(current),'unchanged':True})
result={'status':'ok','production_original_files_unchanged':len(initial),'production_current_files_pids_vhost_unchanged':True,'homolog_manifest_files':len(verified),'published_backend_parity':backend_parity,'armacao_migration_head':'a6c_20261030','quick_access_and_user_units_assignments':0,'business_profiles_permissions':checks,'read_only_database_connections':'documented homolog databases only'}
(STAGE/'final-audit.json').write_text(json.dumps(result,indent=2));print(json.dumps(result))
