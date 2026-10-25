"""One-shot exact GED 20/25 MiB boundary probes using synthetic account."""
from __future__ import annotations

import json
import subprocess
import requests

BASE = "https://concrefer.concretrack.com.br/unificado/ged/api"
TASK = "b7ed9e58-156e-4440-8281-1e4fd406be81"


def main():
    raw = subprocess.check_output(["ssh", "vps-staging", "cat", "/etc/ged-a5-probe.env"], text=True)
    creds = dict(line.split("=", 1) for line in raw.splitlines() if "=" in line)
    login = requests.post(BASE + "/auth/login", json={
        "username": creds["ADMIN_MASTER_USER"], "password": creds["ADMIN_MASTER_PASSWORD"]}, timeout=20)
    assert login.status_code == 200
    auth = {"Authorization": "Bearer " + login.json()["token"]}
    cal_size = 20 * 1024 * 1024
    cal = requests.post(BASE + "/calibrations", headers=auth, data={
        "equipment_code": "E2E-A5-EXACT-20", "equipment_name": "Calibrador sintético tamanho exato",
        "laboratory": "Laboratório sintético", "certificate_number": "E2E-A5-CAL-EXACT-20",
        "calibration_date": "2026-10-15", "due_date": "2027-10-15"},
        files={"file": ("exact-20.pdf", b"x" * cal_size, "application/pdf")}, timeout=120)
    task_size = 25 * 1024 * 1024
    task = requests.post(BASE + f"/tasks/{TASK}/attachments", headers=auth,
        files={"file": ("exact-25.txt", b"x" * task_size, "text/plain")}, timeout=120)
    print(json.dumps({
        "20mib": {"status": cal.status_code, "id": cal.json().get("id") if cal.status_code == 201 else None,
                   "error": cal.json().get("error") if cal.status_code != 201 else None},
        "25mib": {"status": task.status_code, "id": task.json().get("id") if task.status_code == 201 else None,
                   "error": task.json().get("error") if task.status_code != 201 else None},
    }))


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"20/25 MiB boundary failed: {type(error).__name__}")
        raise SystemExit(1) from None
