"""Package only reviewed TV files and deltas from the live production sources."""
from pathlib import Path
import tarfile

root = Path(__file__).resolve().parents[2]
candidate = root / '.codex-tmp-painel-tv-prod/candidate'
output = root / '.codex-tmp-painel-tv-prod/payload.tar.gz'
files = {
    'mapa/app.py': candidate / 'app.py',
    'mapa/screen_access.py': candidate / 'screen_access.py',
    'mapa/screen_catalog.json': candidate / 'screen_catalog.json',
    'shell/menu.config.js': candidate / 'menu.config.js',
    'shell/shell.js': candidate / 'shell.js',
    'shell/modelo-a-menu.js': candidate / 'modelo-a-menu.js',
    'tv-api/app.py': root / 'unificado/painel-tv/api/app.py',
    'tv-api/formas_fisicas.json': root / 'unificado/painel-tv/api/formas_fisicas.json',
    'tv/index.html': root / 'unificado/tv/formas/index.html',
    'tv/tv.js': root / 'unificado/tv/formas/tv.js',
    'nginx-prod.conf': root / 'unificado/painel-tv/nginx-prod.conf',
    'tv-prod.service': root / 'unificado/painel-tv/tv-prod.service',
    'setup-prod-reader.sh': root / 'scripts/painel-tv/setup-prod-reader.sh',
    'rollback-prod.sh': root / 'scripts/painel-tv/rollback-prod.sh',
}
with tarfile.open(output, 'w:gz') as archive:
    for arcname, path in files.items():
        archive.add(path, arcname=arcname)
print(output)
