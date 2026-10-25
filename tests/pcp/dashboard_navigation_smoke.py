"""Verify PCP dashboard iframe and a restricted screen through the unified shell."""
from __future__ import annotations

import argparse
import os
import subprocess

from playwright.sync_api import sync_playwright


BASE = os.environ.get("UNIFICADO_BASE_URL", "https://concrefer.concretrack.com.br").rstrip("/")
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
PROBES = {
    "ADMIN": "/etc/mapa-unificado/pcp-auth-admin-probe.env",
    "CONSULTA": "/etc/mapa-unificado/pcp-auth-probe.env",
}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--role", choices=PROBES, required=True)
    args = parser.parse_args()
    raw = subprocess.check_output(["ssh", "vps-staging", "cat", PROBES[args.role]],
                                  text=True, encoding="utf-8")
    account = dict(line.split("=", 1) for line in raw.splitlines() if "=" in line)
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, executable_path=CHROME)
        context = browser.new_context(service_workers="block")
        page = context.new_page()
        page.goto(BASE + "/unificado/login.html?next=pcp/dashboard/", wait_until="domcontentloaded")
        page.locator('#unificado-login-form [name="username"]').fill(account["PCP_TEST_USER"])
        page.locator('#unificado-login-form [name="password"]').fill(account["PCP_TEST_PASSWORD"])
        page.locator('#unificado-login-form button[type="submit"]').click()
        page.wait_for_url("**/unificado/?view=pcp%2Fdashboard%2F", timeout=20000)
        frame = page.frame_locator('iframe[src*="/unificado/pcp/dashboard/"]')
        frame.locator("text=Volumes consolidados no período").first.wait_for(
            state="visible", timeout=20000)
        assert "Você não tem acesso" not in frame.locator("body").inner_text()
        restricted = None
        if args.role == "CONSULTA":
            restricted = page.goto(BASE + "/unificado/pcp/usuarios/", wait_until="domcontentloaded")
            assert restricted and restricted.status == 403
        print(f"pcp_{args.role.lower()}_dashboard=visible restricted_users="
              + (str(restricted.status) if restricted else "not_checked"))
        context.close()
        browser.close()


if __name__ == "__main__":
    main()
