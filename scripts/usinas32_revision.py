"""Add the shell-scoped Noroeste CSS; preserve the original 1.4.31 backup."""
import hashlib,json,os,shutil,subprocess,tarfile,time
from pathlib import Path
H=Path('/opt/concrefer-unificado/homolog-next');S=H/'staging/usinas-sobreposicao-1.4.32';old=json.loads((S/'release-manifest.json').read_text());new=json.loads((S/'revision-manifest.json').read_text());receipt=json.loads((S/'deployment.json').read_text());B=Path(receipt['backup']);assert B.resolve().parent==H/'backups';assert (H/'public/unificado/VERSION').read_text().strip()=='1.4.32'
n=int(subprocess.check_output(['sudo','-u','postgres','psql','-X','-qAt','-c','BEGIN READ ONLY;SELECT count(*) FROM pg_stat_activity;ROLLBACK;'],text=True).strip());assert n<=80
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def put(path,data):
 tmp=path.with_name(path.name+'.usinas32-rev.tmp');tmp.write_bytes(data);tmp.chmod(0o644);os.replace(tmp,path)
for key,row in new.items():
 p=Path(row['destination']);assert p.resolve().is_relative_to(H)
 if key in old:assert row['before']==old[key]['before'] and sha(p)==old[key]['after']['sha256']
 else:assert key=='public/shell/noroeste-content.css' and row['before'] is None and not p.exists()
D=S/'revision'
with tarfile.open(S/'revision.tgz') as tar:
 for f in tar.getmembers():assert f.isfile() and f.name in new and '..' not in Path(f.name).parts
 tar.extractall(D,filter='data')
for key,row in new.items():assert sha(D/key)==row['after']['sha256']
changed=[k for k in new if k not in old or old[k]['after']!=new[k]['after']];P=S/'before-noroeste-revision';P.mkdir(mode=0o700,exist_ok=True)
for key in changed:
 p=Path(new[key]['destination'])
 if p.exists():q=P/key;q.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(p,q)
try:
 for key in sorted(changed,key=lambda k:k=='public/sw.js'):put(Path(new[key]['destination']),(D/key).read_bytes())
 for key,row in new.items():assert sha(Path(row['destination']))==row['after']['sha256']
except Exception:
 for key in changed:
  p=Path(new[key]['destination']);q=P/key
  if q.exists():put(p,q.read_bytes())
  elif p.exists():p.unlink()
 raise
shutil.copy2(S/'revision-manifest.json',S/'release-manifest.json');shutil.copy2(S/'revision.tgz',S/'release.tgz');shutil.copy2(S/'release-manifest.json',B/'release-manifest.json');receipt.update(files=len(new),noroeste_revision={'files':changed,'at_epoch':time.time(),'original_backup_preserved':True,'connections':n});(S/'deployment.json').write_text(json.dumps(receipt,indent=2));shutil.copy2(S/'deployment.json',B/'deployment.json');print(json.dumps(receipt))
