"""Give the test auth service access only to the PCP test database DSN."""

from __future__ import annotations

import os
from pathlib import Path
import subprocess


SOURCE = Path("/etc/pcp-unificado/pcp.env")
TARGET = Path("/etc/mapa-unificado/unified-auth.env")
UNIT = Path("/etc/systemd/system/mapa-unificado-auth.service")
ANCHOR = "EnvironmentFile=/etc/mapa-unificado/writer.env"


def main() -> None:
    lines = SOURCE.read_text().splitlines()
    values = [line.partition("=")[2] for line in lines if line.startswith("DATABASE_URL=")]
    secrets = [line.partition("=")[2] for line in lines if line.startswith("SECRET_KEY=")]
    if len(values) != 1 or not values[0].strip() or len(secrets) != 1 or not secrets[0].strip():
        raise RuntimeError("PCP test database DSN or JWT secret not found exactly once")
    fd = os.open(TARGET, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
    with os.fdopen(fd, "w") as stream:
        stream.write("UNIFICADO_PCP_DATABASE_URL=" + values[0] + "\n")
        stream.write("UNIFICADO_PCP_JWT_SECRET_KEY=" + secrets[0] + "\n")
    os.chmod(TARGET, 0o600)
    original = UNIT.read_text()
    additional = "EnvironmentFile=/etc/mapa-unificado/unified-auth.env"
    if additional not in original:
        if original.count(ANCHOR) != 1:
            raise RuntimeError("Expected auth service environment anchor exactly once")
        UNIT.write_text(original.replace(ANCHOR, ANCHOR + "\n" + additional))
        subprocess.run(["systemctl", "daemon-reload"], check=True)
        subprocess.run(["systemctl", "restart", "mapa-unificado-auth.service"], check=True)
    print("unified_auth_test_db_env=ready service=active")


if __name__ == "__main__":
    main()
