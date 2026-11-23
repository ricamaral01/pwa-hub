"""Apply the parity DDL to copies of homologation before changing application DBs."""
import json,subprocess
from pathlib import Path
S=Path('/opt/concrefer-unificado/homolog-next/staging/visual-completo')
backup=json.loads((S/'backup-ready.json').read_text());results=[]
for key,db in [('mapa','mapa_unificado_homolog_20261016'),('pcp','pcp_unificado_homolog_20261016'),('qualidade','qualidade_homolog_20261016')]:
 target=key+'_validacao_homolog_20261118';assert target.endswith('_homolog_20261118')
 marker=S/(target+'-restored.json')
 if not marker.exists():
  exists=subprocess.check_output(['sudo','-u','postgres','psql','-XAt','-d','postgres','-c',"SELECT 1 FROM pg_database WHERE datname='"+target+"'"],text=True).strip()
  assert not exists,(target,'Unexpected preexisting validation DB')
  subprocess.run(['sudo','-u','postgres','createdb',target],check=True)
  # --no-owner, --no-acl; pg_restore accesses only the existing HOMOLOG dump.
  dump=Path(backup['dumps'][db]['path']);assert dump.is_relative_to(Path(backup['backup']))
  with dump.open('rb') as f:
   r=subprocess.run(['sudo','-u','postgres','pg_restore','--single-transaction','--exit-on-error','--no-owner','--no-acl','-d',target],stdin=f,capture_output=True)
  if r.returncode:raise RuntimeError(r.stderr.decode()[-4000:])
  marker.write_text(json.dumps({'source_homolog_db':db,'dump_sha256':backup['dumps'][db]['sha256']}))
 sql=(S/(key+'-additive.sql')).read_text()
 # Preserve target guards inside functions but adapt them to this validation copy.
 sql=sql.replace(db,target)
 r=subprocess.run(['sudo','-u','postgres','psql','-X','-v','ON_ERROR_STOP=1','-d',target],input=sql,text=True,capture_output=True)
 if r.returncode:
  (S/(key+'-validation-error.txt')).write_text(r.stderr)
  print(json.dumps({'database':target,'status':'failed','error':r.stderr[-3500:]}),flush=True);raise SystemExit(1)
 results.append({'database':target,'source_homolog':db,'status':'passed','production_database_connections':0})
 print(json.dumps(results[-1]),flush=True)
(S/'schema-validation.json').write_text(json.dumps(results,indent=2))
