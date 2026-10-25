"""Create synthetic GED destination accounts via API and store secrets root-only.

This is setup for A5. It never touches the old GED host.
"""
from __future__ import annotations

import secrets
import subprocess
from playwright.sync_api import sync_playwright

BASE = "https://concrefer.concretrack.com.br/unificado/ged/api"
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"


def main():
    token = subprocess.check_output(["ssh", "vps-staging", "docker", "exec", "ged_backend",
                                     "node", "/tmp/a5-admin-token.js"], text=True).strip()
    assert token
    entries = []
    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True, executable_path=CHROME)
        context = browser.new_context(extra_http_headers={"Authorization": "Bearer " + token})
        for role in ("ADMIN_MASTER", "QUALIDADE", "OPERACIONAL"):
            username = "e2e-ged-a5-" + role.lower().replace("_", "-")
            password = "Aa1!" + secrets.token_urlsafe(22)
            response = context.request.post(BASE + "/users", data={
                "name": "Ensaio GED A5 " + role,
                "username": username,
                "email": username + "@local.invalid",
                "password": password,
                "role": role,
                "active": True,
                "must_change_password": False,
            })
            assert response.status == 201, (role, response.status, response.text()[:300])
            result = response.json()
            entries.append(f"{role}_USER={username}\n{role}_PASSWORD={password}\n{role}_ID={result['id']}\n")
            print("created", role, result["id"])
        context.close()
        browser.close()
    saved = subprocess.run(["ssh", "vps-staging",
                            "install -m 600 /dev/null /etc/ged-a5-probe.env && cat > /etc/ged-a5-probe.env"],
                           input="".join(entries), text=True, capture_output=True)
    assert saved.returncode == 0, saved.stderr
    print("credentials stored root-only on destination")


if __name__ == "__main__":
    main()
