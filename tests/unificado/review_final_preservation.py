"""Read existing emitted PDFs; compare their raw SHA-256 to the approved baseline."""
import hashlib,json
from pathlib import Path
import requests
from visual_phase05_sessions import sessions
R=Path(__file__).resolve().parents[2];O=R/'docs/revisao-visual-unificado/homolog/revisao-final'
BASE='https://concrefer.concretrack.com.br:18446'
d=sessions()['ADMIN'];session=requests.Session();session.headers['Authorization']='Bearer '+d['token']
session.cookies.set('mapa_unificado_homolog_session',d['cookie'],domain='concrefer.concretrack.com.br',path='/unificado/')
baseline=json.loads((O.parent/'fase-4/flows-results.json').read_text(encoding='utf-8'));checks=[]
for kind,key,path,screen in [('armaduras','armaduras_emission','armaduras','armadurasRelatorio'),('series','series_emission','postes-series','postesNumerosSerie')]:
    r=session.get(BASE+'/unificado/pcp/api/'+path+'/emissoes/'+str(baseline[key]['id'])+'/pdf',headers={'X-Unificado-Screen':screen},timeout=40)
    assert r.status_code==200
    digest=hashlib.sha256(r.content).hexdigest();expected=baseline[kind+'_pdf_sha256']
    checks.append({'kind':kind,'sha256':digest,'baseline_sha256':expected,'identical':digest==expected})
assert all(row['identical'] for row in checks),checks
(O/'pdf-verification.json').write_text(json.dumps(checks,indent=2));print(json.dumps(checks))
