"""Check whether a 50 MiB GED document file passes multipart/Nginx ceiling."""
from __future__ import annotations

import json
import subprocess
import requests

BASE = "https://concrefer.concretrack.com.br/unificado/ged/api"
DOC = "13c37107-bff7-456f-8eb3-baf0276eec57"


def main():
    raw = subprocess.check_output(["ssh", "vps-staging", "cat", "/etc/ged-a5-probe.env"], text=True)
    account = dict(line.split("=", 1) for line in raw.splitlines() if "=" in line)
    login = requests.post(BASE + "/auth/login", json={"username": account["ADMIN_MASTER_USER"],
                           "password": account["ADMIN_MASTER_PASSWORD"]}, timeout=20)
    assert login.status_code == 200
    auth = {"Authorization": "Bearer " + login.json()["token"]}
    size = 50 * 1024 * 1024
    payload = b"%PDF-1.4\n" + b"x" * (size - len(b"%PDF-1.4\n"))
    response = requests.post(BASE + f"/documents/{DOC}/upload", headers=auth,
                             files={"file": ("exact-50-a5.pdf", payload, "application/pdf")}, timeout=120)
    print(json.dumps({"size": size, "status": response.status_code,
                      "version_id": response.json().get("id") if response.status_code == 201 else None,
                      "error": response.json().get("error") if response.status_code != 201 and response.headers.get("Content-Type", "").startswith("application/json") else None}))


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"50 MiB boundary failed: {type(error).__name__}")
        raise SystemExit(1) from None
