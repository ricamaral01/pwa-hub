"""Build an explicit homolog-only archive and a checksum gate for existing files."""
from __future__ import annotations

import argparse
import hashlib
import io
import tarfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
NEXT = '/opt/concrefer-unificado/homolog-next'
LAB = '/opt/concrefer-unificado/homolog/laboratorio/service'

MAP = {
    'mapa/app.py': f'{NEXT}/mapa-api/app.py',
    'mapa/screen_access.py': f'{NEXT}/mapa-api/screen_access.py',
    'mapa/screen_catalog.json': f'{NEXT}/mapa-api/screen_catalog.json',
    'mapa/action_catalog.json': f'{NEXT}/mapa-api/action_catalog.json',
    'mapa/users-unificado.js': f'{NEXT}/public/unificado/mapa/operacao/users-unificado.js',
    'shell/menu.config.js': f'{NEXT}/public/unificado/shell/menu.config.js',
    'shell/router.js': f'{NEXT}/public/unificado/shell/router.js',
    'shell/shell.js': f'{NEXT}/public/unificado/shell/shell.js',
    'shell/sw.js': f'{NEXT}/public/unificado/sw.js',
    'lab/app.py': f'{LAB}/server/app.py',
    'lab/postes_api.py': f'{LAB}/server/postes_api.py',
}


def put(archive: tarfile.TarFile, file: Path, name: str) -> None:
    data = file.read_bytes()
    info = tarfile.TarInfo(name)
    info.size = len(data)
    info.mode = 0o644
    archive.addfile(info, io.BytesIO(data))


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument('--before', type=Path, required=True)
    parser.add_argument('--stage', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    lines = []
    with tarfile.open(args.output, 'w:gz') as archive:
        for relative, target in MAP.items():
            before = args.before / relative
            assert before.is_file(), before
            lines.append(f'{hashlib.sha256(before.read_bytes()).hexdigest()}  {target}')
            if relative.startswith('mapa/'):
                destination = 'mapa-api/' + ('operacao/users-unificado.js' if relative == 'mapa/users-unificado.js' else relative.split('/', 1)[1])
                if relative == 'mapa/users-unificado.js':
                    destination = 'public/unificado/mapa/operacao/users-unificado.js'
            elif relative.startswith('shell/'):
                destination = 'public/unificado/' + ('sw.js' if relative == 'shell/sw.js' else relative)
            else:
                destination = 'laboratorio/service/server/' + relative.split('/', 1)[1]
            put(archive, args.stage / relative, destination)
        sidebar = args.before / 'menu-modelo-a.js'
        assert sidebar.is_file(), sidebar
        lines.append(f'{hashlib.sha256(sidebar.read_bytes()).hexdigest()}  '
                     f'{NEXT}/public/unificado/shell/modelo-a/menu.js')
        put(archive, ROOT / 'unificado/shell/modelo-a/menu.js',
            'public/unificado/shell/modelo-a/menu.js')
        package = ROOT / 'unificado/laboratorio/service/cronoanalise'
        for file in sorted(package.rglob('*')):
            if file.is_file() and '__pycache__' not in file.parts and 'tests' not in file.parts and file.suffix in {'.py', '.sql', '.json'}:
                put(archive, file, 'laboratorio/service/cronoanalise/' + file.relative_to(package).as_posix())
        static = ROOT / 'unificado/laboratorio/service/server/static/cronoanalise'
        for file in sorted(static.rglob('*')):
            if file.is_file():
                put(archive, file, 'laboratorio/service/server/static/cronoanalise/' + file.relative_to(static).as_posix())
        put(archive, ROOT / 'unificado/mapa/database/cronoanalise_permissions_20261018.sql',
            'db/permissions.sql')
        content = ('\n'.join(lines) + '\n').encode()
        info = tarfile.TarInfo('before.sha256')
        info.size = len(content)
        info.mode = 0o644
        archive.addfile(info, io.BytesIO(content))
        count = len(archive.getnames())
    print(f'PACKAGE_OK files={count} bytes={args.output.stat().st_size}')


if __name__ == '__main__':
    main()
