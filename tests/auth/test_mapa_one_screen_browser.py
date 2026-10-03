"""The operation route must reuse the existing unified login screen."""

from __future__ import annotations

import subprocess

from playwright.sync_api import sync_playwright


BASE = "https://concrefer.concretrack.com.br"
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"


def main() -> None:
    raw = subprocess.check_output(
        ["ssh", "vps-staging", "cat", "/etc/mapa-unificado/auth-probe.env"],
        text=True, encoding="utf-8")
    account = dict(line.split("=", 1) for line in raw.splitlines() if "=" in line)
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True, executable_path=CHROME)
        context = browser.new_context(service_workers="block")
        page = context.new_page()
        page.goto(BASE + "/unificado/mapa/operacao/", wait_until="domcontentloaded")
        page.wait_for_url("**/unificado/login.html?next=*", timeout=15000)
        assert page.locator("#unificado-login-form").is_visible()
        page.locator('#unificado-login-form [name="username"]').fill("Conta Sintética Gerência")
        page.locator('#unificado-login-form [name="password"]').fill(account["MAPA_TEST_PASSWORD"])
        page.locator('#unificado-login-form button[type="submit"]').click()
        page.wait_for_url(BASE + "/unificado/mapa/operacao/", timeout=15000)
        page.wait_for_function("state.authUser?.role === 'GERENCIA'", timeout=15000)
        assert page.locator("#viewHub").is_visible()
        page.locator("#authLogoutBtn").click()
        page.wait_for_timeout(500)
        page.reload(wait_until="domcontentloaded")
        page.wait_for_url("**/unificado/login.html?next=*", timeout=15000)
        print("operation_redirect_to_single_login=ok map_session=ok map_logout=ok synthetic_password_displayed=false")
        context.close()
        browser.close()


if __name__ == "__main__":
    main()
