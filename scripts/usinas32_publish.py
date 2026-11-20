"""Run on the VPS: static 18446 publication/rollback, never production paths."""
import hashlib,json,os,shutil,subprocess,sys,tarfile,time
from pathlib import Path
H=Path('/opt/concrefer-unificado/homolog-next');S=H/'staging/usinas-sobreposicao-1.4.32';context=Path(__file__).resolve().parent;context=context if context.parent==H/'backups' else S;m=json.loads((context/'release-manifest.json').read_text());mode=sys.argv[1] if len(sys.argv)>1 else 'publish';assert mode in ['publish','rollback']
def target(key,row):
 p=Path(row['destination']);assert p.resolve().is_relative_to(H.resolve()) and p==H/('public/unificado' if key.startswith('public/') else 'visual-full')/key.split('/',1)[1];return p
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def put(path,data):
 temp=path.with_name(path.name+'.usinas32.tmp');temp.write_bytes(data);temp.chmod(0o644);os.replace(temp,path)
if mode=='rollback':
 receipt=json.loads((context/'deployment.json').read_text());B=Path(receipt['backup']);assert B.resolve().parent==H/'backups'
 for key,row in sorted(m.items(),key=lambda r:r[0]=='public/VERSION'):
  p=target(key,row)
  if row['before']:
   backup=B/key;assert sha(backup)==row['before']['sha256'];put(p,backup.read_bytes())
  elif p.exists():assert sha(p)==row['after']['sha256'];p.unlink()
 assert (H/'public/unificado/VERSION').read_text().strip()=='1.4.31';print(json.dumps({'restored':'1.4.31','production_changes':0,'restarts':0}));raise SystemExit()
n=int(subprocess.check_output(['sudo','-u','postgres','psql','-X','-qAt','-c','BEGIN READ ONLY;SELECT count(*) FROM pg_stat_activity;ROLLBACK;'],text=True).strip());assert n<=80,('CAPACITY_STOP',n);assert (H/'public/unificado/VERSION').read_text().strip()=='1.4.31';D=S/'release';D.mkdir(exist_ok=True)
with tarfile.open(S/'release.tgz') as tar:
 for entry in tar.getmembers():assert entry.isfile() and entry.name in m and '..' not in Path(entry.name).parts
 tar.extractall(D,filter='data')
for key,row in m.items():
 p=target(key,row);assert sha(D/key)==row['after']['sha256']
 if row['before']:assert sha(p)==row['before']['sha256'],('Concurrent homolog change',key)
 else:assert not p.exists(),key
B=H/'backups'/('usinas-sobreposicao-1.4.32-'+str(int(time.time())));B.mkdir(mode=0o700)
for key,row in m.items():
 if row['before']:
  p=B/key;p.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(target(key,row),p)
shutil.copy2(S/'release-manifest.json',B/'release-manifest.json');shutil.copy2(S/'usinas32_publish.py',B/'rollback.py');receipt={'version':'1.4.32','backup':str(B),'files':len(m),'connections_before':n,'production_changes':0,'database_changes':0,'permissions_changes':0,'service_restarts':0,'rollback':'python3 '+str(S/'usinas32_publish.py')+' rollback'};(S/'deployment.json').write_text(json.dumps(receipt,indent=2));shutil.copy2(S/'deployment.json',B/'deployment.json')
try:
 for key,row in sorted(m.items(),key=lambda r:(r[0]=='public/VERSION',r[0]=='public/sw.js',r[0].endswith('.html'),r[0])):put(target(key,row),(D/key).read_bytes())
 for key,row in m.items():assert sha(target(key,row))==row['after']['sha256'],key
except Exception:
 for key,row in m.items():
  p=target(key,row)
  if row['before']:put(p,(B/key).read_bytes())
  elif p.exists():p.unlink()
 raise
print(json.dumps(receipt))
