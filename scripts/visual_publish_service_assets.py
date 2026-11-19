"""Publish only allowlisted public static files of the isolated Lab generation."""
import hashlib,json,os,shutil,subprocess,tarfile,sys
from pathlib import Path
from datetime import datetime,timezone
H=Path('/opt/concrefer-unificado/homolog-next');G=H/'visual-full';S=Path(__file__).resolve().parent
assert S.is_relative_to(H/'staging')
phase=sys.argv[1] if len(sys.argv)>1 else 'fase-5'
assert phase in ('fase-5','fase-7')
manifest=json.loads((S/'service-manifest.json').read_text());release=S/'service-release';release.mkdir(exist_ok=True)
prefixes=['laboratorio/server/static/','carta-static/','dosagem-static/']
with tarfile.open(S/'service-static.tgz') as a:
 for m in a.getmembers():
  assert m.isfile() and any(m.name.startswith(p) for p in prefixes) and '..' not in Path(m.name).parts
 a.extractall(release,filter='data')
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
backup=H/'backups'/('visual-service-'+phase+'-'+datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ'));backup.mkdir(mode=0o700)
old={}
for r,h in manifest.items():
 assert any(r.startswith(p) for p in prefixes) and (G/r).resolve().is_relative_to(G)
 assert Path(r).suffix in ('.html','.css','.js','.woff2'),r
 assert sha(release/r)==h
 p=G/r;old[r]=p.exists()
 if p.exists():
  q=backup/r;q.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(p,q)
try:
 # New chunk URLs must be present before entry documents reference them.
 for r in sorted(manifest,key=lambda r:(r.endswith('.html'),r)):
  p=G/r;p.parent.mkdir(parents=True,exist_ok=True);tmp=p.with_name(p.name+'.visual-tmp');shutil.copy2(release/r,tmp);tmp.chmod(0o644);os.replace(tmp,p)
  for ancestor in p.parents:
   if ancestor==G:break
   if ancestor.is_relative_to(G):ancestor.chmod(0o755)
 for r,h in manifest.items():assert sha(G/r)==h,r
 subprocess.run(['python3',str(H/'staging/visual-completo/visual_generation_audit.py')],check=True)
except Exception:
 for r,existed in old.items():
  if existed:shutil.copy2(backup/r,G/r)
  else:(G/r).unlink(missing_ok=True)
 raise
result={'phase':phase,'static_files':len(manifest),'backup':str(backup),'production_untouched':True,'services_restarted':False,'api_code_changed':False}
(S/'service-deploy-results.json').write_text(json.dumps(result,indent=2));print(json.dumps(result))
