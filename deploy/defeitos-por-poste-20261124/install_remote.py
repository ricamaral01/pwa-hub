"""Publish only the manifest files, with backup and automatic rollback."""
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import py_compile
import shutil
import subprocess

ROOT = Path('/opt/concrefer-unificado')
STAGE = ROOT / 'staging/defeitos-por-poste-20261124'
SERVICE = 'mapa-unificado-auth.service'
COLUMNS = ['id', 'data_fabricacao', 'setor', 'forma', 'modelo']


def sql(query):
    return subprocess.check_output(['sudo', '-u', 'postgres', 'psql', '-X', '-A', '-t',
        '-v', 'ON_ERROR_STOP=1', '-d', 'mapa_unificado_teste', '-c', query],
        text=True, cwd='/tmp').strip()


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    manifest = json.loads((STAGE / 'manifest.json').read_text())
    for row in manifest['files']:
        target = ROOT / row['target']
        assert target.resolve().is_relative_to(ROOT)
        assert digest(target) == row['before_sha256'], f'Production changed: {target}'
        assert digest(STAGE / 'release' / row['target']) == row['after_sha256']
    py_compile.compile(str(STAGE / 'release/mapa-api/dashboard_defects_indicators.py'), doraise=True)
    previous_privileges = {col: sql(
        f"SELECT has_column_privilege('mapa_api_login','public.producao','{col}','SELECT')"
    ) == 't' for col in COLUMNS}
    backup = ROOT / 'backups' / (manifest['release'] + '-' + datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ'))
    backup.mkdir(parents=True)
    for row in manifest['files']:
        copy = backup / row['target']
        copy.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(ROOT / row['target'], copy)
    (backup / 'column-privileges.json').write_text(json.dumps(previous_privileges))
    try:
        sql('GRANT SELECT (' + ','.join(COLUMNS) + ') ON public.producao TO mapa_api_login')
        # The frontend is published only after the backend file is ready.
        for row in manifest['files']:
            target = ROOT / row['target']
            pending = target.with_name(target.name + '.defeitos-release')
            shutil.copy2(STAGE / 'release' / row['target'], pending)
            os.chmod(pending, target.stat().st_mode & 0o777)
            os.replace(pending, target)
        subprocess.run(['systemctl', 'restart', SERVICE], check=True)
        subprocess.run(['systemctl', 'is-active', '--quiet', SERVICE], check=True)
        subprocess.run([str(ROOT / 'mapa-api/.venv/bin/python'), str(STAGE / 'verify_remote.py')], check=True)
        for row in manifest['files']:
            assert digest(ROOT / row['target']) == row['after_sha256']
    except Exception:
        for row in manifest['files']:
            shutil.copy2(backup / row['target'], ROOT / row['target'])
        newly_granted = [col for col, was_granted in previous_privileges.items() if not was_granted]
        if newly_granted:
            sql('REVOKE SELECT (' + ','.join(newly_granted) + ') ON public.producao FROM mapa_api_login')
        subprocess.run(['systemctl', 'restart', SERVICE], check=True)
        raise
    result = {'status': 'published', 'backup': str(backup), 'release': manifest['release'],
              'files': manifest['files'], 'previous_column_privileges': previous_privileges}
    (STAGE / 'deployment-results.json').write_text(json.dumps(result, indent=2))
    print(json.dumps(result, indent=2))


if __name__ == '__main__':
    main()
