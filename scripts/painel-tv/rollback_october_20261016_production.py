"""Remove only the IDs written by the Oct 16 PCP import."""
import json
import os
import sys
from datetime import date
from pathlib import Path

from sqlalchemy.engine.url import make_url

for line in Path('/etc/pcp-unificado/pcp.env').read_text().splitlines():
    if '=' in line and not line.startswith('#'):
        key, value = line.split('=', 1)
        os.environ[key] = value.strip().strip('"').strip("'")
sys.path.insert(0, '/opt/concrefer-unificado/pcp-api')
from app.core.config import settings
from app.core.database import SessionLocal
from app.models.producao import Programacao

if make_url(settings.DATABASE_URL).database != 'pcp_unificado_teste':
    raise SystemExit('Refusing non-production PCP database')
manifest = Path('/opt/concrefer-unificado/backups/tv-mapa-pcp-20261016-2145/pcp-import-ids.json')
ids = json.loads(manifest.read_text())
if len(ids) != 73 or len(set(ids)) != 73:
    raise SystemExit('Unexpected import manifest')
with SessionLocal() as db:
    rows = db.query(Programacao).filter(Programacao.id.in_(ids)).all()
    if len(rows) != 73 or any(row.data != date(2026, 10, 16) or row.setor_id not in (3, 4)
                              for row in rows):
        raise SystemExit('Rows changed since import; refusing broad rollback')
    for row in rows:
        db.delete(row)
    db.commit()
    print('removed_imported_rows=73')
