"""Verify one synthetic GED fallback version and audit event on destination."""
import subprocess
import sys
import uuid

VERSION = str(uuid.UUID(sys.argv[1]))
sql = f"""
SELECT
  (SELECT count(*) FROM versions
   WHERE id = '{VERSION}' AND file_size = 52428800
     AND drive_file_id IS NOT NULL AND processing_warning IS NOT NULL),
  (SELECT count(*) FROM audit_logs
   WHERE entity_id = '{VERSION}' AND action = 'documents.pdf_stamp_fallback'
     AND after_data::jsonb ->> 'processing_warning' IS NOT NULL);
"""
result = subprocess.run(['docker', 'exec', '-i', 'ged_postgres', 'sh', '-c',
                         'psql -X -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tA'],
                        input=sql.encode(), capture_output=True, check=True)
counts = result.stdout.decode().strip()
if counts != '1|1':
    raise SystemExit(f'Unexpected fallback version/audit counts: {counts}')
print('GED fallback version and audit: 1|1')
