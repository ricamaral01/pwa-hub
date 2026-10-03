"""Move only the newly created test writer container off occupied port 13054."""

from __future__ import annotations

import os
from pathlib import Path
import socket
import subprocess


CONFIG = Path("/etc/mapa-unificado/postgrest-writer.env")
CONTAINER = "mapa-unificado-postgrest-writer"


def main() -> None:
    if os.geteuid() != 0:
        raise SystemExit("Run as root on test VPS")
    with socket.socket() as sock:
        try:
            sock.bind(("127.0.0.1", 13058))
        except OSError as error:
            raise SystemExit(f"Replacement port occupied: {error}") from error
    image = subprocess.run(["docker", "inspect", "--format", "{{.Config.Image}}", CONTAINER],
                           capture_output=True, text=True, check=True).stdout.strip()
    if image != "postgrest/postgrest:v16.3":
        raise SystemExit("Container image mismatch; refusing replacement")
    original = CONFIG.read_text(encoding="utf-8")
    if original.count("PGRST_SERVER_PORT=13054\n") != 1:
        raise SystemExit("Unexpected private writer config; refusing replacement")
    subprocess.run(["docker", "rm", "--force", CONTAINER], check=True, capture_output=True)
    CONFIG.write_text(original.replace("PGRST_SERVER_PORT=13054\n", "PGRST_SERVER_PORT=13058\n"),
                      encoding="utf-8")
    CONFIG.chmod(0o600)
    subprocess.run([
        "docker", "run", "--detach", "--name", CONTAINER, "--network", "host",
        "--restart", "unless-stopped", "--env-file", str(CONFIG),
        "postgrest/postgrest:v16.3",
    ], check=True, capture_output=True)
    print("Isolated writer PostgREST moved to 127.0.0.1:13058")


if __name__ == "__main__":
    main()
