"""Read-only evaluation of a dimensional interval with no table reference."""
import base64
import hashlib
import hmac
import json
import shlex
import sys
import time
import urllib.request
from pathlib import Path

environment = sys.argv[1]
assert environment in {'stage', 'production'}
stage = environment == 'stage'
env_file = Path('/etc/concrefer-unificado/laboratorio-homolog.env' if stage else
                '/etc/concrefer-unificado/laboratorio.env')
port = 13065 if stage else 13064
values = {}
for line in env_file.read_text().splitlines():
    if '=' in line and not line.startswith('#'):
        key, value = line.split('=', 1)
        parts = shlex.split(value)
        values[key] = parts[0] if parts else ''
identity = {'id': 'smoke-manual-limits', 'name': 'Smoke Dimensional',
            'role': 'admin', 'exp': int(time.time()) + 30}
encoded = base64.urlsafe_b64encode(json.dumps(identity, separators=(',', ':')).encode()).rstrip(b'=').decode()
signature = base64.urlsafe_b64encode(hmac.new(
    values['LAB_GATEWAY_SIGNING_KEY'].encode(), encoded.encode(), hashlib.sha256).digest()).rstrip(b'=').decode()
url = f'http://127.0.0.1:{port}/api/calculo/avaliar'
body = {
    'numero_amostra': 'SMOKE SEM SALVAR',
    'poste': {'tipo': 'PL', 'face': 'B', 'conicidade': 'A', 'altura_m': 9, 'resistencia_daN': 300},
    'leituras': {'e1': False, 'e2': {'aplicavel': False}, 'e3': {}, 'e4': {}, 'e5': {}},
    'inspecao': {'checklist': {}, 'medidas': {
        'largura_base': {'min_mm': '100', 'max_mm': '120', 'leitura_mm': '110', 'origem': 'manual'}}},
}
request = urllib.request.Request(url, data=json.dumps(body).encode(), method='POST', headers={
    'Content-Type': 'application/json', 'X-Lab-Assertion': encoded + '.' + signature})
with urllib.request.urlopen(request, timeout=20) as response:
    result = json.load(response)
measure = result['inspecao']['medidas']['largura_base']
assert measure['status'] == 'DENTRO', measure
assert float(measure['min_mm']) == 100 and float(measure['max_mm']) == 120
print(f'{environment}: MANUAL_INTERVAL_OK; status={measure["status"]}')
