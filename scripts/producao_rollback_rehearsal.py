"""18446-only static rollback rehearsal, retaining all homolog files."""
import hashlib,json,os,shutil,subprocess,sys,time
from pathlib import Path
H=Path('/opt/concrefer-unificado/homolog-next');S=H/'staging/producao-fase0-20261120';mode=sys.argv[1];manifest=json.loads((S/'candidate-manifest.json').read_text());files=[k for k in manifest if k.startswith(('public/','services/'))]
assert mode in ['previous','candidate']
count=int(subprocess.check_output(['sudo','-u','postgres','psql','-X','-qAt','-c','BEGIN READ ONLY;SELECT count(*) FROM pg_stat_activity;ROLLBACK;'],text=True).strip());assert count<=80,('CAPACITY_STOP',count)
def target(key):
 kind,rel=key.split('/',1);root=H/('public/unificado' if kind=='public' else 'visual-full');p=root/rel;assert p.resolve().is_relative_to(root);return p
def restore(src,dest):
 assert dest.resolve().is_relative_to(H)
 tmp=dest.with_name(dest.name+'.rehearsal-tmp');shutil.copy2(src,tmp);os.replace(tmp,dest)
receipt_path=S/'rollback-rehearsal.json'
if mode=='previous':
 assert not receipt_path.exists(),'Do not overwrite a completed rehearsal'
 B=H/'backups'/('production-rollback-rehearsal-'+str(int(time.time())));B.mkdir(mode=0o700)
 for key in files:
  src=target(key);dst=B/key;dst.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(src,dst)
 receipt={'snapshot':str(B),'started_epoch':time.time(),'static_files':len(files),'production_changes':0,'database_changes':0,'deleted_homolog_files':0}
 receipt_path.write_text(json.dumps(receipt,indent=2))
 try:
  original=H/'backups/freeze-production-20261120T164412Z'
  for key in sorted(files,key=lambda k:k=='public/VERSION'):restore(original/key,target(key))
  previous=H/'backups/modulos-colunas-20261120T155119Z';old=json.loads((previous/'original-files.json').read_text())
  for rel,exists in sorted(old.items(),key=lambda kv:kv[0]=='VERSION'):
   if exists:restore(previous/rel,H/'public/unificado'/rel)
  assert (H/'public/unificado/VERSION').read_text().strip()=='1.4.29'
 except Exception:
  for key in files:restore(B/key,target(key))
  raise
 receipt['previous_version']='1.4.29';receipt['previous_restored_epoch']=time.time();receipt_path.write_text(json.dumps(receipt,indent=2));print(json.dumps({'restored':'1.4.29','backup':str(B),'no_files_deleted':True}))
else:
 receipt=json.loads(receipt_path.read_text());B=Path(receipt['snapshot']);assert B.is_relative_to(H/'backups')
 for key in sorted(files,key=lambda k:(k=='public/VERSION',k)):restore(B/key,target(key))
 assert (H/'public/unificado/VERSION').read_text().strip()=='1.4.30'
 for key in files:assert hashlib.sha256(target(key).read_bytes()).hexdigest()==hashlib.sha256((B/key).read_bytes()).hexdigest()
 receipt.update(candidate_version='1.4.30',candidate_restored_epoch=time.time(),duration_seconds=round(time.time()-receipt['started_epoch'],2),restored_sha256_verified=True)
 receipt_path.write_text(json.dumps(receipt,indent=2));print(json.dumps(receipt))
