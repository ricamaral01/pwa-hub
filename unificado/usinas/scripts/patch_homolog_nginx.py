"""Idempotently include the Usinas read-only screen in homolog Nginx."""

from pathlib import Path

SITE = Path("/etc/nginx/sites-available/unificado-homolog.conf")
INCLUDE = "    include /etc/nginx/snippets/usinas-unificado-homolog.conf;\n"
ANCHOR = "    include /etc/nginx/snippets/unificado-screen-access-homolog.conf;\n"

source = SITE.read_text()
if INCLUDE not in source:
    if source.count(ANCHOR) != 1:
        raise SystemExit("Anchor de controle de acesso não encontrado exatamente uma vez")
    SITE.write_text(source.replace(ANCHOR, ANCHOR + INCLUDE))
