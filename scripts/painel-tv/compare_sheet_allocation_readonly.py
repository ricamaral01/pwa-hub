"""Compare October Google programming allocation with Mapa pointing, without writes."""
import os
import subprocess
import sys
from datetime import date
from pathlib import Path

for line in Path('/etc/pcp-unificado/pcp.env').read_text().splitlines():
    if '=' in line and not line.startswith('#'):
        key, value = line.split('=', 1)
        os.environ[key] = value.strip().strip('"').strip("'")
sys.path.insert(0, '/opt/concrefer-unificado/pcp-api')
sys.path = [entry for entry in sys.path if entry != '/tmp']
from app.repositories.google_sheets_repository import GoogleSheetsRepository
from app.services.alocacao_formas_service import AlocacaoFormasService

source = '17KBJUSCwfZhyqYGik0WHTX86bRxcqZqFHWZLo_w8ERM'
day = date(2026, 10, 16)
repository = GoogleSheetsRepository(spreadsheet_id=source)
service = AlocacaoFormasService(repository)
for sector in (3, 4):
        result = service.gerar_alocacao_formas(day, day, sector)
        allocations = [item for d in result['datas'] for item in d['alocacoes']]
        assigned = {str(item['forma']).strip().upper().replace(' ', '') for item in allocations
                    if item['forma'] != 'FALTOU FORMA DISPONÍVEL'}
        sql = ("SELECT DISTINCT forma FROM public.producao "
               f"WHERE data_fabricacao='{day.isoformat()}' AND setor='Setor {sector}'")
        rows = subprocess.check_output(['sudo', '-u', 'postgres', 'psql', '-At',
                                        '-d', 'mapa_unificado_teste', '-c', sql], text=True)
        actual = {str(row).strip().upper().replace(' ', '') for row in rows.splitlines() if row.strip()}
        print('sector', sector, 'sheet_products', result['total_postes'],
              'allocated_forms', len(assigned), 'unallocated', result['total_faltas_forma'],
              'mapa_forms', len(actual), 'matching', len(assigned & actual),
              'sheet_only_sample', sorted(assigned-actual)[:8],
              'mapa_only_sample', sorted(actual-assigned)[:8])
