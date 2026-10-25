"""Reconcile the Laboratory entry after a concurrent shell release."""

from pathlib import Path
import re
import shutil

public = Path('/opt/concrefer-unificado/public/unificado')
version = '1.0.50-lab-reports'
backup_suffix = '.bak-lab-usinas-menu-final-20261025'


def save(path, old, new):
    if old == new:
        raise RuntimeError(f'No change in {path}')
    backup = Path(str(path) + backup_suffix)
    if backup.exists():
        raise RuntimeError(f'Backup already exists: {backup}')
    shutil.copy2(path, backup)
    path.write_text(new, encoding='utf-8')
    print(path)


menu = public / 'shell/modelo-a/menu.js'
old = menu.read_text(encoding='utf-8')
if 'labUsinasRelatorios' in old:
    raise RuntimeError('Menu already contains the report entry')
anchor = '    xe("CURA TÉRMICA", [\n'
if old.count(anchor) != 1:
    raise RuntimeError('Unexpected Laboratory menu layout')
new = old.replace(anchor,
                  '    xe("USINA DE CAMPINAS", [\n'
                  '      ["labUsinasRelatorios", "Relatórios e custos", "laboratorio/usinas-relatorios/", "doc"]\n'
                  '    ]),\n' + anchor, 1)
save(menu, old, new)


def bump(path, names, cache=False):
    old = path.read_text(encoding='utf-8')
    new = old
    for name in names:
        pattern = rf'({re.escape(name)}\?v=)[^\x27\x22\s<>]+'
        new, count = re.subn(pattern, lambda m: m.group(1) + version, new)
        if count != 1:
            raise RuntimeError(f'Expected one {name} in {path}, got {count}')
    if cache:
        new, count = re.subn(r"const CACHE = 'concrefer-unificado-shell-[^']+'",
                             "const CACHE = 'concrefer-unificado-shell-v1.0.50-lab-reports'", new)
        if count != 1:
            raise RuntimeError(f'Expected one cache version in {path}')
    save(path, old, new)


bump(public / 'shell/modelo-a-loader.js', ['modelo-a/menu.js'])
bump(public / 'index.html', ['shell/menu.config.js', 'shell/router.js', 'shell/modelo-a-loader.js'])
bump(public / 'sw.js', ['shell/modelo-a/menu.js', 'shell/modelo-a-loader.js',
                         'shell/menu.config.js', 'shell/router.js'], cache=True)
