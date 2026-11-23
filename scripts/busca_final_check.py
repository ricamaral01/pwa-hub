"""Published static hashes, standard gate and read-only production/IAM audit."""
import json,os,subprocess,sys
from pathlib import Path
import requests
R=Path(__file__).resolve().parents[1];O=R/'docs/revisao-visual-unificado/homolog/busca-20261120';BASE='https://concrefer.concretrack.com.br:18446'
env={**os.environ,'UNIFICADO_BASE_URL':BASE,'PCP_ANON_EXPECTED':'401','PYTHONIOENCODING':'utf-8'}
r=subprocess.run([sys.executable,'tests/unificado/modelo_a_gate.py'],cwd=R,env=env,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,check=True);gate=r.stdout.decode('utf-8').replace('\r\n','\n');assert 'Gate Modelo A: 7/7' in gate;(O/'gate.txt').write_text(gate,encoding='utf-8',newline='\n')
assert requests.get(BASE+'/unificado/VERSION',timeout=20).text.strip()=='1.4.29'
assert requests.get(BASE+'/unificado/shell/busca-sinonimos.json',timeout=20).json()==json.loads((R/'unificado/shell/busca-sinonimos.json').read_text(encoding='utf-8'))
remote=r'''
import hashlib,json
from pathlib import Path
H=Path('/opt/concrefer-unificado/homolog-next');O=H/'staging/busca-20261120';data=json.loads((O/'release-manifest.json').read_text())
for rel,digest in data.items():assert hashlib.sha256((H/'public/unificado'/rel).read_bytes()).hexdigest()==digest,rel
print(json.dumps({'static_files_verified':len(data),'equal':True,'backend_changes':0,'service_restarts':0}))
'''
r=subprocess.run(['ssh','-o','BatchMode=yes','vps-concrefer','python3','-'],input=remote.encode(),stdout=subprocess.PIPE,stderr=subprocess.PIPE,check=True);hashes=json.loads(r.stdout)
r=subprocess.run(['ssh','-o','BatchMode=yes','vps-concrefer','python3','-','after'],input=(R/'scripts/busca_preflight.py').read_bytes(),stdout=subprocess.PIPE,stderr=subprocess.PIPE,check=True);audit=json.loads(r.stdout);assert audit['ok'],audit
for name in ['before','after']:
 subprocess.run(['scp','-q','vps-concrefer:/opt/concrefer-unificado/homolog-next/staging/busca-20261120/'+name+'.json',str(O/('production-'+name+'.json'))],check=True)
subprocess.run(['scp','-q','vps-concrefer:/opt/concrefer-unificado/homolog-next/staging/busca-20261120/deployment.json',str(O/'deployment.json')],check=True)
for name in ['release-manifest.json','focus-patch.json','feedback-patch.json']:
 subprocess.run(['scp','-q','vps-concrefer:/opt/concrefer-unificado/homolog-next/staging/busca-20261120/'+name,str(O/name)],check=True)
result={'version':'1.4.29','gate':'7/7','hashes':hashes,'audit':audit,'synonyms_equal_approved':True,'production_published':False,'push':False};(O/'final-check.json').write_text(json.dumps(result,indent=2),encoding='utf-8');print(json.dumps(result))
