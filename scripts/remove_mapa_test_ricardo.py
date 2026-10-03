"""Remove the superseded synthetic Ricardo account from the Mapa test DB only."""

from __future__ import annotations

import os
from pathlib import Path
import sys


def main() -> None:
    for line in Path("/etc/mapa-unificado/auth.env").read_text().splitlines():
        if line.strip() and not line.lstrip().startswith("#") and "=" in line:
            key, value = line.strip().split("=", 1)
            os.environ[key] = value.strip().strip('"').strip("'")
    sys.path.insert(0, "/opt/mapa-unificado-api")
    from app import connect

    synthetic = ("ricardo-operacao-teste", "e2e-gestor", "e2e-montador", "e2e-apontador")
    with connect() as conn, conn.cursor() as cursor:
        cursor.execute("DELETE FROM public.usuarios WHERE id = ANY(%s) RETURNING id",
                       (list(synthetic),))
        removed = cursor.rowcount
        cursor.execute("SELECT count(*) AS total FROM public.usuarios WHERE id = ANY(%s)",
                       (list(synthetic),))
        assert cursor.fetchone()["total"] == 0
    Path("/etc/mapa-unificado/operacao-test-login.env").unlink(missing_ok=True)
    Path("/etc/mapa-unificado/operacao-test-profiles.env").unlink(missing_ok=True)
    print(f"synthetic_accounts_removed={removed} remaining=0 credential_files_removed=true")


if __name__ == "__main__":
    main()
