"""Preserve 401 and 403 separately for PCP API in the isolated homolog Nginx.

Run only on the homolog VPS. It makes timestamped backups of the two exact
configuration files and refuses to edit an unexpected configuration.
"""
from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path
import shutil


VHOST = Path("/etc/nginx/sites-enabled/unificado-homolog.conf")
SNIPPET = Path("/etc/nginx/snippets/unificado-screen-access-homolog.conf")
BACKUPS = Path("/root/nginx-backups/maodeobra-20261017")
OLD = "error_page 401 403 = @unificado_api_denied;"
NEW = "error_page 401 = @unificado_api_unauth;\n        error_page 403 = @unificado_api_denied;"
ANCHOR = "    location @unificado_api_denied {"
ADDED = """    location @unificado_api_unauth {
        default_type application/json;
        charset utf-8;
        return 401 '{"detail":"Sessão ausente ou expirada"}';
    }

"""


def main() -> None:
    vhost = VHOST.read_text()
    snippet = SNIPPET.read_text()
    if vhost.count(OLD) != 3 or snippet.count(ANCHOR) != 1 or "@unificado_api_unauth" in snippet:
        raise RuntimeError("Configuração inesperada; nenhuma alteração aplicada")
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    BACKUPS.mkdir(mode=0o700, parents=True, exist_ok=True)
    for path in (VHOST, SNIPPET):
        shutil.copy2(path, BACKUPS / (path.name + ".bak-" + stamp))
    VHOST.write_text(vhost.replace(OLD, NEW))
    SNIPPET.write_text(snippet.replace(ANCHOR, ADDED + ANCHOR))
    print(f"Backups em {BACKUPS} com sufixo .bak-{stamp}; executar nginx -t antes de reload")


if __name__ == "__main__":
    main()
