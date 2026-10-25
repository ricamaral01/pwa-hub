"""Apply the tested TV delta to copies of the currently published files."""
from pathlib import Path
import shutil
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[2]
saved = ROOT / '.codex-tmp-painel-tv-prod'
candidate = saved / 'candidate'
candidate.mkdir(exist_ok=True)
app = candidate / 'app.py'
shutil.copyfile(saved / 'app.py', app)
subprocess.run([sys.executable, str(ROOT / 'scripts/painel-tv/patch_homolog_mapa_app.py'), str(app)], check=True)

for source, target in (
    ('unificado/mapa/api/screen_access.py', 'screen_access.py'),
    ('unificado/mapa/api/screen_catalog.json', 'screen_catalog.json'),
    ('unificado/shell/menu.config.js', 'menu.config.js'),
    ('unificado/shell/shell.js', 'shell.js'),
):
    shutil.copyfile(ROOT / source, candidate / target)

bundle = (saved / 'modelo-a-menu.js').read_text(encoding='utf-8')
before = '["produtividade", "Concretagem", Se("PROD_ANALISE"), "map"]'
after = before + ',\n      ["tvFormas", "Painel TV — Formas", "tv/formas/", "map"]'
if bundle.count(before) != 1 or 'tvFormas' in bundle:
    raise RuntimeError('Published Modelo A bundle anchor drifted')
(candidate / 'modelo-a-menu.js').write_text(bundle.replace(before, after, 1), encoding='utf-8')

subprocess.run([sys.executable, '-m', 'py_compile', str(app), str(candidate / 'screen_access.py')], check=True)
print(candidate)
