"""Extend an existing Laboratory grant to the new Campinas read reports."""

from pathlib import Path
import shutil

path = Path('/opt/concrefer-unificado/mapa-api/screen_access.py')
old = "    if ('qualidadePainel' in allowed and 'qualidadeResultadosBancada' not in allowed\n"
new = ("    if (overrides.get('labUsinasRelatorios') is not False\n"
       "            and 'labUsinasRelatorios' not in allowed\n"
       "            and any(BY_ID[item]['module'] == 'laboratorio' for item in allowed)):\n"
       "        allowed.append('labUsinasRelatorios')\n" + old)
source = path.read_text(encoding='utf-8')
if source.count(old) != 1 or "overrides.get('labUsinasRelatorios')" in source:
    raise RuntimeError('Unexpected screen access source')
shutil.copy2(path, Path(str(path) + '.bak-lab-usinas-grants-20261025'))
path.write_text(source.replace(old, new, 1), encoding='utf-8')
print(path)
