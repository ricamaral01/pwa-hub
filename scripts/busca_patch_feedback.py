"""Add correction/synonym feedback to existing module filters; static files only."""
import hashlib,json,os,shutil,tarfile
from datetime import datetime,timezone
from pathlib import Path
H=Path('/opt/concrefer-unificado/homolog-next');O=H/'staging/busca-20261120';P=H/'public/unificado';D=O/'feedback-patch';D.mkdir(exist_ok=True)
assert (P/'VERSION').read_text().strip()=='1.4.29'
allowed={'shell/busca.js','shell/busca.css','shell/module-pages.js','shell/module-pages-mobile.js','logistica/logistica-native.js'};manifest=json.loads((O/'release-manifest.json').read_text())
with tarfile.open(O/'feedback-patch.tgz') as archive:
 for member in archive.getmembers():assert member.isfile() and member.name in allowed
 archive.extractall(D,filter='data')
B=H/'backups'/('busca-feedback-'+datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ'));B.mkdir(mode=0o700);shutil.copy2(O/'release-manifest.json',B/'release-manifest.json')
for rel in allowed:
 assert hashlib.sha256((P/rel).read_bytes()).hexdigest()==manifest[rel]
 saved=B/rel;saved.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(P/rel,saved)
try:
 for rel in sorted(allowed):
  dest=P/rel;temp=dest.with_name(dest.name+'.feedback-tmp');shutil.copy2(D/rel,temp);temp.chmod(0o644);os.replace(temp,dest);manifest[rel]=hashlib.sha256(dest.read_bytes()).hexdigest()
 (O/'release-manifest.json').write_text(json.dumps(manifest,indent=2))
except Exception:
 for rel in allowed:shutil.copy2(B/rel,P/rel)
 raise
result={'backup':str(B),'files':sorted(allowed),'services_restarted':False,'database_writes':0,'production_changed':False,'rollback':'restore these files and release-manifest.json from this backup; full rollback remains the original busca_rollback.py backup'}
(O/'feedback-patch.json').write_text(json.dumps(result,indent=2));print(json.dumps(result))
