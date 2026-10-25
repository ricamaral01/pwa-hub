"""Destination-only backup before additive GED PDF warning migration/deploy."""
from pathlib import Path
import hashlib
import shutil
import subprocess

ROOT = Path('/root/ged-a5-20261015')


def digest(path: Path) -> str:
    value = hashlib.sha256()
    with path.open('rb') as source:
        for block in iter(lambda: source.read(1024 * 1024), b''):
            value.update(block)
    return value.hexdigest()


def main() -> None:
    targets = [
        (Path('/opt/ged_concrefer/docker-compose.yml'), ROOT / 'docker-compose.before-pdf-isolation.yml'),
        (Path('/etc/nginx/snippets/ged-unificado.conf'), ROOT / 'ged-unificado.before-pdf-isolation.conf'),
    ]
    for source, target in targets:
        if target.exists():
            raise SystemExit(f'Backup already exists: {target.name}')
        shutil.copy2(source, target)
    dump = ROOT / 'ged-db.before-pdf-isolation.dump'
    if dump.exists():
        raise SystemExit('GED database backup already exists')
    with dump.open('wb') as out:
        subprocess.run(['docker', 'exec', 'ged_postgres', 'sh', '-c',
                        'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc'],
                       stdout=out, check=True)
    dump.chmod(0o600)
    for _, target in targets:
        print(f'{target.name} bytes={target.stat().st_size} sha256={digest(target)}')
    print(f'{dump.name} bytes={dump.stat().st_size} sha256={digest(dump)}')


if __name__ == '__main__':
    main()
