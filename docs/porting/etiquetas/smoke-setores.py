"""Read-only checks of Padrão and SC label sector boundaries."""
import importlib.util
import json
import sys
from pathlib import Path

import requests


ROOT = Path(__file__).resolve().parents[3]


def load(path, name):
    spec = importlib.util.spec_from_file_location(name, ROOT / path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


target = sys.argv[1]
assert target in ('homolog', 'prod')
base = 'https://concrefer.concretrack.com.br' + (':18446' if target == 'homolog' else '')
session = requests.Session()
session.verify = False if target == 'homolog' else True
session.cookies.set(
    'mapa_unificado_homolog_session' if target == 'homolog' else 'mapa_unificado_session',
    load('tests/unificado/homolog_session.py', 'homolog_session').test_cookies()['ricardo']
    if target == 'homolog' else
    load('tests/unificado/marcelo_ged_browser_smoke.py', 'production_session').short_session('user-ricardo'),
    domain='concrefer.concretrack.com.br', path='/unificado/',
)
link = session.get(base + '/unificado/mapa/api/unified/pcp-session', timeout=20)
link.raise_for_status()
token = link.json()['access_token']
session.headers['Authorization'] = 'Bearer ' + token
session.headers['X-Unificado-Screen'] = 'etiquetas'

standard = session.get(base + '/unificado/pcp/etiquetas/', timeout=20)
standard.raise_for_status()
html = standard.text
assert 'Todos (setores 1 e 2)' in html, (standard.status_code, standard.url, html[html.find('f-setor')-150:html.find('f-setor')+500])
assert '<option value="1">Setor 1</option>' in html
assert '<option value="2">Setor 2</option>' in html
assert '<option value="3">Setor 3</option>' not in html
assert '<option value="4">Setor 4</option>' not in html
assert 'etiquetas.js?v=0.6.8-setores' in html

sc = session.get(base + '/unificado/pcp/etiquetas-sc/', timeout=20)
sc.raise_for_status()
assert '<select id="f-setor" class="form-select form-select-sm" disabled><option value="3">Setor 3</option></select>' in sc.text

js = session.get(base + '/unificado/pcp/static/js/etiquetas.js?v=0.6.8-setores', timeout=20)
js.raise_for_status()
assert "['1', '2']" in js.text or '[1, 2].includes(Number(row.setor_id))' in js.text

if len(sys.argv) > 2:
    date = sys.argv[2]
else:
    listing = session.get(base + '/unificado/pcp/api/programacao',
                          params={'data_inicio': '2026-01-01', 'data_fim': '2026-10-19'}, timeout=30)
    listing.raise_for_status()
    candidates = [row['data'] for row in listing.json() if int(row['setor_id']) in (1, 2)]
    date = max(candidates) if candidates else '2026-10-19'
root = base + '/unificado/pcp/api/etiquetas-padrao/programacao'
all_rows = session.get(root, params={'data': date}, timeout=20)
assert all_rows.ok, (all_rows.status_code, all_rows.text[:300])
rows = all_rows.json()
assert isinstance(rows, list), rows
assert all(int(row['setor_id']) in (1, 2) for row in rows), rows
for sector in (3, 4):
    excluded = session.get(root, params={'data': date, 'setor_id': sector}, timeout=20)
    excluded.raise_for_status()
    assert excluded.json() == [], (sector, excluded.text)
print(json.dumps({'target': target, 'date': date, 'standard_count': len(rows),
                  'standard_sectors': sorted({row['setor_id'] for row in rows}),
                  'excluded_3_4': True, 'sc_fixed_3': True, 'frontend': True}))
