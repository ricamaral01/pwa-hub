"""Align only unused visual-generation DBs; old shared DBs are never mutated."""
import ast,hashlib,json,re,subprocess
from pathlib import Path
S=Path('/opt/concrefer-unificado/homolog-next/staging/visual-completo')
B=Path(json.loads((S/'backup-ready.json').read_text())['backup'])
plans=json.loads((S/'schema-plan.json').read_text());refs=json.loads((S/'schema-references.json').read_text())
tree=ast.parse((S/'visual_schema_reference.py').read_text());exec(compile(ast.Module(body=[n for n in tree.body if isinstance(n,ast.FunctionDef) and n.name in ('statements','head')],type_ignores=[]),'sql_lexer','exec'))
def call(db,sql,quiet=True):
 assert db in {p['database'] for p in plans} and db.endswith('_visual_homolog_20261118')
 r=subprocess.run(['sudo','-u','postgres','psql','-XAt','-v','ON_ERROR_STOP=1','-d',db],input=sql,text=True,capture_output=True)
 if r.returncode:raise RuntimeError(r.stderr[-5000:])
 return r.stdout
results=[]
for plan in plans:
 db=plan['database'];key=db.split('_')[0];marker=S/(key+'-schema-applied.json')
 if marker.exists():results.append(json.loads(marker.read_text()));continue
 dump=B/(db+'-before-parity.dump')
 if not dump.exists():
  with dump.open('wb') as f:subprocess.run(['sudo','-u','postgres','pg_dump','-Fc','-d',db],stdout=f,check=True)
  dump.chmod(0o600);assert 'TABLE DATA' in subprocess.check_output(['pg_restore','-l',str(dump)],text=True)
 permission_tables=['public.usuarios']+(['unificado_auth.user_screen_permissions','unificado_auth.user_action_permissions','unificado_auth.identity_links'] if key=='mapa' else []) if key in ('mapa','pcp') else []
 before={t:call(db,'SELECT md5(string_agg(t::text,\'\' ORDER BY t::text)) FROM '+t+' t;') for t in permission_tables}
 ddl=(S/(key+'-additive.sql')).read_text()
 assert not re.search(r'\b(DROP TABLE|DROP COLUMN|TRUNCATE|CREATE SERVER|CREATE USER MAPPING)\b',ddl)
 call(db,ddl)
 source=Path(next(r['offline_source'] for r in refs if r['reference_database']==plan['reference']))
 raw=subprocess.check_output(['pg_restore','--schema-only','--no-owner','-f','-',str(source)]).decode()
 raw='\n'.join(l for l in raw.splitlines() if not l.startswith('\\'))
 grants=[]
 for part in statements(raw):
  text=head(part)
  if not text.startswith(('GRANT ','REVOKE ')):continue
  if 'FOREIGN SERVER' in text or 'FOREIGN DATA WRAPPER' in text:continue
  if ' ON DATABASE ' in text:continue
  if text.startswith('GRANT ') and ' ON ' not in text:continue
  grants.append(text)
 if grants:call(db,'BEGIN;\n'+'\n'.join(grants)+'\nCOMMIT;')
 assert all(call(db,'SELECT md5(string_agg(t::text,\'\' ORDER BY t::text)) FROM '+t+' t;')==v for t,v in before.items()),'Identity or grant rows changed'
 result={'database':db,'status':'passed','new_tables':len(plan['new_tables']),'added_columns':len(plan['added_columns']),'functions':plan['functions'],'views':plan['views'],'technical_object_acl_statements':len(grants),'business_identities_and_grants_unchanged':True,'backup':str(dump),'backup_sha256':hashlib.sha256(dump.read_bytes()).hexdigest(),'old_databases_untouched':True,'production_database_connections':0}
 marker.write_text(json.dumps(result,indent=2));results.append(result);print(json.dumps(result),flush=True)
(S/'schema-application.json').write_text(json.dumps(results,indent=2))
