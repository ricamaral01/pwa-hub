"""Configura credencial local do PostgREST na VPS de testes, sem imprimi-la.

Executar como root. Recusa sobrescrever a configuração existente.
"""

from __future__ import annotations

import os
from pathlib import Path
import secrets
import subprocess


DEST = Path("/opt/concrefer-unificado/migration/postgrest.env")


def main() -> None:
    if os.geteuid() != 0:
        raise SystemExit("Execute como root")
    if DEST.exists():
        raise SystemExit(f"Configuração já existe: {DEST}")
    password = secrets.token_hex(32)
    sql = f"ALTER ROLE mapa_api_authenticator PASSWORD '{password}';\n"
    subprocess.run(
        ["sudo", "-u", "postgres", "psql", "-X", "-v", "ON_ERROR_STOP=1",
         "-d", "mapa_unificado_teste"],
        input=sql, text=True, capture_output=True, check=True,
    )
    content = (
        f"PGRST_DB_URI=postgresql://mapa_api_authenticator:{password}"
        "@127.0.0.1:5432/mapa_unificado_teste\n"
        "PGRST_DB_SCHEMAS=api\n"
        "PGRST_DB_ANON_ROLE=mapa_api_reader\n"
        "PGRST_SERVER_HOST=127.0.0.1\n"
        "PGRST_SERVER_PORT=13051\n"
    )
    os.umask(0o077)
    DEST.write_text(content, encoding="utf-8")
    DEST.chmod(0o600)
    print(f"Configuração criada em {DEST} (permissão 0600)")


if __name__ == "__main__":
    main()
