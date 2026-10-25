"""One final exact 20 MiB GED calibration probe with a unique synthetic key."""
from __future__ import annotations
import json
import subprocess
from uuid import uuid4
import requests

BASE = "https://concrefer.concretrack.com.br/unificado/ged/api"


def main() -> None:
    raw = subprocess.check_output(["ssh", "vps-staging", "cat", "/etc/ged-a5-probe.env"], text=True)
    creds = dict(line.split("=", 1) for line in raw.splitlines() if "=" in line)
    login = requests.post(BASE + "/auth/login", json={
        "username": creds["ADMIN_MASTER_USER"], "password": creds["ADMIN_MASTER_PASSWORD"]}, timeout=15)
    assert login.status_code == 200
    suffix = uuid4().hex[:8]
    response = requests.post(BASE + "/calibrations", headers={
        "Authorization": "Bearer " + login.json()["token"]}, data={
        "equipment_code": "E2E-A5-EXACT-20-" + suffix,
        "equipment_name": "Calibrador sintetico tamanho exato",
        "laboratory": "Laboratorio sintetico",
        "certificate_number": "E2E-A5-CAL-EXACT-20-" + suffix,
        "calibration_date": "2026-10-15", "due_date": "2027-10-15"},
        files={"file": ("exact-20.pdf", b"x" * (20 * 1024 * 1024), "application/pdf")},
        timeout=40)
    body = response.json()
    print(json.dumps({"bytes": 20 * 1024 * 1024, "status": response.status_code,
                      "id": body.get("id") if response.status_code == 201 else None,
                      "error": body.get("error") if response.status_code != 201 else None}))
    assert response.status_code == 201


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"20 MiB exact failed: {type(error).__name__}")
        raise SystemExit(1) from None
