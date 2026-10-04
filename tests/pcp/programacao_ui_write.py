"""Create and delete a future PCP programming row through the published UI."""
from __future__ import annotations

import json
import subprocess

from playwright.sync_api import sync_playwright

BASE = "https://concrefer.concretrack.com.br"
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
DATE = "2099-02-01"


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
        created_id = None
        def capture(req):
            if "/unificado/pcp/api/programacao" in req.url and req.method in {"POST", "DELETE"}:
                writes.append({"method": req.method,
                               "path": req.url.split("/unificado/pcp/api", 1)[-1].split("?", 1)[0],
                               "body": req.post_data_json if req.method == "POST" and req.post_data else None})
        page.on("request", capture)
        try:
            page.goto(BASE + "/unificado/login.html?next=pcp/programacao/",
                      wait_until="domcontentloaded")
            page.locator('#unificado-login-form [name="username"]').fill(account["PCP_TEST_USER"])
            page.locator('#unificado-login-form [name="password"]').fill(account["PCP_TEST_PASSWORD"])
            page.locator('#unificado-login-form button[type="submit"]').click()
            page.wait_for_url("**/unificado/pcp/programacao/", timeout=20000)
            page.locator('#prog-setor option[value="3"]').wait_for(state="attached")
            page.locator("#f-inicio").fill(DATE)
            page.locator("#f-fim").fill(DATE)
            page.locator("#f-setor").select_option("3")
            page.locator("#btn-buscar").click()
            assert page.evaluate("async () => await API.get('/api/programacao?data_inicio="
                                 + DATE + "&data_fim=" + DATE + "&setor_id=3')") == []
            page.locator("#prog-data").fill(DATE)
            page.locator("#prog-setor").select_option("3")
            page.locator("#prog-produto option[value]:not([value=''])").first.wait_for(state="attached")
            product = page.locator("#prog-produto option[value]:not([value=''])").first.get_attribute("value")
            page.locator("#prog-produto").select_option(product)
            page.locator("#prog-qtd").fill("1")
            volume = float(page.locator("#prog-vol").input_value())
            page.locator("#form-prog button[type=submit]").click()
            page.wait_for_function("() => document.querySelector('#toast-container')?.textContent.includes('Programação adicionada')",
                                   timeout=15000)
            rows = page.evaluate("async () => await API.get('/api/programacao?data_inicio="
                                 + DATE + "&data_fim=" + DATE + "&setor_id=3')")
            assert len(rows) == 1, rows
            row = rows[0]
            created_id = row["id"]
            expected = {"data": DATE, "setor_id": 3, "produto_id": int(product),
                        "quantidade_programada": 1, "volume_m3_programado": volume}
            assert writes and writes[0]["method"] == "POST" and writes[0]["body"] == expected
            assert all(row.get(key) == value for key, value in expected.items()
                       if key != "volume_m3_programado"), row
            assert float(row["volume_m3_programado"]) == volume
            page.wait_for_function("() => document.querySelector('#tbody-prog')?.textContent.includes('01/02/2099')")
            assert row["produto"]["nome"] in page.locator("#tbody-prog").inner_text()
            page.on("dialog", lambda dialog: dialog.accept())
            page.locator("#tbody-prog button", has=page.locator(".bi-trash")).first.click()
            page.wait_for_function("() => document.querySelector('#toast-container')?.textContent.includes('Excluído')")
            remaining = page.evaluate("async () => await API.get('/api/programacao?data_inicio="
                                      + DATE + "&data_fim=" + DATE + "&setor_id=3')")
            assert remaining == []
            assert [item["method"] for item in writes] == ["POST", "DELETE"]
            created_id = None
            print(json.dumps({"pcp_programacao_ui": "create_read_delete_equal",
                              "request_fields": sorted(expected), "test_db_cleaned": True}))
        finally:
            if created_id is not None:
                page.evaluate("async id => await API.delete('/api/programacao/'+id)", created_id)
            context.close()
            browser.close()


if __name__ == "__main__":
    main()
