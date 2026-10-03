"""Gera credencial isolada de escrita para a API de testes, sem imprimi-la."""

from __future__ import annotations

import os
from pathlib import Path
import secrets
import subprocess


DEST = Path("/etc/mapa-unificado/writer.env")


def main() -> None:
    if os.geteuid() != 0:
        raise SystemExit("Execute como root")
    if DEST.exists():
        raise SystemExit(f"Configuracao ja existe: {DEST}")
    password = secrets.token_hex(32)
    subprocess.run(
        ["sudo", "-u", "postgres", "psql", "-X", "-v", "ON_ERROR_STOP=1",
         "-d", "mapa_unificado_teste", "-c",
         f"ALTER ROLE mapa_api_writer PASSWORD '{password}'"],
        capture_output=True, text=True, check=True,
    )
    os.umask(0o077)
    DEST.write_text(
        "MAPA_WRITER_DATABASE_URL="
        f"postgresql://mapa_api_writer:{password}@127.0.0.1:5432/mapa_unificado_teste\n",
        encoding="utf-8",
    )
    DEST.chmod(0o600)
    print(f"Configuracao criada em {DEST} (permissao 0600)")


if __name__ == "__main__":
    main()
