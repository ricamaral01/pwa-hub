"""One-time, atomic PCP import of the official Oct 16 S3/S4 plan.

Uses the existing production Google reader and PCP allocation rule. Refuses any
unexpected source, database, pre-existing program, or allocation count.
"""
import os
import sys
import json
from datetime import date
from decimal import Decimal
from pathlib import Path

from sqlalchemy import func
from sqlalchemy.engine.url import make_url

mode = sys.argv[1:] or ['--dry-run']
if mode not in (['--dry-run'], ['--apply']):
    raise SystemExit('usage: import_october_20261016_production.py --dry-run|--apply')

for line in Path('/etc/pcp-unificado/pcp.env').read_text().splitlines():
    if '=' in line and not line.startswith('#'):
        key, value = line.split('=', 1)
        os.environ[key] = value.strip().strip('"').strip("'")

sys.path.insert(0, '/opt/concrefer-unificado/pcp-api')
sys.path = [entry for entry in sys.path if entry != '/tmp']
from app.api.routers.alocacao_formas import _norm_text
from app.core.config import settings
from app.core.database import SessionLocal
from app.models.producao import Programacao
from app.models.produto import Produto
from app.services.alocacao_formas_service import AlocacaoFormasService

day = date(2026, 10, 16)
source = '17KBJUSCwfZhyqYGik0WHTX86bRxcqZqFHWZLo_w8ERM'
if make_url(settings.DATABASE_URL).database != 'pcp_unificado_teste':
    raise SystemExit('Refusing non-production PCP database')
if settings.SPREADSHEET_ID_10 != source:
    raise SystemExit('Refusing unexpected October workbook')

expected = {3: (50, 44), 4: (38, 29)}
rows_to_add = []
with SessionLocal() as db:
    existing = db.query(Programacao.setor_id, func.count(Programacao.id)).filter(
        Programacao.data == day,
        Programacao.setor_id.in_((3, 4)),
    ).group_by(Programacao.setor_id).all()
    if existing:
        raise SystemExit(f'Refusing to replace existing S3/S4 plans: {existing}')
    products = {
        (p.setor_id, _norm_text(p.nome)): p
        for p in db.query(Produto).filter(Produto.setor_id.in_((3, 4))).all()
    }
    for sector in (3, 4):
        result = AlocacaoFormasService().gerar_alocacao_formas(day, day, sector)
        allocated = [item for daily in result['datas'] for item in daily['alocacoes']
                     if item['forma'] != 'FALTOU FORMA DISPONÍVEL']
        if (result['total_postes'], len(allocated)) != expected[sector]:
            raise SystemExit(f'Sector {sector} changed: products={result["total_postes"]}, '
                             f'allocated={len(allocated)}; expected={expected[sector]}')
        for item in allocated:
            product = products.get((sector, _norm_text(item['poste'])))
            if product is None:
                raise SystemExit(f'Sector {sector}: product missing for {item["poste"]}')
            quantity = int(item['quantidade'])
            rows_to_add.append(Programacao(
                data=day, setor_id=sector, produto_id=product.id,
                codigo_forma=item['forma'], quantidade_programada=quantity,
                volume_m3_programado=Decimal(str(product.volume or 0)) * quantity,
            ))
        print(f'sector={sector} sheet_items={result["total_postes"]} '
              f'allocations={len(allocated)} unallocated={result["total_faltas_forma"]}')
    if mode == ['--apply']:
        db.add_all(rows_to_add)
        db.flush()
        manifest = Path('/opt/concrefer-unificado/backups/tv-mapa-pcp-20261016-2145/pcp-import-ids.json')
        manifest.write_text(json.dumps([row.id for row in rows_to_add]))
        db.commit()
        print(f'committed={len(rows_to_add)}')
    else:
        print(f'dry_run_rows={len(rows_to_add)}')
