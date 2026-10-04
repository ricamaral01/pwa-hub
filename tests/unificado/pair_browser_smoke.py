"""Open both modules and log out with one synthetic Mapa-base identity."""

from __future__ import annotations

import json
import subprocess
from urllib.parse import urlsplit

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
        context = browser.new_context(viewport={"width": 1366, "height": 768}, service_workers="block")
        outside, responses, errors = [], [], []
        def restrict(route):
            host = urlsplit(route.request.url).hostname
            if host != "concrefer.concretrack.com.br":
                outside.append(host)
                route.abort()
            else:
                route.continue_()
        context.route("**/*", restrict)
        page = context.new_page()
        page.on("pageerror", lambda error: errors.append(str(error)[:180]))
        page.on("response", lambda response: responses.append(
            (urlsplit(response.url).path, response.status)) if "/api/" in response.url else None)
        page.goto(BASE + "/unificado/login.html", wait_until="domcontentloaded")
        page.locator('#unificado-login-form [name="username"]').fill(account["MAPA_TEST_USER"])
        page.locator('#unificado-login-form [name="password"]').fill(account["MAPA_TEST_PASSWORD"])
        page.locator('#unificado-login-form button[type="submit"]').click()
        page.wait_for_url("**/unificado/index.html", timeout=20000)
        page.wait_for_function("() => document.querySelector('.sample-note')?.textContent.includes('Dados de')")
        menu = page.locator(".module-button").all_text_contents()
        assert menu == ["Planejamento", "Produção"], menu
        assert page.locator(".sector-card").count() == 4
        assert page.evaluate("!!localStorage.getItem('pcp_token')")
        assert ("/unificado/pcp/api/dashboard", 200) in responses
        assert ("/unificado/mapa/api/rest/v1/rpc/rpc_dashboard_produtividade_resumo_v1", 200) in responses
        page.goto(BASE + "/unificado/pcp/dashboard/", wait_until="domcontentloaded")
        assert urlsplit(page.url).path == "/unificado/pcp/dashboard/"
        page.goto(BASE + "/unificado/mapa/operacao/", wait_until="domcontentloaded")
        page.wait_for_function("state.authUser?.role === 'GERENCIA'", timeout=15000)
        page.goto(BASE + "/unificado/index.html", wait_until="domcontentloaded")
        page.locator(".exit-button").click()
        page.wait_for_url("**/unificado/login.html", timeout=15000)
        assert not page.evaluate("!!localStorage.getItem('pcp_token')")
        denied = page.goto(BASE + "/unificado/testar/", wait_until="domcontentloaded")
        assert denied and denied.status == 401
        assert not outside and not errors, {"outside": outside, "errors": errors}
        print(json.dumps({"pair_browser": "ok", "modules": menu,
                          "pcp_api": 200, "mapa_api": 200, "both_pages": "opened",
                          "logout_testar": 401, "external_calls": 0}, ensure_ascii=False))
        context.close()
        browser.close()


if __name__ == "__main__":
    main()
