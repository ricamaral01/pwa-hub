"""Check the printable Unificado mandrel withdrawal report with mocked API data."""

from __future__ import annotations

import json
from pathlib import Path

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "unificado" / "mapa" / "operacao" / "mandril-report.js"
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"


def main() -> None:
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True, executable_path=CHROME)
        page = browser.new_page()
        page.route("https://concrefer.concretrack.com.br/unificado/mapa/operacao/", lambda route:
                   route.fulfill(status=200, content_type="text/html", body="""
            <section id="viewMandrilCircular">
              <input id="mcFiltroData" type="date" value="2026-10-13">
              <div><button>Atualizar saques</button><span id="mcSaqueStatus"></span></div>
            </section>"""))
        page.route("**/pcp/saques-mandril?*", lambda route: route.fulfill(
            status=200, content_type="application/json", body=json.dumps([{
                "data": "2026-10-13", "codigo_forma": "SC01",
                "data_hora_saque": "2026-10-13T15:40:00Z"
            }])))
        page.route("**/rest/v1/producao?*", lambda route: route.fulfill(
            status=200, content_type="application/json", body=json.dumps([{
                "forma": "SC01", "modelo": "9x200",
                "data_hora": "2026-10-13T12:30:00Z"
            }])))
        page.goto("https://concrefer.concretrack.com.br/unificado/mapa/operacao/")
        page.add_script_tag(path=str(SCRIPT))
        page.get_by_role("button", name="Relatório de saques").click()
        page.locator("#umrRows tr").first.wait_for()
        row = page.locator("#umrRows tr").first.inner_text()
        assert "SC01" in row and "9x200" in row, row
        assert "13/10/2026, 12:40" in row, row
        assert "3h 10min" in row, row
        assert "1 saque confirmado" in page.locator("#umrSummary").inner_text()
        browser.close()
    print("relatório de saques verificado")


if __name__ == "__main__":
    main()
