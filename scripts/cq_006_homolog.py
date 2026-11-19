"""Apply only the approved published CQ 006 to the isolated homolog database."""
import hashlib,json,os,shlex,subprocess
from datetime import datetime,timezone
from pathlib import Path
from urllib.parse import urlsplit

DB='laboratorio_visual_homolog_20261118'
SQL=Path('/opt/concrefer-unificado/cq/migrations/006_liberacao_excepcional.sql')
EXPECTED='c95fb280c2be0a16f6467b67c87be9f78f8e88bd19e03a73c106449b39d16799'
H=Path('/opt/concrefer-unificado/homolog-next')
assert Path(__file__).resolve().parent==H/'staging/cq-006'
env={}
for line in Path('/etc/concrefer-unificado/homolog/visual-cq.env').read_text().splitlines():
 parts=shlex.split(line)
 if len(parts)==1 and '=' in parts[0]:key,val=parts[0].split('=',1);env[key]=val
url=urlsplit(env['DATABASE_URL'])
assert url.hostname in ['127.0.0.1','localhost'] and url.path=='/'+DB
assert hashlib.sha256(SQL.read_bytes()).hexdigest()==EXPECTED
backup=H/'backups'/('cq-006-'+datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ'))
backup.mkdir(mode=0o700)
def psql(query):
 return subprocess.check_output(['sudo','-u','postgres','psql','-X','-q','-v','ON_ERROR_STOP=1','-d',DB,'-At','-c','BEGIN READ ONLY; '+query+'; ROLLBACK;'],text=True)
def snapshots():
 tables=json.loads(psql("SELECT json_agg(tablename ORDER BY tablename) FROM pg_tables WHERE schemaname='public'"))
 result={}
 for table in tables:
  assert table.replace('_','').isalnum(),table
  # Ignore only the five newly added nullable fields, preserving every prior value.
  excludes=" - 'liberacao_excepcional_por' - 'liberacao_excepcional_nome' - 'liberacao_excepcional_motivo' - 'liberacao_excepcional_em'" if table=='cq_certificados' else " - 'resultado_origem'" if table=='cq_resultados_data' else ''
  data=psql(f'''COPY (SELECT (to_jsonb(t){excludes})::text AS row FROM public."{table}" t ORDER BY 1) TO STDOUT''')
  result[table]={'sha256_existing_data':hashlib.sha256(data.encode()).hexdigest(),'rows':len(data.splitlines())}
 permissions=psql("SELECT n.nspname,c.relname,c.relowner,coalesce(c.relacl::text,'') FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' ORDER BY 1,2")
 return {'tables':result,'object_ownership_permissions_sha256':hashlib.sha256(permissions.encode()).hexdigest()}
columns="SELECT table_name,column_name,data_type FROM information_schema.columns WHERE table_schema='public' AND ((table_name='cq_certificados' AND column_name LIKE 'liberacao_excepcional_%') OR (table_name='cq_resultados_data' AND column_name='resultado_origem')) ORDER BY 1,2"
before=snapshots()
dump=backup/(DB+'-before-006.dump')
with dump.open('wb') as stream:
 subprocess.run(['sudo','-u','postgres','pg_dump','--format=custom','--no-owner','--no-privileges','--dbname='+DB],stdout=stream,check=True)
os.chmod(dump,0o600)
listing=subprocess.check_output(['pg_restore','--list',str(dump)],text=True)
assert 'cq_certificados' in listing and 'cq_resultados_data' in listing and dump.stat().st_size>1000
(backup/'dump-toc.txt').write_text(listing)
# Read and decompress the entire archive without restoring or connecting to any DB.
subprocess.run(['pg_restore','--file=/dev/null',str(dump)],check=True)
receipt={'authorized_exception':'User explicitly authorized 006 on homolog without proof of production execution.','database':DB,'production_database_connections':0,'migration_file':str(SQL),'migration_sha256':EXPECTED,'production_execution_confirmed':False,'backup':str(dump),'backup_bytes':dump.stat().st_size,'backup_sha256':hashlib.sha256(dump.read_bytes()).hexdigest(),'backup_verified_toc_and_full_archive_decode':True,'before':before,'columns_before':psql(columns).splitlines()}
(backup/'receipt-before.json').write_text(json.dumps(receipt,indent=2))
print(json.dumps({'phase':'verified_backup','database':DB,'backup':str(dump),'sha256':receipt['backup_sha256']}),flush=True)
options={**os.environ,'PGOPTIONS':'-c lock_timeout=10000 -c statement_timeout=60000'}
# The exact published file, only once, in one atomic transaction. No other migrations.
subprocess.run(['sudo','-u','postgres','env','PGOPTIONS='+options['PGOPTIONS'],'psql','-X','-v','ON_ERROR_STOP=1','--single-transaction','-d',DB],input=SQL.read_bytes(),check=True)
after=snapshots();receipt['after']=after;receipt['columns_after']=psql(columns).splitlines()
expected={
 'cq_certificados|liberacao_excepcional_por|text',
 'cq_certificados|liberacao_excepcional_nome|text',
 'cq_certificados|liberacao_excepcional_motivo|text',
 'cq_certificados|liberacao_excepcional_em|timestamp with time zone',
 'cq_resultados_data|resultado_origem|text'
}
receipt['existing_data_and_permissions_unchanged']=before==after
receipt['five_columns_verified']=set(receipt['columns_after'])==expected
receipt['migration_applied']=True
(backup/'receipt-after.json').write_text(json.dumps(receipt,indent=2))
(H/'staging/cq-006/receipt-after.json').write_text(json.dumps(receipt,indent=2))
assert receipt['existing_data_and_permissions_unchanged'] and receipt['five_columns_verified']
print(json.dumps({'phase':'applied_and_verified','database':DB,'five_columns_verified':True,'existing_data_and_permissions_unchanged':True,'backup':str(dump)}))
