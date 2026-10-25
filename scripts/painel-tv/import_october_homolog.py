"""Exercise the real PCP importer against a copied Sheet snapshot, test DB only."""
import json
import os
import sys
from datetime import date
from pathlib import Path

for line in Path('/etc/concrefer-unificado/homolog/pcp.env').read_text().splitlines():
    if '=' in line and not line.startswith('#'):
        key, value = line.split('=', 1)
        os.environ[key] = value.strip().strip('"').strip("'")
sys.path.insert(0, '/opt/concrefer-unificado/homolog-next/pcp-api')
sys.path = [entry for entry in sys.path if entry != '/tmp']
from app.core.config import settings
from app.core.database import SessionLocal
from app.models.alocacao_formas import DadosProgramacaoSheets
from app.services.alocacao_formas_service import AlocacaoFormasService
from app.api.routers import alocacao_formas as route

if 'homolog_20261016' not in settings.DATABASE_URL:
    raise SystemExit('PCP DB is not isolated homolog')
fixture = json.loads(Path('/opt/concrefer-unificado/homolog-next/fixtures/painel-tv-google-oct-2026.json').read_text())


class SnapshotRepository:
    def carregar_dados_setor(self, setor, data_inicial, data_final):
        data = fixture['sectors'][str(setor)]
        return DadosProgramacaoSheets(data['headers'], data['rows'],
                                      {key: set(values) for key, values in data['forms'].items()})


route.AlocacaoFormasService = lambda: AlocacaoFormasService(SnapshotRepository())
day = date(2026, 10, 16)
for sector in (3, 4):
    with SessionLocal() as db:
        result = route.importar_alocacao_formas(day, day, sector, True, db, None)
        print('sector', sector, 'importados', result['importados'],
              'removidos', result['removidos'], 'ignorados', result['total_ignorados'])
