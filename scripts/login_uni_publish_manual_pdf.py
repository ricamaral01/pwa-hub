"""Back up and atomically replace the isolated manual PDF header revision."""
import hashlib,json,os,shutil
from datetime import datetime,timezone
from pathlib import Path
H=Path('/opt/concrefer-unificado/homolog-next');O=H/'staging/login-uni-20261120';P=H/'visual-full/carta-static/manual/manual-carta-traco.pdf';source=O/'login-uni-manual-after.pdf';check=json.loads((O/'manual-pdf-check.json').read_text());assert P.resolve().is_relative_to(H/'visual-full')
assert hashlib.sha256(P.read_bytes()).hexdigest()==check['before_sha256']
assert hashlib.sha256(source.read_bytes()).hexdigest()==check['after_sha256']
B=H/'backups'/('login-uni-manual-'+datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ'));B.mkdir(mode=0o700);shutil.copy2(P,B/P.name)
temp=P.with_name(P.name+'.login-uni-tmp');shutil.copy2(source,temp);temp.chmod(0o644);os.replace(temp,P)
result={'backup':str(B),'file':str(P),'before_sha256':check['before_sha256'],'after_sha256':check['after_sha256'],'services_restarted':False,'only_cover_header_changed':True,'body_preserved':True,'rollback':'cp --preserve=all '+str(B/P.name)+' '+str(P),'production_changed':False}
(O/'manual-pdf-deploy.json').write_text(json.dumps(result,indent=2));print(json.dumps(result))
