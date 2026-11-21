"""Authorized homolog-only continuation, separate evidence from the local candidate."""
import json,subprocess
from pathlib import Path
R=Path(__file__).resolve().parents[1]
O=R/'docs/revisao-visual-unificado/homolog/laboratorio-210-live-20261121'
S='/opt/concrefer-unificado/homolog-next/staging/laboratorio-210-live-20261121'
BASE='https://concrefer.concretrack.com.br:18446'
O.mkdir(parents=True,exist_ok=True)
def remote(code,python='python3'):
 p=subprocess.run(['ssh','vps-concrefer',python,'-'],input=code.encode('utf-8'),capture_output=True)
 if p.returncode:raise RuntimeError(p.stderr.decode('utf-8',errors='replace')[-2500:])
 return json.loads(p.stdout)
def save(name,value):
 (O/name).write_text(json.dumps(value,ensure_ascii=False,indent=2),encoding='utf-8')
def upload(path):
 subprocess.run(['scp',str(path),'vps-concrefer:'+S+'/'+Path(path).name],check=True,capture_output=True)
def activity():
 return remote("from pathlib import Path;import json;p=Path('/opt/concrefer-unificado/homolog-next/staging/conexoes-banco-20261120/collector.py');n={'__file__':str(p)};exec(p.read_text().split('started=time.time();')[0],n);print(json.dumps(n['snapshot'](n['docker_map']())))")
def under_limit(label):
 snapshot=activity();save('activity-'+label+'.json',snapshot)
 if snapshot['total_activity']>80:raise RuntimeError('CAPACITY_PAUSED '+str(snapshot['total_activity'])+' activity records at '+label)
 return snapshot
