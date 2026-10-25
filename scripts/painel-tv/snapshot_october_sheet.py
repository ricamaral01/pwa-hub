"""Copy bounded October programming into the isolated TV test fixture."""
import hashlib
import json
import os
import sys
from datetime import date
from pathlib import Path

PROJECT = '/opt/concrefer-unificado/pcp-api'
SOURCE_ID = '17KBJUSCwfZhyqYGik0WHTX86bRxcqZqFHWZLo_w8ERM'
DEST = Path('/opt/concrefer-unificado/homolog-next/fixtures/painel-tv-google-oct-2026.json')

for line in Path('/etc/pcp-unificado/pcp.env').read_text().splitlines():
    if '=' in line and not line.startswith('#'):
        key, value = line.split('=', 1)
        os.environ[key] = value.strip().strip('"').strip("'")
sys.path.insert(0, PROJECT)
sys.path = [entry for entry in sys.path if entry != '/tmp']
from app.repositories.google_sheets_repository import GoogleSheetsRepository

repository = GoogleSheetsRepository(spreadsheet_id=SOURCE_ID)
snapshot = {'source_id': SOURCE_ID, 'month': '2026-10', 'sectors': {}}
for sector in (3, 4):
    data = repository.carregar_dados_setor(sector, date(2026, 10, 1), date(2026, 10, 31))
    snapshot['sectors'][str(sector)] = {
        'headers': data.cabecalhos_programacao,
        'rows': data.linhas_programacao,
        'forms': {key: sorted(values) for key, values in data.poste_para_formas.items()},
    }
DEST.parent.mkdir(parents=True, exist_ok=True)
encoded = json.dumps(snapshot, ensure_ascii=False, sort_keys=True).encode('utf-8')
DEST.write_bytes(encoded)
print('snapshot', DEST, 'sha256', hashlib.sha256(encoded).hexdigest(),
      'sector3_rows', len(snapshot['sectors']['3']['rows']),
      'sector4_rows', len(snapshot['sectors']['4']['rows']))
