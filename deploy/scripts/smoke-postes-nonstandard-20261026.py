"""Read-only evaluation of a flagged pole with sourced nominal dimensions."""
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
    'numero_amostra': 'SMOKE NAO NORMATIZADO SEM SALVAR',
    'poste': {'tipo': 'C', 'face': 'C', 'conicidade': 'A', 'altura_m': 9,
              'resistencia_daN': 150, 'nao_normatizado_8451': True},
    'leituras': {'e1': False, 'e2': {'aplicavel': False}, 'e3': {}, 'e4': {}, 'e5': {}},
    'inspecao': {'checklist': {}, 'medidas': {
        'diametro_topo': {'min_mm': '120', 'max_mm': '130', 'leitura_mm': '125', 'origem': 'manual'},
        'diametro_base': {'min_mm': '290', 'max_mm': '300', 'leitura_mm': '295', 'origem': 'manual'}}},
}


def evaluate():
    request = urllib.request.Request(url, data=json.dumps(body).encode(), method='POST', headers={
        'Content-Type': 'application/json', 'X-Lab-Assertion': encoded + '.' + signature})
    with urllib.request.urlopen(request, timeout=20) as response:
        return json.load(response)


flagged = evaluate()['inspecao']['medidas']
assert flagged['diametro_topo']['status'] == 'DENTRO', flagged['diametro_topo']
assert flagged['diametro_base']['status'] == 'DENTRO', flagged['diametro_base']
assert float(flagged['diametro_base']['min_mm']) == 290
body['poste']['nao_normatizado_8451'] = False
ordinary = evaluate()['inspecao']['medidas']
assert ordinary['diametro_topo']['status'] == 'FORA', ordinary['diametro_topo']
assert ordinary['diametro_base']['status'] == 'FORA', ordinary['diametro_base']
print(f'{environment}: NONSTANDARD_MANUAL_TOP_BASE_OK; sourced_limits_protected=OK')
