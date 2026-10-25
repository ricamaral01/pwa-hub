"""Apply only Alex master-policy files on the new VPS after backups/gates."""
from __future__ import annotations

import argparse
import hashlib
from pathlib import Path

ROOT = Path('/opt/concrefer-unificado')
STAGE = Path('/root/alex-master-20261016/homolog')
BASE_HASHES = {
    'screen_access.py': '3d5968f4f3670ad90f603f6c1b5a078d445f039eff41801520572d99eb7985d1',
    'shell.js': 'c76290cf30e9f1b058d89ff4edcbbda5665d2bfc8970dd94673efbaeece0ab23',
    'users-unificado.js': '26032d69b7196895173ee55e5665fa416a42971e3739bddc602a4a8f4bd3c75a',
    'sw.js': 'a85cec27aad4d11dfb144d83776f02ed7b8202383ff22d7901ddf363a375cfa4',
}


def hash_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def main():
    p = argparse.ArgumentParser()
    p.add_argument('environment', choices=['homolog', 'production'])
    args = p.parse_args()
    prefix = ROOT / ('homolog-next' if args.environment == 'homolog' else '')
    public = prefix / 'public/unificado'
    mapping = {
        'screen_access.py': prefix / 'mapa-api/screen_access.py',
        'shell.js': public / 'shell/shell.js',
        'users-unificado.js': public / 'mapa/operacao/users-unificado.js',
        'sw.js': public / 'sw.js',
        'VERSION': public / 'VERSION',
    }
    planned = {}
    for name, dest in mapping.items():
        previous = dest.read_bytes()
        if name in BASE_HASHES and hash_bytes(previous) != BASE_HASHES[name]:
            raise RuntimeError(f'Unexpected {args.environment} baseline: {name}')
        if name == 'VERSION' and previous.strip() != b'1.0.14':
            raise RuntimeError('Unexpected VERSION baseline')
        planned[dest] = (STAGE / name).read_bytes()
    shell_index = public / 'index.html'
    old = shell_index.read_bytes()
    expected_index = ('9fb2a5fbf8e28f76fdd390e23b813cee0a3a5c83c463511b5c19ded32659fdc3'
                      if args.environment == 'homolog' else
                      '6f2384b6c4055d9f6a58a201ca01394b871d500955933566b011a7f0d2f6473e')
    if hash_bytes(old) != expected_index:
        raise RuntimeError('Unexpected shell index baseline')
    planned[shell_index] = old.replace(b'1.0.14', b'1.0.15')
    if old.count(b'1.0.14') < 8:
        raise RuntimeError('Shell index cache tags missing')
    mapa_index = public / 'mapa/operacao/index.html'
    old = mapa_index.read_bytes()
    marker = b'users-unificado.js?v=1.0.14-quality'
    if old.count(marker) != 1:
        raise RuntimeError('Unexpected Mapa editor cache tag')
    planned[mapa_index] = old.replace(marker, b'users-unificado.js?v=1.0.15-alex')
    for dest, data in planned.items():
        dest.write_bytes(data)
    print({'environment': args.environment,
           'files': {str(path.relative_to(prefix)): hash_bytes(data)
                     for path, data in planned.items()}})


if __name__ == '__main__':
    main()
