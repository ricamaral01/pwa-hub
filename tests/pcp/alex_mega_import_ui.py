"""Import a one-line synthetic Mega CSV through the original PCP test UI."""
from __future__ import annotations

import csv
import io
import json
import subprocess

from playwright.sync_api import sync_playwright

BASE = "https://concrefer.concretrack.com.br"
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
DATE = "2099-02-10"


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
        created_id = None
        try:
            page.goto(BASE + "/unificado/login.html?next=pcp/programacao-alex/")
            page.locator('#unificado-login-form [name="username"]').fill(account["PCP_TEST_USER"])
            page.locator('#unificado-login-form [name="password"]').fill(account["PCP_TEST_PASSWORD"])
            page.locator('#unificado-login-form button[type="submit"]').click()
            page.wait_for_url("**/unificado/pcp/programacao-alex/", timeout=20000)
            assert page.evaluate("async date => await API.get('/api/programacao-alex?data_inicio='"
                                 "+date+'&data_fim='+date)", DATE) == []
            products = page.evaluate("async () => await API.get('/api/produtos?setor_id=1')")
            options = page.evaluate("async () => await API.get('/api/programacao/opcoes-formas?setor_id=1')")
            eligible_codes = {item.get("produto_codigo") for option in options
                              for item in (option.get("produtos") or [option])}
            product = next(item for item in products if item.get("codigo") in eligible_codes)
            csv_text = io.StringIO()
            writer = csv.writer(csv_text, delimiter=";")
            writer.writerow(["Identificador", "Cód.Item", "Descrição", "Un.",
                             "Qtde.Estoque", "Qtde.Carteira", "Produção Diária", "Dias Prev. Prod."])
            writer.writerow(["E2E-ALX", product["codigo"], "E2E Mega", "UN", "3", "1", "2", "1"])
            page.locator("#alex-data").fill(DATE)
            page.locator("#alex-substituir").uncheck()
            with page.expect_response(lambda response: "/unificado/pcp/api/programacao-alex/importar-mega" in response.url,
                                      timeout=20000) as pending:
                page.locator("#alex-arquivo-mega").set_input_files({
                    "name": "e2e-mega.csv", "mimeType": "text/csv",
                    "buffer": csv_text.getvalue().encode("utf-8-sig")})
            response = pending.value
            assert response.status == 200, response.status
            result = response.json()
            assert result["importados"] == 1 and result["removidos"] == 0, result
            rows = page.evaluate("async date => await API.get('/api/programacao-alex?data_inicio='"
                                 "+date+'&data_fim='+date)", DATE)
            assert len(rows) == 1, rows
            row = rows[0]
            created_id = row["id"]
            assert row["codigo_item"] == product["codigo"]
            assert row["producao_diaria"] == 2 and row["qtde_estoque"] == 3
            assert row["qtde_carteira"] == 1 and row["saldo"] == 2
            page.wait_for_function("() => document.querySelector('#tbody-prog-alex')?.textContent.includes('E2E Mega')")
            assert page.locator("#tbody-formas-setor .formas-grid-row[data-row]").count() > 0
            assert not page.locator("#tbody-prog-alex").is_visible()
            page.on("dialog", lambda dialog: dialog.accept())
            with page.expect_response(lambda response: "/unificado/pcp/api/programacao-alex/limpar" in response.url,
                                      timeout=15000) as pending_clear:
                page.locator("#btn-limpar-programacao-alex").click()
            cleared = pending_clear.value
            assert cleared.status == 200 and cleared.json()["removidos"] == 0
            remaining = page.evaluate("async date => await API.get('/api/programacao-alex?data_inicio='"
                                      "+date+'&data_fim='+date)", DATE)
            assert len(remaining) == 1 and remaining[0]["id"] == created_id
        finally:
            if created_id is not None:
                page.evaluate("async id => await API.delete('/api/programacao-alex/'+id)", created_id)
            context.close()
            browser.close()
    print(json.dumps({"alex_mega_ui": "import_equal_clear_noop_preserved", "rows": 1,
                      "test_db_cleaned": True}))


if __name__ == "__main__":
    main()
