"""Apply one additive warning column to GED destination after a fresh pg_dump."""
from pathlib import Path
import subprocess

backup = Path('/root/ged-a5-20261015/ged-db.before-pdf-isolation.dump')
assert backup.is_file() and backup.stat().st_size > 1000, 'GED backup missing'
sql = Path('/root/ged-a5-20261015/build-pdf-backend/src/db/migrations/20261015_pdf_stamp_warning.sql').read_bytes()
assert sql.strip() == b'-- Aditiva: registra quando a versao foi salva sem carimbo PDF.\nALTER TABLE versions ADD COLUMN IF NOT EXISTS processing_warning TEXT;', 'unexpected DDL'
result = subprocess.run(['docker', 'exec', '-i', 'ged_postgres', 'sh', '-c',
                         'psql -X -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB"'],
                        input=sql, capture_output=True)
if result.returncode:
    raise SystemExit(f'DDL failed: {result.returncode}')
print('GED destination additive column applied')
