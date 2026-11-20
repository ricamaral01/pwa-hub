"""Deploy only the frozen static manifest after every authorized checkpoint."""
import hashlib,json,os,shutil,subprocess,time
from pathlib import Path
R=Path('/opt/concrefer-unificado');S=R/'homolog-next/staging/producao-1.4.31';checkpoint=json.loads((S/'checkpoint.json').read_text());assert checkpoint['passed'];m=json.loads((S/'candidate-manifest.json').read_text());frozen=json.loads((S/'frozen.json').read_text());plan=json.loads((S/'deployment-plan.json').read_text());B=Path(plan['production_backup']);D=S/'candidate'
assert frozen['version']=='1.4.31' and hashlib.sha256((S/'candidate.tgz').read_bytes()).hexdigest()==frozen['archive_sha256'];assert hashlib.sha256((S/'candidate-manifest.json').read_bytes()).hexdigest()==frozen['manifest_sha256']
for k in ['backend_patches','migrations_to_apply','permissions_to_change','services_to_restart','nginx_changes']:assert not plan[k]
assert (R/'public/unificado/VERSION').read_text().strip()=='1.4.6'
roots=[R/'public/unificado',R/'laboratorio/service/server/static',R/'dosagem-native/static',R/'homolog/laboratorio/service/server/static/carta-traco']
for row in plan['static_files']:
 p=Path(row['destination']);assert any(p.resolve().is_relative_to(root.resolve()) for root in roots) and not p.resolve().is_relative_to(R/'homolog-next');data=(D/row['file']).read_bytes();assert len(data)==row['after']['bytes'] and hashlib.sha256(data).hexdigest()==row['after']['sha256']
 if row['before'] is None:assert not p.exists(),str(p)
 else:assert p.is_file() and hashlib.sha256(p.read_bytes()).hexdigest()==row['before']['sha256'],('Production changed',str(p))
dry=subprocess.run([str(B/'rollback.sh'),'--verify-only'],check=True,capture_output=True,text=True);query="BEGIN READ ONLY;SELECT current_setting('max_connections')::int-current_setting('superuser_reserved_connections')::int-coalesce(current_setting('reserved_connections',true),'0')::int-(SELECT count(*) FROM pg_stat_activity WHERE backend_type='client backend');ROLLBACK;";free=int(subprocess.check_output(['sudo','-u','postgres','psql','-X','-qAt','-c',query],text=True).strip());assert free>=15,free
incoming=B/'releases/1.4.31/incoming';incoming.mkdir(mode=0o700,exist_ok=True);changed=[r for r in plan['static_files'] if r['action']!='unchanged']
for row in changed:
 temp=incoming/row['file'];temp.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(D/row['file'],temp);temp.chmod(0o644)
def order(row):
 key=row['file'];return (5 if key=='public/VERSION' else 4 if key=='public/sw.js' else 3 if key=='public/shell/navigation.js' else 2 if key.endswith('.html') else 1,key)
started=time.time()
try:
 for row in sorted(changed,key=order):
  p=Path(row['destination']);missing=[];parent=p.parent
  while not parent.exists():missing.append(parent);parent=parent.parent
  for folder in reversed(missing):folder.mkdir(mode=0o755);folder.chmod(0o755)
  os.replace(incoming/row['file'],p)
 for row in plan['static_files']:assert hashlib.sha256(Path(row['destination']).read_bytes()).hexdigest()==row['after']['sha256'],row['file']
 assert (R/'public/unificado/VERSION').read_text().strip()=='1.4.31'
except Exception:
 result=subprocess.run([str(B/'rollback.sh')],capture_output=True,text=True);(S/'deployment-rollback.json').write_text(json.dumps({'returncode':result.returncode,'stdout':result.stdout,'stderr':result.stderr},indent=2));raise
receipt={'version':'1.4.31','release_epoch':started,'static_files_verified':len(plan['static_files']),'files_changed':len(changed),'archive_sha256':frozen['archive_sha256'],'manifest_sha256':frozen['manifest_sha256'],'common_headroom_before':free,'rollback':str(B/'rollback.sh'),'database_changes':0,'grants':0,'service_restarts':0,'nginx_changes':0,'duration_seconds':round(time.time()-started,3)};(S/'deployment.json').write_text(json.dumps(receipt,indent=2))
observer_config=json.loads((S/'observer-config.json').read_text());observer_config['release_epoch']=started;(S/'observer-config.json').write_text(json.dumps(observer_config,indent=2))
with (S/'observer.log').open('a') as log:process=subprocess.Popen(['python3',str(S/'producao31_observer.py')],stdin=subprocess.DEVNULL,stdout=log,stderr=subprocess.STDOUT,start_new_session=True)
receipt['observer_pid']=process.pid;(S/'deployment.json').write_text(json.dumps(receipt,indent=2));print(json.dumps(receipt))
