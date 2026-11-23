"""Verify homolog-only changes, published-byte parity and role preservation."""
import hashlib,importlib.metadata,json,re,shlex,subprocess
from pathlib import Path
from urllib.parse import urlsplit
import psycopg
from psycopg import sql

ROOT=Path('/opt/concrefer-unificado');HOM=ROOT/'homolog-next';STAGE=HOM/'staging/padrao-visual-fase-0.5'
deployment=json.loads((STAGE/'deployment-results.json').read_text());backup=Path(deployment['backup'])
def sha(path):return hashlib.sha256(path.read_bytes()).hexdigest()
before=json.loads((backup/'production-before.json').read_text())
after={}
for directory in [ROOT/'public/unificado',ROOT/'pcp-api/app',ROOT/'pcp-api/alembic',ROOT/'mapa-api']:
 for path in directory.rglob('*'):
  if not path.is_file() or '__pycache__' in path.parts or path.name.startswith('.env'):continue
  if directory.name=='mapa-api' and (path.parent!=directory or path.suffix not in ('.py','.json')):continue
  after[str(path.relative_to(ROOT))]=sha(path)
after['service_state']=subprocess.check_output(['systemctl','show','pcp-unificado-test.service','mapa-unificado-auth.service','-p','MainPID','-p','ExecMainStartTimestamp'],text=True)
assert before==after,'Production state changed'
manifest=json.loads((STAGE/'release-manifest.json').read_text())
for relative,digest in manifest.items():
 path=HOM/relative
 if relative in ['public/unificado/index.html','public/unificado/login.html']:
  content=path.read_text()
  content=content.replace('<div class="test-environment-bar">AMBIENTE DE TESTE · dados isolados de homologação</div>','')
  content=content.replace('<style>.test-environment-bar{position:relative;z-index:9999;padding:6px 12px;background:#fff3cd;color:#664d03;text-align:center;font:600 12px sans-serif}body{padding-top:31px}</style>','')
  assert content==(STAGE/'release'/relative).read_text(),relative
 else:assert sha(path)==digest,relative

def env(path):
 result={}
 for line in Path(path).read_text().splitlines():
  parts=shlex.split(line)
  if len(parts)==1 and '=' in parts[0]:key,value=parts[0].split('=',1);result[key]=value
 return result
pcp=env('/etc/concrefer-unificado/homolog/pcp.env');mapa=env('/etc/concrefer-unificado/homolog/mapa-auth.env')

def old_rows(dump,table,schema):
 # Keep raw database contents in memory. Never print/password-export them.
 body=subprocess.check_output(['pg_restore','--data-only','-n',schema,'-t',table,'-f','-',str(dump)]).decode()
 found=re.search(r'^COPY ([^\n]+?) \(([^\n]+)\) FROM stdin;\n(.*?)\n\\\.',body,re.M|re.S)
 if not found:return None
 columns=[c.strip().strip('"') for c in found.group(2).split(',')]
 rows=[line.split('\t') for line in found.group(3).splitlines() if line]
 return found.group(1),columns,rows

checks=[]
for domain,dsn,name in [('pcp',pcp['DATABASE_URL'],'pcp_unificado_homolog_20261016'),('mapa',mapa['MAPA_AUTH_DATABASE_URL'],'mapa_unificado_homolog_20261016')]:
 u=urlsplit(dsn);assert u.hostname in ('localhost','127.0.0.1') and u.path=='/'+name
 tables=['usuarios'] if domain=='pcp' else ['usuarios','user_screen_permissions','user_action_permissions','identity_links']
 with psycopg.connect(dsn) as db:
  db.execute('SET TRANSACTION READ ONLY')
  for table in tables:
   previous=old_rows(backup/(domain+'.dump'),table,'public' if table=='usuarios' else 'unificado_auth')
   if previous is None:continue
   qualified,columns,rows=previous
   fields=[c for c in columns if c in (['id','username','nivel_acesso','ativo','setor_id','deleted_at'] if domain=='pcp' else ['id','perfil','ativo','setor','unidade','alcada','deleted_at'])] if table=='usuarios' else columns
   expected=sorted(tuple(r[columns.index(c)] for c in fields) for r in rows)
   qualified=qualified.replace('"','').split('.')
   query=sql.SQL('COPY (SELECT {} FROM {}.{}) TO STDOUT').format(sql.SQL(',').join(map(sql.Identifier,fields)),sql.Identifier(qualified[0]),sql.Identifier(qualified[1]))
   with db.cursor().copy(query) as stream:raw=b''.join(bytes(chunk) for chunk in stream).decode()
   current=sorted(tuple(row.split('\t')) for row in raw.splitlines() if row)
   assert current==expected,(domain,table,'Business grants or profiles changed')
   checks.append({'database':name,'table':table,'rows':len(current),'unchanged':True})
  if domain=='pcp':assert db.execute('SELECT version_num FROM alembic_version').fetchone()[0]=='20261111_04'

packages=json.loads((STAGE/'dependencies.json').read_text())['changes']
installed={d.metadata['Name'].lower():d.version for d in importlib.metadata.distributions(path=[str(HOM/'pcp-api/.venv-py310/lib/python3.10/site-packages')])}
assert all(installed.get(k)==v for k,v in packages.items())
dumps={p.name:{'bytes':p.stat().st_size,'sha256':sha(p)} for p in backup.glob('*.dump')}
result={'status':'ok','production_files_and_pids_unchanged':True,'published_files_verified':len(manifest),'only_html_difference':'official homologation banner','business_permissions_checks':checks,'migration_head':'20261111_04','dependencies_verified':packages,'dumps':dumps,'nginx_changed':False,'phase1_started':False}
(STAGE/'verification-results.json').write_text(json.dumps(result,indent=2));print(json.dumps(result))
