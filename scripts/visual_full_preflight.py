"""Homolog-only catalogue reads; published files are read, never executed."""
import ast,hashlib,json,re,shlex,subprocess,sys
from pathlib import Path
from urllib.parse import urlsplit
import psycopg
R=Path('/opt/concrefer-unificado');H=R/'homolog-next';S=H/'staging/visual-completo'
def env(path):
 out={}
 for line in Path(path).read_text().splitlines():
  try:parts=shlex.split(line)
  except ValueError:continue
  if len(parts)==1 and '=' in parts[0]:k,v=parts[0].split('=',1);out[k]=v
 return out
sources={'mapa':('/etc/concrefer-unificado/homolog/mapa-auth.env','MAPA_AUTH_DATABASE_URL','mapa_unificado_homolog_20261016'),'pcp':('/etc/concrefer-unificado/homolog/pcp.env','DATABASE_URL','pcp_unificado_homolog_20261016'),'qualidade':('/etc/concrefer-unificado/homolog/qualidade.env','QUALIDADE_DATABASE_URL','qualidade_homolog_20261016'),'laboratorio':('/etc/concrefer-unificado/laboratorio-homolog.env','DATABASE_URL','concretrack_postes_homolog'),'suprimentos':('/etc/concrefer-unificado/homolog/suprimentos.env','SUPRIMENTOS_DATABASE_URL','suprimentos_homolog_20261025')}
catalog={}
for name,(filename,key,expected) in sources.items():
 dsn=env(filename)[key].replace('postgresql+psycopg://','postgresql://');u=urlsplit(dsn)
 assert u.hostname in ('localhost','127.0.0.1') and u.path=='/'+expected,(name,'unsafe database target')
 with psycopg.connect(dsn) as db:
  db.execute('SET TRANSACTION READ ONLY')
  rows=db.execute("SELECT n.nspname,c.relname,a.attname,format_type(a.atttypid,a.atttypmod) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace JOIN pg_attribute a ON a.attrelid=c.oid AND a.attnum>0 AND NOT a.attisdropped WHERE n.nspname NOT IN ('pg_catalog','information_schema') AND n.nspname NOT LIKE 'pg_toast%' AND c.relkind IN ('r','v','m','p') ORDER BY 1,2,a.attnum").fetchall()
  tables={}
  for schema,table,column,kind in rows:tables.setdefault(schema+'.'+table,[]).append({'column':column,'type':kind})
  heads={}
  for table in tables:
   if 'alembic_version' in table:
    assert re.fullmatch(r'[a-z_]+\.[a-z_]+',table)
    if not db.execute("SELECT has_table_privilege(%s,'SELECT')",(table,)).fetchone()[0]:
     heads[table]=['requires migration role'];continue
    heads[table]=[str(r[0]) for r in db.execute('SELECT version_num FROM '+table)]
  catalog[name]={'database':expected,'tables':tables,'heads':heads}
manifest=json.loads((S/'published-source-manifest.json').read_text())
changes={}
for rel,item in manifest.items():
 p=Path(item['destination']);status='missing' if not p.exists() else 'same' if hashlib.sha256(p.read_bytes()).hexdigest()==item['sha256'] else 'different'
 changes.setdefault(rel.split('/')[0],{'same':0,'different':0,'missing':0})[status]+=1
missing={}
mapping={'mapa-api':'mapa','logistica-api':'pcp','dosagem-native':'mapa','qualidade':'qualidade','laboratorio':'laboratorio','cq':'laboratorio','suprimentos':'suprimentos','usinas':'mapa'}
for module,dbkey in mapping.items():
 refs=set()
 for rel,item in manifest.items():
  if not rel.startswith(module+'/') or not rel.endswith('.py') or '/tests/' in rel:continue
  for schema,table in re.findall(r'\b(?:FROM|JOIN|INTO|UPDATE|REFERENCES)\s+([a-z][a-z0-9_]*)\.([a-z][a-z0-9_]*)',Path(item['source']).read_text(),re.I):
   if schema not in ('pg_catalog','information_schema'):refs.add(schema+'.'+table)
 missing[module]=sorted(refs-set(catalog[dbkey]['tables']))
result={'changes':changes,'catalog':catalog,'missing_table_candidates':missing,'production_database_connections':0}
(S/'preflight.json').write_text(json.dumps(result,indent=2));print(json.dumps({'changes':changes,'heads':{k:v['heads'] for k,v in catalog.items()},'missing_table_candidates':missing,'production_database_connections':0}))
