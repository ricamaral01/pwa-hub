"""Update only recovery metadata inside the existing private production backup."""
import hashlib,json,os,shutil,subprocess
from pathlib import Path
R=Path('/opt/concrefer-unificado');S=R/'homolog-next/staging/producao-1.4.31';plan=json.loads((S/'deployment-plan.json').read_text());frozen=json.loads((S/'frozen.json').read_text());B=Path(plan['production_backup']);assert B.parent==R/'backups' and B.name=='producao-20261120T170515Z';os.umask(0o077)
def sha(p):
 h=hashlib.sha256()
 with p.open('rb') as f:
  for c in iter(lambda:f.read(4194304),b''):h.update(c)
 return h.hexdigest()
assert sha(Path(plan['production_backup_original_bundle']))==plan['production_backup_original_sha256']
meta=json.loads((B/'backup-manifest.json').read_text())
for name,expected in meta['files'].items():
 p=B/name;assert p.stat().st_size==expected['bytes'] and sha(p)==expected['sha256'],name
old=json.loads((B/'deployment-plan.json').read_text());assert {r['file'] for r in old['static_files']}=={r['file'] for r in plan['static_files']}
assert all(plan[k]==[] for k in ['migrations_to_apply','permissions_to_change','backend_patches','services_to_restart','nginx_changes'])
release=B/'releases/1.4.31';assert not release.exists();(release/'history').mkdir(parents=True,mode=0o700)
for name in ['deployment-plan.json','rollback.sh','backup-manifest.json']:shutil.copy2(B/name,release/'history'/name)
for name in ['candidate.tgz','candidate-manifest.json','frozen.json','deployment-plan.json']:shutil.copy2(S/name,release/name)
assert sha(release/'candidate.tgz')==frozen['archive_sha256']
shutil.copy2(S/'deployment-plan.json',B/'deployment-plan.json')
(B/'rollback.sh').write_text('#!/bin/sh\n# Frozen 1.4.31 -> original 1.4.6. Static files only.\nset -eu\nB=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)\nif [ "${1:-}" = "--verify-only" ]; then exec python3 "$B/rollback.py"; fi\nexec python3 "$B/rollback.py" --apply\n');(B/'rollback.sh').chmod(0o700)
dry=subprocess.run([str(B/'rollback.sh'),'--verify-only'],check=True,capture_output=True,text=True);dry_result=json.loads(dry.stdout)
for name in ['deployment-plan.json','rollback.sh']:
 p=B/name;meta['files'][name]={'bytes':p.stat().st_size,'sha256':sha(p)}
for p in release.rglob('*'):
 if p.is_file():meta['files'][p.relative_to(B).as_posix()]={'bytes':p.stat().st_size,'sha256':sha(p)}
meta['current_candidate']='1.4.31';meta['rollback_verify_only_1_4_31']=dry_result;meta['production_data_archives_unchanged']=True;(B/'backup-manifest.json').write_text(json.dumps(meta,indent=2))
bundle=B.parent/(B.name+'-1.4.31.tar.gz');assert not bundle.exists();subprocess.run(['tar','--use-compress-program=gzip -1','-cf',str(bundle),'-C',str(B.parent),B.name],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.PIPE);bundle.chmod(0o600);subprocess.run(['tar','-tzf',str(bundle)],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.PIPE)
result={'directory':str(B),'bundle':str(bundle),'bytes':bundle.stat().st_size,'sha256':sha(bundle),'rollback':str(B/'rollback.sh'),'recovery_plan_version':'1.4.31','dry_run':dry_result,'verified_original_dumps':len(meta['dumps']),'original_bundle_sha256':plan['production_backup_original_sha256'],'original_data_archives_unchanged':True,'production_app_changes':0,'production_db_changes':0};(S/'recovery.json').write_text(json.dumps(result,indent=2));print(json.dumps(result))
