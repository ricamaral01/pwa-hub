"""The operation route must reuse the existing unified login screen."""

from __future__ import annotations

import os
import subprocess

from playwright.sync_api import sync_playwright


BASE = os.environ.get("UNIFICADO_BASE_URL", "https://concrefer.concretrack.com.br").rstrip("/")
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
        auth_events = []
        def record_auth(response):
            if '/unified/screen-access/me' in response.url or response.url.endswith('/mapa/api/logout'):
                auth_events.append((response.url.rsplit('/', 1)[-1], response.status,
                                    'set-cookie' in response.all_headers()))
        page.on('response', record_auth)
        page.goto(BASE + "/unificado/login.html?next=mapa/operacao/", wait_until="domcontentloaded")
        assert page.locator("#unificado-login-form").is_visible()
        page.locator('#unificado-login-form [name="username"]').fill(account["MAPA_TEST_USER"])
        page.locator('#unificado-login-form [name="password"]').fill(account["MAPA_TEST_PASSWORD"])
        page.locator('#unificado-login-form button[type="submit"]').click()
        page.wait_for_url("**/unificado/?view=mapa%2Foperacao%2F", timeout=20000)
        frame = page.frame_locator('iframe[src*="/unificado/mapa/operacao/"]')
        frame.locator("#viewHub").wait_for(state="visible", timeout=20000)
        with page.expect_response('**/unificado/mapa/api/logout', timeout=15000) as logout_response:
            page.locator('#sidebar-model-a button[aria-label="Sair"]').click()
        assert logout_response.value.status == 200, f'logout HTTP {logout_response.value.status}'
        page.wait_for_url("**/unificado/login.html*", timeout=15000)
        locked = page.goto(BASE + "/unificado/mapa/operacao/", wait_until="domcontentloaded")
        assert locked and locked.status == 403, (
            f"status={locked.status if locked else None} url={page.url} "
            f"cookie_names={[cookie['name'] for cookie in context.cookies()]} "
            f"auth_events={auth_events}")
        print("operation_redirect_to_single_login=ok map_session=ok map_logout=ok synthetic_password_displayed=false")
        context.close()
        browser.close()


if __name__ == "__main__":
    main()
