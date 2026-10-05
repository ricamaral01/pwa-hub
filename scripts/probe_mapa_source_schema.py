"""Read the exposed Supabase schema without printing credentials or row data."""

import json
from pathlib import Path
import requests

env = {}
for line in Path('/opt/concrefer-unificado/migration/supabase-source.env').read_text().splitlines():
    if '=' in line:
        name, value = line.split('=', 1)
        env[name] = value.strip().strip('"').strip("'")
base = env['SUPABASE_URL'].rstrip('/') + '/rest/v1'
headers = {'apikey': env['SUPABASE_SECRET_KEY'], 'Authorization': 'Bearer ' + env['SUPABASE_SECRET_KEY']}
response = requests.get(base + '/', headers={**headers, 'Accept': 'application/openapi+json'}, timeout=30)
response.raise_for_status()
spec = response.json()
result = {
    'definitions': {name: sorted(definition.get('properties', {})) for name, definition in spec.get('definitions', {}).items()},
    'mapa_column_types': {name: {column: {'type': prop.get('type'), 'format': prop.get('format')}
                                 for column, prop in spec['definitions'][name]['properties'].items()}
                          for name in ('usuarios','programacao_pcp','liberacao_formas','producao',
                                       'montagem_poste','formas_manutencao','prog_s3_s4','vw_formas_status')},
    'rpc_paths': sorted(path for path in spec.get('paths', {}) if path.startswith('/rpc/')),
    'productivity_rpc': {method: {'parameters': [item.get('name') for item in operation.get('parameters', [])],
                                 'response_types': sorted(operation.get('responses', {}))}
                         for method, operation in spec.get('paths', {}).get('/rpc/rpc_dashboard_produtividade_resumo_v1', {}).items()},
    'column_probes': {},
}
for column in ('codigo_poste', 'descricao_poste', 'codigo_produto'):
    reply = requests.get(base + '/montagem_poste', params={'select': 'id,' + column, 'limit': '1'}, headers=headers, timeout=30)
    result['column_probes'][column] = {'status': reply.status_code, 'code': reply.json().get('code') if reply.status_code != 200 else None}
print(json.dumps(result, ensure_ascii=False))
