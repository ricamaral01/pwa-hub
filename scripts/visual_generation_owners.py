"""Restore technical ownership and per-database settings only inside new clones."""
import ast,json,re,subprocess
from pathlib import Path
S=Path('/opt/concrefer-unificado/homolog-next/staging/visual-completo')
clones=json.loads((S/'generation-clones.json').read_text());refs=json.loads((S/'schema-references.json').read_text())
tree=ast.parse((S/'visual_schema_reference.py').read_text());exec(compile(ast.Module(body=[n for n in tree.body if isinstance(n,ast.FunctionDef) and n.name in ('statements','head')],type_ignores=[]),'sql_lexer','exec'))
def psql(db,sql):
 assert db=='postgres' or db in {x['database'] for x in clones}
 r=subprocess.run(['sudo','-u','postgres','psql','-XAt','-v','ON_ERROR_STOP=1','-d',db],input=sql,text=True,capture_output=True)
 if r.returncode:raise RuntimeError(r.stderr[-3000:])
 return r.stdout
def quote(v):return '"'+v.replace('"','""')+'"'
results=[]
for c in clones:
 db=c['database'];src=c['source_homolog_database'];assert db.endswith('_visual_homolog_20261118') and '_homolog' in src
 owner=psql('postgres',"SELECT pg_get_userbyid(datdba) FROM pg_database WHERE datname='"+src+"';").strip();assert re.fullmatch(r'[a-zA-Z_][a-zA-Z_0-9]*',owner)
 psql('postgres','ALTER DATABASE '+quote(db)+' OWNER TO '+quote(owner)+';')
 settings=json.loads(psql('postgres',"SELECT COALESCE(json_agg(json_build_object('role',pg_get_userbyid(s.setrole),'settings',s.setconfig)),'[]') FROM pg_db_role_setting s JOIN pg_database d ON d.oid=s.setdatabase WHERE d.datname='"+src+"' AND s.setrole<>0;"))
 for item in settings:
  for value in item['settings']:
   k,v=value.split('=',1);assert re.fullmatch(r'[a-z_.]+',k)
   psql(db,'ALTER ROLE '+quote(item['role'])+' IN DATABASE '+quote(db)+' SET '+k+" TO '"+v.replace("'","''")+"';")
 key=db.split('_')[0];count=0
 if key in ('mapa','pcp','qualidade'):
  source=next(r['offline_source'] for r in refs if r['reference_database']==key+'_ref_homolog_20261118')
  raw=subprocess.check_output(['pg_restore','--schema-only','--no-acl','-f','-',source]).decode();raw='\n'.join(l for l in raw.splitlines() if not l.startswith('\\'))
  owners=[]
  for part in statements(raw):
   text=head(part)
   if text.startswith('ALTER ') and ' OWNER TO ' in text and not text.startswith(('ALTER SERVER ','ALTER FOREIGN DATA WRAPPER ')):
    text=text.replace('ALTER FOREIGN TABLE ','ALTER TABLE ')
    owners.append(text)
  if owners:psql(db,'BEGIN;\n'+'\n'.join(owners)+'\nCOMMIT;')
  count=len(owners)
  # ALTER OWNER transfers the old owner's ACL entry. Replay the published
  # object grants AFTER ownership, or the former owner's app rights disappear.
  raw_acl=subprocess.check_output(['pg_restore','--schema-only','--no-owner','-f','-',source]).decode();raw_acl='\n'.join(l for l in raw_acl.splitlines() if not l.startswith('\\'))
  grants=[]
  for part in statements(raw_acl):
   text=head(part)
   if not text.startswith(('GRANT ','REVOKE ')):continue
   if 'FOREIGN SERVER' in text or 'FOREIGN DATA WRAPPER' in text or ' ON DATABASE ' in text:continue
   if text.startswith('GRANT ') and ' ON ' not in text:continue
   grants.append(text)
  if grants:psql(db,'BEGIN;\n'+'\n'.join(grants)+'\nCOMMIT;')
 results.append({'database':db,'owner_from_old_homolog':owner,'technical_owner_statements':count,'per_database_role_settings':len(settings),'global_role_changes':False,'production_database_connections':0})
(S/'generation-ownership.json').write_text(json.dumps(results,indent=2));print(json.dumps(results))
