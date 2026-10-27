"""Build a production bundle containing only Ribeirão runtime files."""
from __future__ import annotations

import tarfile
import tempfile
from pathlib import Path

root = Path(__file__).resolve().parents[1]
bundle = Path(tempfile.gettempdir()) / "ribeirao-deploy-20261027.tar.gz"

files = {
    "unificado/pcp/backend/app/api/routers/producao_unidade.py": "pcp-api/app/api/routers/producao_unidade.py",
    "unificado/pcp/backend/app/services/pederneiras_rules.py": "pcp-api/app/services/pederneiras_rules.py",
    "unificado/pcp/backend/alembic/versions/20261027_04_ribeirao_unidade.py": "migration/20261027_04_ribeirao_unidade.py",
    "unificado/mapa/api/screen_access.py": "mapa-api/screen_access.py",
    "unificado/mapa/api/screen_catalog.json": "mapa-api/screen_catalog.json",
    "unificado/mapa/api/app.py": "mapa-api/app.py",
    "unificado/index.html": "public/unificado/index.html",
    "unificado/shell/menu.config.js": "public/unificado/shell/menu.config.js",
    "unificado/shell/navigation.js": "public/unificado/shell/navigation.js",
    "unificado/shell/router.js": "public/unificado/shell/router.js",
    "unificado/shell/shell.js": "public/unificado/shell/shell.js",
    "unificado/shell/modelo-a/menu.js": "public/unificado/shell/modelo-a/menu.js",
    "unificado/shell/modelo-a-loader.js": "public/unificado/shell/modelo-a-loader.js",
    "docs/porting/producao-ribeirao/seed/seed_produtos_ribeirao.csv": "seed/seed_produtos_ribeirao.csv",
    "scripts/seed_ribeirao.py": "seed/seed_ribeirao.py",
    "docs/porting/producao-ribeirao/deploy_migration.sql": "migration/deploy_migration.sql",
    "docs/porting/producao-ribeirao/nginx-screen-access.conf": "nginx/unificado-screen-access.conf",
}
site = root / "unificado/producao/ribeirao"
for path in site.rglob("*"):
    if path.is_file() and "frontend" not in path.relative_to(site).parts:
        files[str(path.relative_to(root)).replace("\\", "/")] = (
            "public/unificado/producao/ribeirao/" + str(path.relative_to(site)).replace("\\", "/")
        )
with tarfile.open(bundle, "w:gz") as output:
    for source, destination in files.items():
        output.add(root / source, arcname=destination)
print(f"{bundle}: {len(files)} runtime files")
