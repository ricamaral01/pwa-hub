"""Restore only frozen static deployment paths; no SQL, pools, services or data."""
import hashlib,json,os,shutil,sys,time
from pathlib import Path
B=Path(__file__).resolve().parent;R=Path('/opt/concrefer-unificado');assert B.parent==R/'backups' and B.name.startswith('producao-')
apply='--apply' in sys.argv;plan=json.loads((B/'deployment-plan.json').read_text());assert not any(plan[k] for k in ['migrations_to_apply','permissions_to_change','backend_patches','services_to_restart','nginx_changes'])
roots=[R/'public/unificado',R/'laboratorio/service/server/static',R/'dosagem-native/static',R/'homolog/laboratorio/service/server/static/carta-traco']
rows=plan['static_files'];restored=quarantined=0
for row in rows:
 p=Path(row['destination']);assert any(p.resolve().is_relative_to(root.resolve()) for root in roots),p
 assert not p.resolve().is_relative_to(R/'homolog-next')
 if row['before'] is not None:
  original=B/'originals'/row['file'];assert original.is_file() and hashlib.sha256(original.read_bytes()).hexdigest()==row['before']['sha256'],str(original)
for row in sorted(rows,key=lambda r:(r['file']=='public/VERSION',r['file'])):
 p=Path(row['destination'])
 if row['before'] is None:
  if apply and p.exists():
   dest=B/'quarantine'/str(int(time.time()))/row['file'];dest.parent.mkdir(parents=True,exist_ok=True);shutil.move(str(p),str(dest));quarantined+=1
  continue
 if apply:
  original=B/'originals'/row['file'];p.parent.mkdir(parents=True,exist_ok=True);temp=p.with_name(p.name+'.production-rollback-tmp');shutil.copy2(original,temp);os.replace(temp,p);restored+=1
if apply:
 for row in rows:
  if row['before'] is not None:assert hashlib.sha256(Path(row['destination']).read_bytes()).hexdigest()==row['before']['sha256'],row['file']
 assert (R/'public/unificado/VERSION').read_text().strip()==plan['version_before']
print(json.dumps({'apply':apply,'version_restored':plan['version_before'] if apply else None,'original_files_verified':sum(r['before'] is not None for r in rows),'files_restored':restored,'new_assets_quarantined':quarantined,'sql_changes':0,'configuration_changes':0,'service_restarts':0,'homolog_next_changes':0}))
