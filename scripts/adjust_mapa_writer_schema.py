"""Expose public test tables to the isolated writer PostgREST, then restart it."""

from __future__ import annotations

import os
from pathlib import Path
import subprocess


CONFIG = Path("/etc/mapa-unificado/postgrest-writer.env")
CONTAINER = "mapa-unificado-postgrest-writer"


def main() -> None:
    if os.geteuid() != 0:
        raise SystemExit("Run as root on test VPS")
    image = subprocess.run(["docker", "inspect", "--format", "{{.Config.Image}}", CONTAINER],
                           capture_output=True, text=True, check=True).stdout.strip()
    if image != "postgrest/postgrest:v16.3":
        raise SystemExit("Unexpected container image")
    original = CONFIG.read_text(encoding="utf-8")
    if original.count("PGRST_DB_SCHEMAS=api\n") != 1 or "PGRST_SERVER_PORT=13058\n" not in original:
        raise SystemExit("Unexpected private writer config")
    subprocess.run(["docker", "rm", "--force", CONTAINER], capture_output=True, check=True)
    CONFIG.write_text(original.replace("PGRST_DB_SCHEMAS=api\n", "PGRST_DB_SCHEMAS=public\n"),
                      encoding="utf-8")
    CONFIG.chmod(0o600)
    subprocess.run([
        "docker", "run", "--detach", "--name", CONTAINER, "--network", "host",
        "--restart", "unless-stopped", "--env-file", str(CONFIG),
        "postgrest/postgrest:v16.3",
    ], capture_output=True, check=True)
    print("Writer PostgREST now uses public test tables on 127.0.0.1:13058")


if __name__ == "__main__":
    main()
