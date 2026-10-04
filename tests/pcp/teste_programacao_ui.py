"""Run the original automatic planning simulator UI without database writes."""
from __future__ import annotations

import json
import subprocess

from playwright.sync_api import sync_playwright

BASE = "https://concrefer.concretrack.com.br"
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
DATE = "2099-02-09"


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
        writes = []
        page.on("request", lambda request: writes.append(request.post_data_json)
                if "/unificado/pcp/api/teste-prog/programar" in request.url
                and request.method == "POST" else None)
        try:
            page.goto(BASE + "/unificado/login.html?next=pcp/teste-programacao/",
                      wait_until="domcontentloaded")
            page.locator('#unificado-login-form [name="username"]').fill(account["PCP_TEST_USER"])
            page.locator('#unificado-login-form [name="password"]').fill(account["PCP_TEST_PASSWORD"])
            page.locator('#unificado-login-form button[type="submit"]').click()
            page.wait_for_url("**/unificado/pcp/teste-programacao/", timeout=20000)
            page.locator("#param-setor option[value='3']").wait_for(state="attached")
            page.locator("#param-data").fill(DATE)
            page.locator("#param-setor").select_option("3")
            prompts = iter(["9X200", "1"])
            page.on("dialog", lambda dialog: dialog.accept(next(prompts)))
            page.locator("#btn-manual").click()
            assert "9X200" in page.locator("#tbody-demanda").inner_text()
            with page.expect_response(lambda response: "/api/teste-prog/programar" in response.url,
                                      timeout=15000) as pending:
                page.locator("#btn-programar").click()
            result = pending.value
            assert writes == [{"data_inicio": DATE, "setor_id": 3,
                               "demanda": [{"poste": "9X200", "quantidade": 1,
                                            "urgente": False}]}], writes
            if result.status == 500:
                assert result.text() == "Internal Server Error"
                page.wait_for_function("() => document.querySelector('#card-resultado').style.display === 'none'")
                print(json.dumps({"teste_programacao_ui": "original_error_preserved",
                                  "http": 500, "database_writes": 0}))
                return
            assert result.status == 200
            page.wait_for_function("() => estadoAtual.resultado !== null", timeout=15000)
            response = page.evaluate("() => estadoAtual.resultado")
            assert response["demanda_total"] == 1
            assert page.locator("#kpi-dem").inner_text() == "1"
            print(json.dumps({"teste_programacao_ui": "request_result_equal",
                              "demand_total": response["demanda_total"],
                              "allocated_total": response["alocado_total"],
                              "database_writes": 0}))
        finally:
            context.close()
            browser.close()


if __name__ == "__main__":
    main()
