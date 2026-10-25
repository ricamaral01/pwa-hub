"""Rotate only the synthetic GED A5 admin password after a diagnostic leak."""
from __future__ import annotations

import secrets
import subprocess
import requests

BASE = "https://concrefer.concretrack.com.br/unificado/ged/api"
ENV = "/etc/ged-a5-probe.env"


def main():
    raw = subprocess.check_output(["ssh", "vps-staging", "cat", ENV], text=True, encoding="utf-8")
    account = dict(line.split("=", 1) for line in raw.splitlines() if "=" in line)
    fresh = "Aa1!" + secrets.token_urlsafe(30)
    session = requests.Session()
    login = session.post(BASE + "/auth/login", json={
        "username": account["ADMIN_MASTER_USER"], "password": account["ADMIN_MASTER_PASSWORD"]}, timeout=20)
    assert login.status_code == 200, f"login status {login.status_code}"
    token = login.json()["token"]
    rotated = session.post(BASE + "/auth/change-password", json={
        "current_password": account["ADMIN_MASTER_PASSWORD"],
        "new_password": fresh, "confirm_password": fresh},
        headers={"Authorization": "Bearer " + token}, timeout=20)
    assert rotated.status_code == 200, f"rotation status {rotated.status_code}"
    account["ADMIN_MASTER_PASSWORD"] = fresh
    serialized = "".join(f"{key}={value}\n" for key, value in account.items())
    saved = subprocess.run(["ssh", "vps-staging", "cat > /etc/ged-a5-probe.env"],
                           input=serialized, text=True, capture_output=True)
    assert saved.returncode == 0, "remote credential store failed"
    mode = subprocess.check_output(["ssh", "vps-staging", "stat", "-c", "%a", ENV], text=True).strip()
    assert mode == "600", f"unexpected credential mode {mode}"
    revoked = session.get(BASE + "/auth/me", headers={"Authorization": "Bearer " + token}, timeout=20)
    assert revoked.status_code == 401, f"old session still active: {revoked.status_code}"
    relogin = session.post(BASE + "/auth/login", json={
        "username": account["ADMIN_MASTER_USER"], "password": fresh}, timeout=20)
    assert relogin.status_code == 200, f"new login status {relogin.status_code}"
    print("synthetic GED admin password rotated; old token revoked; new login 200; file mode 600")


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"Rotation failed: {type(error).__name__}")
        raise SystemExit(1) from None
