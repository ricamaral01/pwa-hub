"""Run the PCP allocation against an isolated snapshot and homolog PCP DB."""
import json
import os
import subprocess
import sys
from datetime import date
from pathlib import Path

env_file = Path('/etc/concrefer-unificado/homolog/pcp.env')
for line in env_file.read_text().splitlines():
    if '=' in line and not line.startswith('#'):
        key, value = line.split('=', 1)
        os.environ[key] = value.strip().strip('"').strip("'")
sys.path.insert(0, '/opt/concrefer-unificado/homolog-next/pcp-api')
sys.path = [entry for entry in sys.path if entry != '/tmp']
from app.core.config import settings
from app.core.database import SessionLocal
from app.models.alocacao_formas import DadosProgramacaoSheets
from app.models.produto import Produto
from app.api.routers.alocacao_formas import _norm_text
from app.services.alocacao_formas_service import AlocacaoFormasService

if 'homolog_20261016' not in settings.DATABASE_URL:
    raise SystemExit('PCP homolog connection is not isolated')
fixture = json.loads(Path('/opt/concrefer-unificado/homolog-next/fixtures/painel-tv-google-oct-2026.json').read_text())


class SnapshotRepository:
    def carregar_dados_setor(self, setor, data_inicial, data_final):
        data = fixture['sectors'][str(setor)]
        return DadosProgramacaoSheets(data['headers'], data['rows'],
                                      {key: set(values) for key, values in data['forms'].items()})


service = AlocacaoFormasService(SnapshotRepository())
day = date(2026, 10, 16)
for sector in (3, 4):
    result = service.gerar_alocacao_formas(day, day, sector)
    allocations = [item for d in result['datas'] for item in d['alocacoes']]
    assigned = {str(item['forma']).strip().upper().replace(' ', '') for item in allocations
                if item['forma'] != 'FALTOU FORMA DISPONÍVEL'}
    sql = ("SELECT DISTINCT forma FROM public.producao "
           f"WHERE data_fabricacao='{day.isoformat()}' AND setor='Setor {sector}'")
    raw = subprocess.check_output(['sudo', '-u', 'postgres', 'psql', '-At',
                                   '-d', 'mapa_unificado_homolog_20261016', '-c', sql], text=True)
    actual = {value.strip().upper().replace(' ', '') for value in raw.splitlines() if value.strip()}
    with SessionLocal() as db:
        products = {_norm_text(product.nome) for product in db.query(Produto).filter(
            Produto.setor_id == sector).all()}
    importable = [item for item in allocations
                  if item['forma'] != 'FALTOU FORMA DISPONÍVEL'
                  and _norm_text(item['poste']) in products]
    missing_products = sorted({item['poste'] for item in allocations
                               if item['forma'] != 'FALTOU FORMA DISPONÍVEL'
                               and _norm_text(item['poste']) not in products})
    print('sector', sector, 'planned_items', result['total_postes'],
          'allocated_forms', len(assigned), 'unallocated', result['total_faltas_forma'],
          'importable', len(importable), 'missing_products', missing_products[:8],
          'actual_forms', len(actual), 'matching', len(actual & assigned))
