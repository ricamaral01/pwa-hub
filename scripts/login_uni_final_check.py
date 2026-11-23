"""Capture final live checks as UTF-8; static hashes and read-only production audit."""
import hashlib,json,os,subprocess,sys
from pathlib import Path
import requests
R=Path(__file__).resolve().parents[1];O=R/'docs/revisao-visual-unificado/homolog/login-uni-20261120';BASE='https://concrefer.concretrack.com.br:18446'
env={**os.environ,'UNIFICADO_BASE_URL':BASE,'PCP_ANON_EXPECTED':'401','PYTHONIOENCODING':'utf-8'}
result=subprocess.run([sys.executable,'tests/unificado/modelo_a_gate.py'],cwd=R,env=env,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,check=True);text=result.stdout.decode('utf-8').replace('\r\n','\n');assert 'Gate Modelo A: 7/7' in text;(O/'gate.txt').write_text(text,encoding='utf-8',newline='\n')
assert requests.get(BASE+'/unificado/VERSION',timeout=20).text.strip()=='1.4.27'
notice=requests.get(BASE+'/unificado/shell/aviso.json',timeout=20).json();assert notice['ativo'] is False
manifest=requests.get(BASE+'/unificado/manifest.webmanifest',timeout=20).json();assert manifest['name']==manifest['short_name']=='Uni' and manifest['id']=='/unificado/mapa/operacao/index.html'
remote=r'''
import hashlib,json
from pathlib import Path
H=Path('/opt/concrefer-unificado/homolog-next');O=H/'staging/login-uni-20261120';manifest=json.loads((O/'release-manifest.json').read_text());errors=[]
for rel,digest in manifest.items():
 p=H/'public/unificado'/rel
 if hashlib.sha256(p.read_bytes()).hexdigest()!=digest:errors.append(rel)
assert not errors,errors
print(json.dumps({'files_verified':len(manifest),'all_equal':True}))
'''
verify=subprocess.run(['ssh','-o','BatchMode=yes','vps-concrefer','python3','-'],input=remote.encode('utf-8'),stdout=subprocess.PIPE,stderr=subprocess.PIPE,check=True);hashes=json.loads(verify.stdout)
audit=subprocess.run(['ssh','-o','BatchMode=yes','vps-concrefer','python3','-','after'],input=(R/'scripts/login_uni_preflight.py').read_bytes(),stdout=subprocess.PIPE,stderr=subprocess.PIPE,check=True);summary=json.loads(audit.stdout);assert summary['ok'],summary
subprocess.run(['scp','-q','vps-concrefer:/opt/concrefer-unificado/homolog-next/staging/login-uni-20261120/after.json',str(O/'production-after.json')],check=True)
final={'version':'1.4.27','gate':'7/7','published_notice_active':False,'manifest_id_preserved':True,'hashes':hashes,'audit':summary,'real_positive_password_login_waived_by_user':True,'push':False,'production_deployed':False}
(O/'final-check.json').write_text(json.dumps(final,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps(final,ensure_ascii=True))
