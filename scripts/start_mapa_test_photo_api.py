"""Build the unchanged original photo API for isolated Mapa test storage."""

from __future__ import annotations

import os
from pathlib import Path
import socket
import subprocess


SOURCE = Path("/opt/concrefer-unificado/photo-api")
STORAGE = Path("/opt/concrefer-unificado/photo-storage")
IMAGE = "mapa-unificado-photo-test:20261003"
CONTAINER = "mapa-unificado-photo-test"


def main() -> None:
    if os.geteuid() != 0:
        raise SystemExit("Run as root on test VPS")
    for name in ("server.js", "package.json", "package-lock.json", "Dockerfile"):
        if not (SOURCE / name).is_file():
            raise SystemExit(f"Missing photo source file: {name}")
    with socket.socket() as sock:
        try:
            sock.bind(("127.0.0.1", 13059))
        except OSError as error:
            raise SystemExit(f"Photo API port occupied: {error}") from error
    if STORAGE.exists() and any(STORAGE.iterdir()):
        raise SystemExit("Storage is not empty; inspect before starting")
    STORAGE.mkdir(mode=0o700, exist_ok=True)
    os.chown(STORAGE, 33, 33)
    STORAGE.chmod(0o700)
    index = STORAGE / "fotos-inspecao.json"
    index.write_text("[]", encoding="utf-8")
    os.chown(index, 33, 33)
    index.chmod(0o600)
    subprocess.run(["docker", "build", "--tag", IMAGE, str(SOURCE)], check=True)
    subprocess.run([
        "docker", "run", "--detach", "--name", CONTAINER,
        "--network", "host", "--restart", "unless-stopped",
        "--user", "33:33", "--mount", f"type=bind,src={STORAGE},dst=/storage",
        IMAGE,
    ], check=True, capture_output=True)
    print("Photo API started on 127.0.0.1:13059; original photo index was empty")


if __name__ == "__main__":
    main()
