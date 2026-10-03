"""Start an isolated local PostgREST writer using the test Mapa DB credential.

Run as root on the test VPS. The private DSN is never printed or committed.
The writer listens only on 127.0.0.1:13058 and is reached through Flask.
"""

from __future__ import annotations

import os
from pathlib import Path
import subprocess


SOURCE = Path("/etc/mapa-unificado/writer.env")
DEST = Path("/etc/mapa-unificado/postgrest-writer.env")
CONTAINER = "mapa-unificado-postgrest-writer"


def main() -> None:
    if os.geteuid() != 0:
        raise SystemExit("Run as root on test VPS")
    if DEST.exists():
        raise SystemExit("Writer PostgREST config already exists; inspect it before retry")
    values = {}
    for line in SOURCE.read_text(encoding="utf-8").splitlines():
        if "=" in line and not line.lstrip().startswith("#"):
            key, value = line.split("=", 1)
            values[key] = value
    dsn = values.get("MAPA_WRITER_DATABASE_URL", "")
    if not dsn.endswith("/mapa_unificado_teste") or "@127.0.0.1:5432/" not in dsn:
        raise SystemExit("Writer DSN does not target local mapa_unificado_teste")
    os.umask(0o077)
    DEST.write_text(
        f"PGRST_DB_URI={dsn}\n"
        "PGRST_DB_SCHEMAS=public\n"
        "PGRST_DB_ANON_ROLE=mapa_api_writer\n"
        "PGRST_SERVER_HOST=127.0.0.1\n"
        "PGRST_SERVER_PORT=13058\n",
        encoding="utf-8",
    )
    DEST.chmod(0o600)
    result = subprocess.run([
        "docker", "run", "--detach", "--name", CONTAINER,
        "--network", "host", "--restart", "unless-stopped",
        "--env-file", str(DEST), "postgrest/postgrest:v16.3",
    ], capture_output=True, text=True)
    if result.returncode:
        raise SystemExit("Could not start local writer PostgREST: " + result.stderr[:300])
    print("Started isolated writer PostgREST on 127.0.0.1:13054")


if __name__ == "__main__":
    main()
