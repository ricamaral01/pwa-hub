"""Prepare schema-only, disconnected references from existing offline backups."""
import hashlib,json,re,subprocess
from pathlib import Path
S=Path('/opt/concrefer-unificado/homolog-next/staging/visual-completo')
REFS={
 'mapa_ref_homolog_20261118':Path('/var/backups/concrefer-unificado/20261118T200240Z/mapa_unificado_teste.dump'),
 'pcp_ref_homolog_20261118':Path('/var/backups/concrefer-unificado/20261118T200240Z/pcp_unificado_teste.dump'),
 'qualidade_ref_homolog_20261118':Path('/var/backups/concrefer-ged-qualidade/20261118T053935Z/qualidade.dump'),
}
def statements(s):
 """Split PostgreSQL DDL, retaining quoted/dollar-quoted function bodies."""
 start=i=0;quote=None;block=0;line=False
 while i<len(s):
  if line:
   if s[i]=='\n':line=False
   i+=1;continue
  if block:
   if s.startswith('/*',i):block+=1;i+=2
   elif s.startswith('*/',i):block-=1;i+=2
   else:i+=1
   continue
  if quote:
   if quote in ("'",'"'):
    if s[i]=='\\' and quote=="'":i+=2;continue
    if s.startswith(quote*2,i):i+=2;continue
    if s[i]==quote:quote=None
    i+=1
   elif s.startswith(quote,i):i+=len(quote);quote=None
   else:i+=1
   continue
  if s.startswith('--',i):line=True;i+=2;continue
  if s.startswith('/*',i):block=1;i+=2;continue
  if s[i] in ("'",'"'):quote=s[i];i+=1;continue
  if s[i]=='$':
   m=re.match(r'\$(?:[a-zA-Z_][a-zA-Z_0-9]*)?\$',s[i:])
   if m:quote=m[0];i+=len(quote);continue
  if s[i]==';':
   yield s[start:i+1];start=i+1
  i+=1
 if s[start:].strip():yield s[start:]
def head(stmt):return re.sub(r'\A\s*(?:--[^\n]*\n\s*)*','',stmt).strip()
def psql(name,sql,output=False):
 assert name in REFS
 args=['sudo','-u','postgres','psql','-X','-v','ON_ERROR_STOP=1','-d',name]
 r=subprocess.run(args+(['-At'] if output else []),input=sql,text=True,capture_output=True)
 if r.returncode:raise RuntimeError(r.stderr[-5000:])
 return r.stdout
result=[]
for name,dump in REFS.items():
 marker=S/(name+'-ready.json')
 if marker.exists():result.append(json.loads(marker.read_text()));continue
 assert dump.is_file()
 raw=subprocess.check_output(['pg_restore','--schema-only','--no-owner','--no-acl','-f','-',str(dump)]).decode()
 raw='\n'.join(l for l in raw.splitlines() if not l.startswith('\\'))
 chosen=[];foreign=[];excluded=0
 for stmt in statements(raw):
  text=head(stmt)
  if not text or text.startswith('--'):continue
  if re.match(r'(CREATE|ALTER) (SERVER|USER MAPPING|FOREIGN DATA WRAPPER)',text):excluded+=1;continue
  if text.startswith('ALTER ') and ' OPTIONS (' in text:excluded+=1;continue
  if text.startswith('CREATE FOREIGN TABLE '):
   m=re.match(r'CREATE FOREIGN TABLE\s+([^\s(]+)',text);foreign.append(m[1])
   text=re.split(r'\nSERVER\s+',text,maxsplit=1)[0]
   text=text.replace('CREATE FOREIGN TABLE ','CREATE TABLE ',1).rstrip(';')+';'
  text=re.sub(r'^(COMMENT ON|ALTER) FOREIGN TABLE ',r'\1 TABLE ',text)
  if re.match(r'CREATE MATERIALIZED VIEW ',text):assert 'WITH NO DATA' in text
  if text.startswith('CREATE EXTENSION '):
   assert re.search(r'\b(pgcrypto|uuid-ossp|postgres_fdw|unaccent|citext|pg_trgm)\b',text),text[:100]
  assert not re.search(r"\bpassword\s+'[^']+'",text,re.I),'Credential-bearing DDL excluded'
  chosen.append(text)
 ddl='\n'.join(chosen)
 assert not re.search(r'\b(CREATE SERVER|CREATE USER MAPPING)\b',ddl)
 exists=subprocess.check_output(['sudo','-u','postgres','psql','-X','-At','-d','postgres','-c',"SELECT 1 FROM pg_database WHERE datname='"+name+"'"],text=True).strip()
 if not exists:subprocess.run(['sudo','-u','postgres','createdb','--template=template0',name],check=True)
 count=psql(name,"SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname NOT LIKE 'pg_%' AND n.nspname<>'information_schema' AND c.relkind IN ('r','m');",True).strip()
 assert count=='0',(name,'Reference is not empty')
 psql(name,'BEGIN;\n'+ddl+'\nCOMMIT;')
 assert psql(name,'SELECT count(*) FROM pg_foreign_server;',True).strip()=='0'
 info={'reference_database':name,'offline_source':str(dump),'sha256':hashlib.sha256(dump.read_bytes()).hexdigest(),'statements':len(chosen),'foreign_tables_materialized_empty':foreign,'excluded_fdw_server_and_mappings':excluded,'production_database_connections':0}
 marker.write_text(json.dumps(info,indent=2));result.append(info)
(S/'schema-references.json').write_text(json.dumps(result,indent=2));print(json.dumps(result))
