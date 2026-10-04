"""Verify Setor 1/2 official programming edit and delete in the Alex page."""
from __future__ import annotations

import argparse
import json
import subprocess

from playwright.sync_api import sync_playwright

BASE = "https://concrefer.concretrack.com.br"
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
DATE = "2099-02-07"


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--sector", choices=("1", "2"), required=True)
    args = parser.parse_args()
    sector = int(args.sector)
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
                               "body": req.post_data_json if req.post_data else None})
        page.on("request", capture)
        try:
            page.goto(BASE + "/unificado/login.html?next=pcp/programacao-alex/",
                      wait_until="domcontentloaded")
            page.locator('#unificado-login-form [name="username"]').fill(account["PCP_TEST_USER"])
            page.locator('#unificado-login-form [name="password"]').fill(account["PCP_TEST_PASSWORD"])
            page.locator('#unificado-login-form button[type="submit"]').click()
            page.wait_for_url("**/unificado/pcp/programacao-alex/", timeout=20000)
            products = page.evaluate("async sector => await API.get('/api/produtos?setor_id='+sector)", sector)
            assert products
            product = products[0]
            assert page.evaluate("async sector => await API.get('/api/programacao?data_inicio="
                                 + DATE + "&data_fim=" + DATE + "&setor_id='+sector)", sector) == []
            created = page.evaluate("async row => await API.post('/api/programacao',row)",
                                    {"data": DATE, "setor_id": sector, "produto_id": product["id"],
                                     "quantidade_programada": 1,
                                     "volume_m3_programado": float(product.get("volume") or 0)})
            created_id = created["id"]
            page.locator("#oficial-inicio").fill(DATE)
            page.locator("#oficial-fim").fill(DATE)
            page.locator("#oficial-setor").select_option(args.sector)
            page.locator("#btn-buscar-oficial").click()
            row = page.locator(f'#tbody-prog-oficial-12 tr[data-programacao-id="{created_id}"]')
            row.wait_for(state="visible")
            assert product["nome"] in row.inner_text()
            row.locator(".oficial-qtd-input").fill("2")
            page.locator("#btn-salvar-oficial").click()
            page.wait_for_function("id => document.querySelector(`[data-programacao-id=\"${id}\"] .oficial-qtd-input`)?.dataset.original === '2'",
                                   arg=created_id, timeout=15000)
            rows = page.evaluate("async sector => await API.get('/api/programacao?data_inicio="
                                 + DATE + "&data_fim=" + DATE + "&setor_id='+sector)", sector)
            assert len(rows) == 1 and rows[0]["quantidade_programada"] == 2
            assert float(rows[0]["volume_m3_programado"]) == 2 * float(product.get("volume") or 0)
            assert writes[1] == {"method": "POST", "path": "/programacao/atualizar-lote",
                                 "body": {"itens": [{"id": created_id, "quantidade_programada": 2}]}}, writes
            page.on("dialog", lambda dialog: dialog.accept())
            row.locator("button").click()
            page.wait_for_function("id => !document.querySelector(`[data-programacao-id=\"${id}\"]`)",
                                   arg=created_id, timeout=15000)
            assert page.evaluate("async sector => await API.get('/api/programacao?data_inicio="
                                 + DATE + "&data_fim=" + DATE + "&setor_id='+sector)", sector) == []
            assert writes[-1]["method"] == "DELETE"
            created_id = None
            print(json.dumps({"alex_official_ui": "edit_delete_equal", "sector": sector,
                              "row_cleaned": True}))
        finally:
            if created_id is not None:
                page.evaluate("async id => await API.delete('/api/programacao/'+id)", created_id)
            context.close()
            browser.close()


if __name__ == "__main__":
    main()
