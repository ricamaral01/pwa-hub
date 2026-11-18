"""Static-only deployment with backups, hash checks and rollback; port 18446."""
import hashlib,json,os,shutil,subprocess,sys,tarfile
from datetime import datetime,timezone
from pathlib import Path
HOM=Path('/opt/concrefer-unificado/homolog-next');PROD=Path('/opt/concrefer-unificado/public/unificado')
stage=Path(__file__).resolve().parent;assert stage.is_relative_to(HOM/'staging')
phase=sys.argv[1];assert phase in tuple('fase-'+str(n) for n in range(1,8))
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def production():
 result={str(p.relative_to(PROD)):sha(p) for p in PROD.rglob('*') if p.is_file()}
 result['services']=subprocess.check_output(['systemctl','show','mapa-unificado-auth.service','pcp-unificado-test.service','concrefer-armacao.service','-p','MainPID','-p','ExecMainStartTimestamp'],text=True)
 result['nginx']=sha(Path('/etc/nginx/sites-enabled/concrefer.concretrack.com.br'))
 return result
before=production();manifest=json.loads((stage/'manifest.json').read_text());dest=HOM/'public/unificado'
backup=HOM/'backups'/('visual-'+phase+'-'+datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ'));backup.mkdir(mode=0o700)
(backup/'production-before.json').write_text(json.dumps(before))
source=stage/'release';source.mkdir(exist_ok=True)
with tarfile.open(stage/'public.tgz') as a:
 for m in a.getmembers():assert m.isfile() and '..' not in Path(m.name).parts and not Path(m.name).is_absolute()
 a.extractall(source)
old={}
for r,h in manifest.items():
 assert not any(x in Path(r).parts for x in ['api','backend','service','..'])
 assert sha(source/r)==h
 p=dest/r;assert p.resolve().is_relative_to(dest)
 old[r]=p.exists()
 if p.exists():
  q=backup/r;q.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(p,q)
try:
 for r in manifest:
  p=dest/r;p.parent.mkdir(parents=True,exist_ok=True);tmp=p.with_name(p.name+'.visual-tmp');shutil.copy2(source/r,tmp);os.replace(tmp,p)
 if {'index.html','login.html'} & set(manifest):
  subprocess.run(['python3',str(stage/'mark_unificado_homolog.py'),'--root',str(dest)],check=True)
 assert before==production(),'Production changed'
 for r,h in manifest.items():
  if r not in ('index.html','login.html'):assert sha(dest/r)==h,r
except Exception:
 for r,existed in old.items():
  if existed:shutil.copy2(backup/r,dest/r)
  else:(dest/r).unlink(missing_ok=True)
 raise
result={'phase':phase,'backup':str(backup),'files':len(manifest),'version':(dest/'VERSION').read_text().strip(),'production_files_pids_nginx_unchanged':True,'api_or_database_changes':False}
(stage/'deploy-results.json').write_text(json.dumps(result,indent=2));print(json.dumps(result))
