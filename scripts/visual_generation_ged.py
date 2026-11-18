"""Use the published frontend image with the existing isolated GED test API."""
import json,subprocess
from pathlib import Path
S=Path('/opt/concrefer-unificado/homolog-next/staging/visual-completo')
def inspect(n):return json.loads(subprocess.check_output(['docker','inspect',n]))[0]
back=inspect('ged_homolog_backend');published=inspect('ged_backend')
assert back['Image']==published['Image'],'GED API differs from published image'
old=inspect('ged_homolog_frontend');front=inspect('ged_frontend')
e=dict(x.split('=',1) for x in old['Config']['Env'] if '=' in x)
e.update({'PORT':'14170','HOSTNAME':'127.0.0.1','GED_INTERNAL_API_URL':'http://127.0.0.1:13171','NEXT_TELEMETRY_DISABLED':'1'})
file=Path('/etc/concrefer-unificado/homolog/visual-ged-frontend.env')
file.write_text(''.join(k+'='+v+'\n' for k,v in e.items()));file.chmod(0o600)
name='visual-homolog-ged-frontend'
if subprocess.run(['docker','inspect',name],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL).returncode:
 subprocess.run(['docker','run','-d','--name',name,'--network','host','--restart','unless-stopped','--env-file',str(file),front['Image'],*front['Config']['Cmd']],check=True,stdout=subprocess.DEVNULL)
result={'frontend':name,'port':14170,'frontend_published_image_identical':front['Image'],'backend_published_image_identical':back['Image'],'backend_reused_test_only':'ged_homolog_backend','database':'ged_concrefer_homolog','database_migrations':0,'production_containers_modified':False}
(S/'generation-ged.json').write_text(json.dumps(result,indent=2));print(json.dumps(result))
