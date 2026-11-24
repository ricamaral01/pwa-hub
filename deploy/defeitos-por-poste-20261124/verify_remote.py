"""Validate the deployed HTTP API using a temporary signed session, without writes."""
import json
import os
from pathlib import Path
import sys
import time
import urllib.request

ROOT = Path('/opt/concrefer-unificado')
sys.path.insert(0, str(ROOT / 'mapa-api'))
for line in Path('/etc/mapa-unificado/auth.env').read_text().splitlines():
    if line.strip() and not line.lstrip().startswith('#') and '=' in line:
        key, value = line.split('=', 1)
        os.environ[key.strip()] = value.strip().strip('\"\'')
from app import COOKIE_NAME, connect, signer

with connect() as connection:
    user = connection.execute("""SELECT id,updated_at FROM public.usuarios
        WHERE perfil='GERENCIA' AND ativo AND NOT primeiro_acesso
          AND deleted_at IS NULL ORDER BY id LIMIT 1""").fetchone()
    assert user
token = signer().dumps({'scope': 'session', 'id': user['id'],
                        'updated_at': user['updated_at'].isoformat()})
url = 'http://127.0.0.1:13052/dashboard/defeitos/indicadores?inicio=2026-11-01&fim=2026-11-24'
for attempt in range(20):
    try:
        req = urllib.request.Request(url, headers={'Cookie': COOKIE_NAME + '=' + token,
            'X-Unificado-Screen': 'DASHBOARD_DEFEITOS'})
        with urllib.request.urlopen(req, timeout=20) as response:
            data = json.load(response)
        break
    except OSError:
        if attempt == 19:
            raise
        time.sleep(0.5)
assert len(data['production_cohort']) == 4
for value in data['production_cohort'].values():
    assert 0 <= value['critical'] <= value['affected'] <= value['inspected'] <= value['produced']
    assert value['critical'] + value['noncritical_only'] == value['affected']
print(json.dumps({'http': 200, 'production_cohort': data['production_cohort']}, ensure_ascii=False))
