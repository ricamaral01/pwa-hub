"""Run on the VPS after cloning the active Laboratory database to homolog.

Copies the existing gateway settings without printing credentials, and points
the test service at its own database and upload directory.
"""
from pathlib import Path
from urllib.parse import urlsplit, urlunsplit
import grp
import os

source = Path('/etc/concrefer-unificado/laboratorio.env')
target = Path('/etc/concrefer-unificado/laboratorio-homolog.env')
if target.exists():
    raise SystemExit('Homolog environment already exists; refusing to overwrite it.')

lines = []
found_database = False
found_uploads = False
for line in source.read_text().splitlines():
    if line.startswith('DATABASE_URL='):
        raw = line.partition('=')[2].strip()
        quote = raw[0] if raw[:1] in ('"', "'") and raw[-1:] == raw[:1] else ''
        value = raw[1:-1] if quote else raw
        parts = urlsplit(value)
        if parts.path != '/concretrack_postes':
            raise SystemExit('Unexpected production database name; refusing to create test settings.')
        value = urlunsplit(parts._replace(path='/concretrack_postes_homolog'))
        line = 'DATABASE_URL=' + quote + value + quote
        found_database = True
    elif line.startswith('POSTES_UPLOAD_DIR='):
        line = 'POSTES_UPLOAD_DIR=/opt/concrefer-unificado/homolog/data/postes_uploads'
        found_uploads = True
    lines.append(line)
if not found_database:
    raise SystemExit('DATABASE_URL missing from source environment.')
if not found_uploads:
    lines.append('POSTES_UPLOAD_DIR=/opt/concrefer-unificado/homolog/data/postes_uploads')
target.write_text('\n'.join(lines) + '\n')
os.chown(target, 0, grp.getgrnam('monitorconcreto').gr_gid)
target.chmod(0o640)
print('Homolog environment created with an isolated database and upload directory.')
