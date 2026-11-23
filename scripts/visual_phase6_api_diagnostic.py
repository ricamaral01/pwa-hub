"""Read-only diagnostics; credentials remain in memory."""
import json,sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'tests/unificado'))
import requests
from homolog_session import test_cookie_for
s=requests.Session();s.cookies.set('mapa_unificado_homolog_session',test_cookie_for('user-ricardo'),domain='concrefer.concretrack.com.br',path='/unificado/')
base='https://concrefer.concretrack.com.br:18446'
for path in ['/unificado/mapa/api/tools/manutencao-usina','/unificado/logistica/api/contexto','/unificado/qualidade/api/contexto']:
 r=s.get(base+path,timeout=30);print(path,r.status_code,r.text[:900])
