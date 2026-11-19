"""Remove an unused remote font import from the isolated GED static CSS only."""
import json,re,subprocess,hashlib
from pathlib import Path
from datetime import datetime,timezone
S=Path('/opt/concrefer-unificado/homolog-next/staging/visual-completo/revisao-completa');assert Path(__file__).resolve().parent==S
name='visual-homolog-ged-frontend';info=json.loads(subprocess.check_output(['docker','inspect',name]))[0]
assert not info['Mounts'],'Never edit a shared bind mount'
assert 'GED_INTERNAL_API_URL=http://127.0.0.1:13171' in info['Config']['Env']
paths=subprocess.check_output(['docker','exec',name,'find','/app/.next/static','-type','f','-name','*.css'],text=True).splitlines()
results=[]
backup=Path('/opt/concrefer-unificado/homolog-next/backups')/('ged-font-'+datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ'));backup.mkdir(mode=0o700)
for target in paths:
 assert target.startswith('/app/.next/static/') and target.endswith('.css') and '..' not in target
 raw=subprocess.check_output(['docker','exec',name,'cat',target]);text=raw.decode()
 patched=re.sub(r'@import\s+(?:url\()?\s*[\x22\x27]?https://fonts\.googleapis\.com/[^;]+;', '',text)
 if patched==text:continue
 assert 'fonts.googleapis.com' not in patched
 old=backup/Path(target).name;old.write_bytes(raw)
 local=S/('ged-'+Path(target).name);local.write_text(patched,encoding='utf-8');local.chmod(0o644)
 subprocess.run(['docker','cp',str(local),name+':'+target],check=True)
 actual=subprocess.check_output(['docker','exec',name,'cat',target]);assert actual==patched.encode()
 results.append({'container':name,'image_unchanged':info['Image'],'static_css':target,'backup':str(old),'before_sha256':hashlib.sha256(raw).hexdigest(),'after_sha256':hashlib.sha256(actual).hexdigest(),'import_removed_only':True,'api_changes':0,'restarts':0})
assert results or (S/'ged-fonts.json').exists()
if results:(S/'ged-fonts.json').write_text(json.dumps(results,indent=2))
print((S/'ged-fonts.json').read_text())
