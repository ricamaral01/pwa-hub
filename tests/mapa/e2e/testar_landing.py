"""Verify the protected test index through a temporary GERENCIA browser login."""

from __future__ import annotations

import argparse
import json
import secrets
import subprocess

from playwright.sync_api import sync_playwright

from operacao_smoke import CHROME


TESTAR = "https://concrefer.concretrack.com.br/unificado/testar/"


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--first-access", action="store_true")
    args = parser.parse_args()
    raw = subprocess.check_output(
        ["ssh", "vps-staging", "cat", "/etc/mapa-unificado/auth-probe.env"],
        text=True, encoding="utf-8",
    )
    account = dict(line.split("=", 1) for line in raw.splitlines() if "=" in line)
    snapshot = json.loads(subprocess.check_output(
        ["ssh", "vps-staging", "cat", "/opt/concrefer-unificado/mapa-api/snapshot-info.json"],
        text=True, encoding="utf-8"))["snapshot_at"]
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True, executable_path=CHROME)
        context = browser.new_context(viewport={"width": 1024, "height": 768},
                                      service_workers="block")
        page = context.new_page()
        unauth = page.goto(TESTAR, wait_until="domcontentloaded")
        assert unauth and unauth.status == 401
        page.goto("https://concrefer.concretrack.com.br/unificado/login.html?next=testar/",
                  wait_until="domcontentloaded")
        page.locator('#unificado-login-form [name="username"]').fill(account["MAPA_TEST_USER"])
        page.locator('#unificado-login-form [name="password"]').fill(account["MAPA_TEST_PASSWORD"])
        page.locator('#unificado-login-form button[type="submit"]').click()
        if args.first_access:
            page.locator("#first-access-form").wait_for(state="visible", timeout=15000)
            new_password = secrets.token_urlsafe(12)
            page.locator('#first-access-form [name="newPassword"]').fill(new_password)
            page.locator('#first-access-form [name="confirmPassword"]').fill(new_password)
            page.locator('#first-access-form button[type="submit"]').click()
        page.wait_for_url(TESTAR, timeout=15000)
        authorized = page.reload(wait_until="domcontentloaded")
        assert authorized and authorized.status == 200
        assert "Ambiente de teste. Nada lançado aqui vale como produção." in page.locator("body").inner_text()
        assert snapshot in page.locator("body").inner_text()
        assert "22 dos 24 fluxos" in page.locator("body").inner_text()
        print("testar_unauth=401 synthetic_gerencia_login=ok first_access="
              + ("ok" if args.first_access else "not_requested")
              + " testar_auth=200 synthetic_password_displayed=false")
        context.close()
        browser.close()


if __name__ == "__main__":
    main()
