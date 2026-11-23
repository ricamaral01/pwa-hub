"""Release orchestration; secrets remain on the VPS and outside Git."""
import json,subprocess
from pathlib import Path
R=Path(__file__).resolve().parents[1]
O=R/'docs/revisao-visual-unificado/producao-laboratorio-210-20261122/execucao'
S='/opt/concrefer-unificado/staging/lab210-production-20261122'
O.mkdir(parents=True,exist_ok=True)
def remote(code,python='python3'):
    p=subprocess.run(['ssh','vps-concrefer',python,'-'],input=code.encode(),capture_output=True)
    if p.returncode:raise RuntimeError(p.stderr.decode('utf-8',errors='replace')[-3500:])
    return json.loads(p.stdout)
def save(name,data):
    (O/name).write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
def upload(script):
    remote("from pathlib import Path;import json;p=Path("+repr(S)+");p.mkdir(parents=True,exist_ok=True,mode=0o700);p.chmod(0o700);print(json.dumps({'ready':True}))")
    subprocess.run(['scp',str(R/'scripts'/script),'vps-concrefer:'+S+'/'+script],capture_output=True,check=True)
def invoke(script,action,python='python3'):
    code="import runpy,sys;sys.path.insert(0,"+repr(S)+");sys.argv=["+repr(script)+","+repr(action)+"];runpy.run_path("+repr(S+'/'+script)+",run_name='__main__')"
    result=remote(code,python);save(action+'.json',result);return result
def activity():
    return remote("from pathlib import Path;import json;p=Path('/opt/concrefer-unificado/homolog-next/staging/conexoes-banco-20261120/collector.py');n={'__file__':str(p)};exec(p.read_text().split('started=time.time();')[0],n);s=n['snapshot'](n['docker_map']());print(json.dumps({k:s[k] for k in ['total_activity','client_connections','common_headroom_excluding_collector','by_service']}))")
