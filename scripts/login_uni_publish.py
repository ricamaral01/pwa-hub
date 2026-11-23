"""Publish only the reviewed static files in the isolated 18446 document root."""
import hashlib,json,os,shutil,subprocess,tarfile
from pathlib import Path
from datetime import datetime,timezone
H=Path('/opt/concrefer-unificado/homolog-next');O=H/'staging/login-uni-20261120';P=H/'public/unificado';D=O/'release';D.mkdir(exist_ok=True)
assert (P/'VERSION').read_text().strip() in ['1.4.26','1.4.27']
count=int(subprocess.check_output(['sudo','-u','postgres','psql','-X','-qAt','-c','BEGIN READ ONLY; SELECT count(*) FROM pg_stat_activity; ROLLBACK;'],text=True).strip())
assert count<=80,('CAPACITY_STOP',count)
manifest=json.loads((O/'release-manifest.json').read_text())
with tarfile.open(O/'release.tgz') as t:
 for member in t.getmembers():assert member.isfile() and member.name in manifest and not Path(member.name).is_absolute() and '..' not in Path(member.name).parts
 t.extractall(D,filter='data')
backup=H/'backups'/('login-uni-'+datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ'));backup.mkdir(mode=0o700)
existing={}
for rel,digest in manifest.items():
 assert Path(rel).suffix in {'.html','.js','.css','.json','.webmanifest','.svg'} or rel=='VERSION'
 assert not {'api','backend','service','node_modules','armacao'}.intersection(Path(rel).parts)
 dest=P/rel;assert dest.resolve().is_relative_to(P)
 assert hashlib.sha256((D/rel).read_bytes()).hexdigest()==digest
 existing[rel]=dest.exists()
 if dest.exists():saved=backup/rel;saved.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(dest,saved)
(backup/'original-files.json').write_text(json.dumps(existing,indent=2))
try:
 for rel in sorted(manifest,key=lambda p:(3 if p=='VERSION' else 2 if p=='sw.js' else 1 if p.endswith('.html') else 0,p)):
  dest=P/rel;dest.parent.mkdir(parents=True,exist_ok=True);temp=dest.with_name(dest.name+'.login-uni-tmp');shutil.copy2(D/rel,temp);temp.chmod(0o644);os.replace(temp,dest)
 for rel,digest in manifest.items():assert hashlib.sha256((P/rel).read_bytes()).hexdigest()==digest
except Exception:
 for rel,was_present in existing.items():
  if was_present:shutil.copy2(backup/rel,P/rel)
  else:(P/rel).unlink(missing_ok=True)
 raise
result={'version':'1.4.27','origin_port':18446,'backup':str(backup),'static_files':len(manifest),'connections_before':count,'services_restarted':False,'database_writes':0,'notice_active':False,'production_changed':False,'rollback':'python3 '+str(O/'login_uni_rollback.py')+' '+str(backup)}
(O/'deployment.json').write_text(json.dumps(result,indent=2));print(json.dumps(result))
