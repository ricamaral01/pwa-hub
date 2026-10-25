"""Test the existing unified login screen with a removable PCP-only user."""

from __future__ import annotations

import argparse
import os
import secrets
import subprocess

from playwright.sync_api import sync_playwright


CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
BASE = os.environ.get("UNIFICADO_BASE_URL", "https://concrefer.concretrack.com.br").rstrip("/")
TESTAR = BASE + "/unificado/testar/"


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--first-access", action="store_true")
    args = parser.parse_args()
    raw = subprocess.check_output(
        ["ssh", "vps-staging", "cat", "/etc/mapa-unificado/pcp-auth-probe.env"],
        text=True, encoding="utf-8",
    )
    account = dict(line.split("=", 1) for line in raw.splitlines() if "=" in line)
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True, executable_path=CHROME)
        context = browser.new_context(service_workers="block")
        page = context.new_page()
        page.goto(BASE + "/unificado/login.html?next=testar/",
                  wait_until="domcontentloaded")
        page.locator('#unificado-login-form [name="username"]').fill(account["PCP_TEST_USER"])
        page.locator('#unificado-login-form [name="password"]').fill(account["PCP_TEST_PASSWORD"])
        page.locator('#unificado-login-form button[type="submit"]').click()
        if args.first_access:
            page.locator("#first-access-form").wait_for(state="visible", timeout=15000)
            new_password = secrets.token_urlsafe(12)
            page.locator('#first-access-form [name="newPassword"]').fill(new_password)
            page.locator('#first-access-form [name="confirmPassword"]').fill(new_password)
            page.locator('#first-access-form button[type="submit"]').click()
        page.wait_for_url(TESTAR, timeout=15000)
        assert "Acompanhamento do sistema unificado" in page.locator("body").inner_text()
        assert page.evaluate("!!localStorage.getItem('pcp_token')")
        page.goto(BASE + "/unificado/login.html")
        page.wait_for_function("!!window.UnificadoAuth")
        # logout navigates the page; return before that navigation destroys
        # Playwright's evaluation context.
        with page.expect_navigation(wait_until="domcontentloaded", timeout=15000):
            page.evaluate("() => { void UnificadoAuth.logout(); return true; }")
        assert not page.evaluate("!!localStorage.getItem('pcp_token')")
        locked = page.goto(TESTAR, wait_until="domcontentloaded")
        assert locked and locked.status == 401
        print("pcp_only_unified_login=ok first_access="
              + ("ok" if args.first_access else "not_requested")
              + " testar_auth=200 logout=ok testar_after_logout=401 synthetic_password_displayed=false")
        context.close()
        browser.close()


if __name__ == "__main__":
    main()
