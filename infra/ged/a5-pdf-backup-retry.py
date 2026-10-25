"""Fresh destination-only backups before the second controlled GED PDF attempt."""
from pathlib import Path
import hashlib
import shutil
import subprocess

root = Path('/root/ged-a5-20261015')
targets = [
    (Path('/opt/ged_concrefer/docker-compose.yml'), root / 'docker-compose.before-pdf-retry.yml'),
    (Path('/etc/nginx/snippets/ged-unificado.conf'), root / 'ged-unificado.before-pdf-retry.conf'),
]
for source, target in targets:
    if target.exists():
        raise SystemExit(f'Backup already exists: {target.name}')
    shutil.copy2(source, target)
dump = root / 'ged-db.before-pdf-retry.dump'
if dump.exists():
    raise SystemExit('GED retry database backup already exists')
with dump.open('wb') as out:
    subprocess.run(['docker', 'exec', 'ged_postgres', 'sh', '-c',
                    'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc'],
                   stdout=out, check=True)
dump.chmod(0o600)
for path in [*(target for _, target in targets), dump]:
    print(f'{path.name} bytes={path.stat().st_size} sha256={hashlib.sha256(path.read_bytes()).hexdigest()}')
