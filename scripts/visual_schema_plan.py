"""Generate additive homolog-only DDL from disconnected published references."""
import ast,json,re,subprocess
from pathlib import Path
S=Path('/opt/concrefer-unificado/homolog-next/staging/visual-completo')
ALLOWED={'mapa_ref_homolog_20261118','pcp_ref_homolog_20261118','qualidade_ref_homolog_20261118','mapa_visual_homolog_20261118','pcp_visual_homolog_20261118','qualidade_visual_homolog_20261118'}
def psql(db,sql):
 assert db in ALLOWED
 return subprocess.check_output(['sudo','-u','postgres','psql','-X','-At','-v','ON_ERROR_STOP=1','-d',db,'-c',sql],text=True)
# Reuse the PostgreSQL statement lexer without executing the reference builder.
tree=ast.parse((S/'visual_schema_reference.py').read_text())
exec(compile(ast.Module(body=[n for n in tree.body if isinstance(n,ast.FunctionDef) and n.name in ('statements','head')],type_ignores=[]),'sql_lexer','exec'))
def catalog(db):
 query="""SELECT json_build_object(
 'schemas',(SELECT json_agg(nspname) FROM pg_namespace WHERE nspname NOT LIKE 'pg_%' AND nspname<>'information_schema'),
 'relations',(SELECT json_object_agg(n.nspname||'.'||c.relname,c.relkind) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname NOT LIKE 'pg_%' AND n.nspname<>'information_schema' AND c.relkind IN ('r','v','m','S','f','p')),
 'types',(SELECT json_agg(n.nspname||'.'||t.typname) FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname NOT LIKE 'pg_%'),
 'columns',(SELECT json_agg(json_build_object('table',n.nspname||'.'||c.relname,'name',a.attname,'type',format_type(a.atttypid,a.atttypmod),'notnull',a.attnotnull,'default',pg_get_expr(d.adbin,d.adrelid),'identity',a.attidentity)) FROM pg_attribute a JOIN pg_class c ON c.oid=a.attrelid JOIN pg_namespace n ON n.oid=c.relnamespace LEFT JOIN pg_attrdef d ON d.adrelid=a.attrelid AND d.adnum=a.attnum WHERE a.attnum>0 AND NOT a.attisdropped AND c.relkind IN ('r','p') AND n.nspname NOT LIKE 'pg_%' AND n.nspname<>'information_schema'),
 'constraints',(SELECT json_agg(json_build_object('table',n.nspname||'.'||c.relname,'name',x.conname,'kind',x.contype,'definition',pg_get_constraintdef(x.oid))) FROM pg_constraint x JOIN pg_class c ON c.oid=x.conrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname NOT LIKE 'pg_%' AND n.nspname<>'information_schema'),
 'indexes',(SELECT json_agg(n.nspname||'.'||c.relname) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relkind='i' AND n.nspname NOT LIKE 'pg_%'),
 'triggers',(SELECT json_agg(n.nspname||'.'||c.relname||'.'||t.tgname) FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE NOT t.tgisinternal AND n.nspname NOT LIKE 'pg_%'))"""
 return json.loads(psql(db,query))
def ident(name):
 assert re.fullmatch(r'[a-zA-Z_][a-zA-Z0-9_]*',name),name
 return '"'+name+'"'
def qualified(name):return '.'.join(ident(p) for p in name.split('.'))
all_plans=[]
for prefix,target in [('mapa','mapa_visual_homolog_20261118'),('pcp','pcp_visual_homolog_20261118'),('qualidade','qualidade_visual_homolog_20261118')]:
 reference=prefix+'_ref_homolog_20261118';a=catalog(target);b=catalog(reference)
 raw=subprocess.check_output(['sudo','-u','postgres','pg_dump','--schema-only','--no-owner','--no-acl','-d',reference],text=True)
 raw='\n'.join(l for l in raw.splitlines() if not l.startswith('\\'))
 parts=[head(s) for s in statements(raw)];parts=[s for s in parts if s and not s.startswith('--')]
 before=[];after=[];functions=[];views=[];defaults=[]
 newtables=sorted(t for t,k in b['relations'].items() if k in ('r','p') and t not in a['relations'])
 newseq=sorted(t for t,k in b['relations'].items() if k=='S' and t not in a['relations'])
 oldcolumns={(c['table'],c['name']):c for c in a['columns']}
 added=[c for c in b['columns'] if c['table'] in a['relations'] and (c['table'],c['name']) not in oldcolumns]
 oldcons={(c['table'],c['name']):c for c in a['constraints']}
 newconstraints=[]
 for s in parts:
  if s.startswith('SET ') or s.startswith('SELECT pg_catalog.set_config'):continue
  m=re.match(r'CREATE SCHEMA ([^\s;]+)',s)
  if m:
   if m[1].replace('"','') not in a['schemas']:before.append(s)
   continue
  m=re.match(r'CREATE TYPE ([^\s;]+)',s)
  if m:
   if m[1].replace('"','') not in a['types']:before.append(s)
   continue
  m=re.match(r'CREATE (?:UNLOGGED )?TABLE ([^\s(;]+)',s)
  if m:
   if m[1].replace('"','') in newtables:before.append(s)
   continue
  m=re.match(r'CREATE SEQUENCE ([^\s;]+)',s)
  if m:
   if m[1].replace('"','') in newseq:before.append(s)
   continue
  if s.startswith('CREATE FUNCTION ') or s.startswith('CREATE PROCEDURE '):
   statement=s.replace('CREATE FUNCTION ','CREATE OR REPLACE FUNCTION ',1).replace('CREATE PROCEDURE ','CREATE OR REPLACE PROCEDURE ',1)
   functions.append(statement);before.append(statement);continue
  m=re.match(r'CREATE (MATERIALIZED )?VIEW ([^\s(;]+)',s)
  if m:
   table=m[2].replace('"','')
   if m[1]:
    if table not in a['relations']:views.append(s)
   else:views.append(s.replace('CREATE VIEW ','CREATE OR REPLACE VIEW ',1))
   continue
  m=re.match(r'ALTER TABLE (?:ONLY )?([^\s]+)\s+ADD CONSTRAINT ([^\s]+)',s)
  if m:
   table=m[1].replace('"','');name=m[2].replace('"','')
   if (table,name) not in oldcons:after.append(s);newconstraints.append(table+'.'+name)
   continue
  m=re.match(r'CREATE (?:UNIQUE )?INDEX ([^\s]+) ON ([^\s]+)',s)
  if m:
   schema=m[2].replace('"','').split('.')[0];key=schema+'.'+m[1].replace('"','')
   if key not in (a['indexes'] or []):after.append(s)
   continue
  m=re.match(r'CREATE TRIGGER ([^\s]+).*? ON ([^\s]+)',s,re.S)
  if m:
   key=m[2].replace('"','')+'.'+m[1].replace('"','')
   if key not in (a['triggers'] or []):after.append(s)
   continue
  if s.startswith('ALTER SEQUENCE ') and ' OWNED BY ' in s:defaults.append(s);continue
  m=re.match(r'ALTER TABLE (?:ONLY )?([^\s]+) ALTER COLUMN ([^\s]+) SET DEFAULT ',s)
  if m:
   table=m[1].replace('"','');name=m[2].replace('"','')
   if table in newtables or any(c['table']==table and c['name']==name for c in added):defaults.append(s)
   continue
  if s.startswith('ALTER TABLE ') and ' ADD GENERATED ' in s:
   m=re.match(r'ALTER TABLE (?:ONLY )?([^\s]+)',s)
   if m and m[1].replace('"','') in newtables:defaults.append(s)
   continue
 # Existing table checks can change as the published catalogue grows; no grants
 # or identity rows are imported. Preserve values, use the published definition.
 for c in b['constraints']:
  key=(c['table'],c['name']);old=oldcons.get(key)
  if old and c['kind']=='c' and c['definition']!=old['definition']:
   after.append('ALTER TABLE '+qualified(c['table'])+' DROP CONSTRAINT '+ident(c['name'])+';')
   after.append('ALTER TABLE '+qualified(c['table'])+' ADD CONSTRAINT '+ident(c['name'])+' '+c['definition']+';')
 columns=[]
 for c in added:
  default=(' DEFAULT '+c['default']) if c['default'] else ''
  columns.append('ALTER TABLE '+qualified(c['table'])+' ADD COLUMN '+ident(c['name'])+' '+c['type']+default+(' NOT NULL' if c['notnull'] else '')+';')
 ddl='\n'.join(['BEGIN;','SET LOCAL statement_timeout=\'180s\';','SET LOCAL lock_timeout=\'10s\';','SET LOCAL check_function_bodies=false;']+before+columns+defaults+views+after+['COMMIT;'])
 for prod,hom in [('mapa_unificado_teste','mapa_visual_homolog_20261118'),('pcp_unificado_teste','pcp_visual_homolog_20261118')]:ddl=ddl.replace(prod,hom)
 assert not re.search(r'\b(DROP TABLE|DROP DATABASE|DROP SCHEMA|CREATE SERVER|CREATE USER MAPPING|TRUNCATE)\b',ddl)
 assert not re.search(r"\bpassword\s+'[^']+'",ddl,re.I)
 (S/(prefix+'-additive.sql')).write_text(ddl)
 info={'database':target,'reference':reference,'new_tables':newtables,'new_sequences':newseq,'added_columns':added,'new_constraints':newconstraints,'functions':len(functions),'views':len(views),'ddl_statements':len(list(statements(ddl))),'drops_existing_tables_or_columns':False,'auth_data_imported':False}
 all_plans.append(info)
(S/'schema-plan.json').write_text(json.dumps(all_plans,indent=2));print(json.dumps([{'database':p['database'],'new_tables':len(p['new_tables']),'added_columns':len(p['added_columns']),'functions':p['functions'],'views':p['views'],'statements':p['ddl_statements']} for p in all_plans]))
