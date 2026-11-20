"""Back up and update only search.js after the published keyboard/focus check."""
import hashlib,json,os,shutil
from datetime import datetime,timezone
from pathlib import Path
H=Path('/opt/concrefer-unificado/homolog-next');O=H/'staging/busca-20261120';P=H/'public/unificado';rel='shell/busca.js';source=O/'busca-focus.js';dest=P/rel
assert (P/'VERSION').read_text().strip()=='1.4.29'
manifest=json.loads((O/'release-manifest.json').read_text());assert hashlib.sha256(dest.read_bytes()).hexdigest()==manifest[rel]
B=H/'backups'/('busca-foco-'+datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ'));B.mkdir(mode=0o700);shutil.copy2(dest,B/'busca.js');shutil.copy2(O/'release-manifest.json',B/'release-manifest.json')
temp=dest.with_name('busca.js.focus-tmp');shutil.copy2(source,temp);temp.chmod(0o644);os.replace(temp,dest);manifest[rel]=hashlib.sha256(dest.read_bytes()).hexdigest();(O/'release-manifest.json').write_text(json.dumps(manifest,indent=2))
result={'backup':str(B),'file':rel,'change':'restore focus outside a closed dialog; preserve initial focus on repeated open requests','services_restarted':False,'production_changed':False,'rollback':'restore busca.js to public/unificado/shell/busca.js and release-manifest.json to staging from this backup; no restart'}
(O/'focus-patch.json').write_text(json.dumps(result,indent=2));print(json.dumps(result))
