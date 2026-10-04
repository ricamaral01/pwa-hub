"""Mark one synthetic Mega programming row through the published PCP screen."""
from __future__ import annotations

import json
import argparse
import subprocess
from urllib.parse import urlsplit

from playwright.sync_api import sync_playwright

BASE = "https://concrefer.concretrack.com.br"
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
DATE = "2099-02-05"
FORM = "E2E-MEGA-SC01"
NAME = "Conta Sintética Mega"
CLEANUP = ["ssh", "vps-staging", "/opt/concrefer-unificado/mapa-api/.venv/bin/python",
           "/opt/concrefer-unificado/migration/cleanup_pcp_mega_probe.py"]


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--setup-only", action="store_true")
    parser.add_argument("--reuse", action="store_true")
    args = parser.parse_args()
    if args.setup_only and args.reuse:
        parser.error("choose only one setup mode")
    raw = subprocess.check_output(
        ["ssh", "vps-staging", "cat", "/etc/mapa-unificado/pcp-auth-probe.env"],
        text=True, encoding="utf-8")
    account = dict(line.split("=", 1) for line in raw.splitlines() if "=" in line)
    writes = []
    external = []
    setup_ready = False
    try:
        with sync_playwright() as pw:
            browser = pw.chromium.launch(headless=True, executable_path=CHROME)
            context = browser.new_context(viewport={"width": 1366, "height": 768},
                                          service_workers="block")
            page = context.new_page()
            def capture(req):
                if urlsplit(req.url).hostname != "concrefer.concretrack.com.br":
                    external.append(urlsplit(req.url).hostname)
                if "/unificado/pcp/api/apontamento-mega/" in req.url and req.method == "POST":
                    writes.append({"path": urlsplit(req.url).path,
                                   "body": req.post_data_json})
            page.on("request", capture)
            page.goto(BASE + "/unificado/login.html?next=pcp/apontamento-mega/",
                      wait_until="domcontentloaded")
            page.locator('#unificado-login-form [name="username"]').fill(account["PCP_TEST_USER"])
            page.locator('#unificado-login-form [name="password"]').fill(account["PCP_TEST_PASSWORD"])
            page.locator('#unificado-login-form button[type="submit"]').click()
            page.wait_for_url("**/unificado/pcp/apontamento-mega/", timeout=20000)
            if args.reuse:
                candidates = page.evaluate("async date => await API.get('/api/programacao?data_inicio='+date+'&data_fim='+date)", DATE)
                matches = [row for row in candidates if row.get("codigo_forma") == FORM]
                assert len(matches) == 1, matches
                setup = matches[0]
            else:
                products = page.evaluate("async () => await API.get('/api/produtos?setor_id=3')")
                product = next(item for item in products if item.get("id"))
                setup = page.evaluate("""async ({date,form,product}) => {
                  return await API.post('/api/programacao',{
                    data:date,setor_id:3,produto_id:product,codigo_forma:form,
                    quantidade_programada:1,volume_m3_programado:0});
                }""", {"date": DATE, "form": FORM, "product": product["id"]})
            program_id = setup["id"]
            if args.setup_only:
                setup_ready = True
                print(json.dumps({"pcp_mega_setup": "ready", "test_db_only": True}))
                context.close()
                browser.close()
                return
            page.locator("#f-data").fill(DATE)
            page.locator("#nome-apontador").fill(NAME)
            page.locator("#btn-carregar").click()
            row = page.locator(f'#tbody-dia-34 tr[data-id="{program_id}"]')
            row.wait_for(state="visible", timeout=15000)
            assert FORM in row.inner_text() and "Pendente Mega" in row.inner_text()
            row.locator("button.check-btn").click()
            page.wait_for_function("id => document.querySelector('#tbody-dia-34 tr[data-id=\"'+id+'\"]')?.classList.contains('apontado')",
                                   arg=program_id, timeout=15000)
            checked = page.evaluate("async date => await API.get('/api/apontamento-mega?data='+date)", DATE)
            matches = [item for item in checked if item["programacao_id"] == program_id]
            assert len(matches) == 1 and matches[0]["apontado"] is True
            assert matches[0]["nome_apontador"] == NAME
            assert NAME in row.inner_text() and "btn-success" in row.locator("button").get_attribute("class")
            assert writes == [{"path": f"/unificado/pcp/api/apontamento-mega/{program_id}/apontar",
                               "body": {"nome_apontador": NAME}}], writes
            assert not external, external
            print(json.dumps({"pcp_mega_ui": "equal", "sector": 3,
                              "programacao_id_recorded": True, "official_requests": 0},
                             ensure_ascii=False))
            context.close()
            browser.close()
    finally:
        if not args.setup_only or not setup_ready:
            print(subprocess.check_output(CLEANUP, text=True, encoding="utf-8").strip())


if __name__ == "__main__":
    main()
