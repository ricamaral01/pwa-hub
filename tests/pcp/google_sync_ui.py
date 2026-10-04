"""Click original PCP Google Sheets sync buttons against only the PCP test DB."""
from __future__ import annotations

import json
import subprocess

from playwright.sync_api import sync_playwright

BASE = "https://concrefer.concretrack.com.br"
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
DATE = "2026-10-09"


def main() -> None:
    raw = subprocess.check_output(
        ["ssh", "vps-staging", "cat", "/etc/mapa-unificado/pcp-auth-probe.env"],
        text=True, encoding="utf-8")
    account = dict(line.split("=", 1) for line in raw.splitlines() if "=" in line)
    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True, executable_path=CHROME)
        context = browser.new_context(viewport={"width": 1366, "height": 768},
                                      service_workers="block")
        page = context.new_page()
        page.goto(BASE + "/unificado/login.html?next=pcp/programacao/")
        page.locator('#unificado-login-form [name="username"]').fill(account["PCP_TEST_USER"])
        page.locator('#unificado-login-form [name="password"]').fill(account["PCP_TEST_PASSWORD"])
        page.locator('#unificado-login-form button[type="submit"]').click()
        page.wait_for_url("**/unificado/pcp/programacao/", timeout=20000)
        assert page.locator("#importar-substituir").is_checked()
        assert not page.locator("#importar-substituir").is_visible()
        result = []
        page.on("dialog", lambda dialog: dialog.accept())
        for sector, prefix, button in ((3, "f", "btn-sync-google-sheets"),
                                       (4, "f4", "btn-sync-google-sheets-s4")):
            page.locator(f"#{prefix}-inicio").fill(DATE)
            page.locator(f"#{prefix}-fim").fill(DATE)
            before = page.evaluate("async date => await API.get('/api/programacao?data_inicio='"
                                   "+date+'&data_fim='+date)", DATE)
            assert before == [], before
            with page.expect_response(lambda response: "/unificado/pcp/api/pcp/alocacao-formas/importar" in response.url,
                                      timeout=30000) as pending:
                page.locator(f"#{button}").click()
            response = pending.value
            assert response.status == 200, (sector, response.status)
            assert f"setor={sector}" in response.url
            assert "substituir=true" in response.url
            assert "data_inicial=2026-10-09" in response.url
            data = response.json()
            assert data["importados"] == 0 and data["removidos"] == 0, data
            after = page.evaluate("async date => await API.get('/api/programacao?data_inicio='"
                                  "+date+'&data_fim='+date)", DATE)
            assert before == after
            result.append({"sector": sector, "http": response.status,
                           "imported": data["importados"], "removed": data["removidos"],
                           "test_rows_unchanged": True})
        context.close()
        browser.close()
    print(json.dumps(result))


if __name__ == "__main__":
    main()
