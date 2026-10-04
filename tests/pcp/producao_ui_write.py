"""Verify the PCP manual Production form writes only to its isolated table."""
from __future__ import annotations

import argparse
import json
import subprocess

from playwright.sync_api import sync_playwright

BASE = "https://concrefer.concretrack.com.br"
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
DATE = "2099-02-03"


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--role", choices=("ADMIN", "PRODUCAO"), default="ADMIN")
    args = parser.parse_args()
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
            if "/unificado/pcp/api/producao" in req.url and req.method in {"POST", "DELETE"}:
                writes.append({"method": req.method,
                               "path": req.url.split("/unificado/pcp/api", 1)[-1].split("?", 1)[0],
                               "body": req.post_data_json if req.method == "POST" and req.post_data else None})
        page.on("request", capture)
        try:
            page.goto(BASE + "/unificado/login.html?next=pcp/producao/",
                      wait_until="domcontentloaded")
            page.locator('#unificado-login-form [name="username"]').fill(account["PCP_TEST_USER"])
            page.locator('#unificado-login-form [name="password"]').fill(account["PCP_TEST_PASSWORD"])
            page.locator('#unificado-login-form button[type="submit"]').click()
            page.wait_for_url("**/unificado/pcp/producao/", timeout=20000)
            page.locator('#prod-setor option[value="1"]').wait_for(state="attached")
            page.locator("#f-inicio").fill(DATE)
            page.locator("#f-fim").fill(DATE)
            page.locator("#f-setor").select_option("1")
            page.locator("#btn-buscar").click()
            assert page.evaluate("async () => await API.get('/api/producao?data_inicio="
                                 + DATE + "&data_fim=" + DATE + "&setor_id=1')") == []
            page.locator("#prod-data").fill(DATE)
            page.locator("#prod-setor").select_option("1")
            page.locator('#prod-produto option[value]:not([value=""])').first.wait_for(state="attached")
            product = page.locator('#prod-produto option[value]:not([value=""])').first.get_attribute("value")
            page.locator("#prod-produto").select_option(product)
            page.locator("#prod-qtd").fill("1")
            volume = float(page.locator("#prod-vol").input_value())
            page.locator("#form-prod button[type=submit]").click()
            page.wait_for_function("() => document.querySelector('#toast-container')?.textContent.includes('Producao registrada')",
                                   timeout=15000)
            rows = page.evaluate("async () => await API.get('/api/producao?data_inicio="
                                 + DATE + "&data_fim=" + DATE + "&setor_id=1')")
            assert len(rows) == 1, rows
            row = rows[0]
            created_id = row["id"]
            expected = {"data": DATE, "setor_id": 1, "produto_id": int(product),
                        "quantidade_realizada": 1, "volume_m3_realizado": volume}
            assert writes and writes[0]["method"] == "POST" and writes[0]["body"] == expected
            assert all(row.get(key) == value for key, value in expected.items()
                       if key != "volume_m3_realizado"), row
            assert float(row["volume_m3_realizado"]) == volume
            page.wait_for_function("() => document.querySelector('#tbody-prod')?.textContent.includes('03/02/2099')")
            assert row["produto"]["nome"] in page.locator("#tbody-prod").inner_text()
            daily = page.evaluate("async () => await API.get('/api/producao/supabase?data_inicio="
                                  + DATE + "&data_fim=" + DATE + "')")
            assert daily == [], daily
            page.on("dialog", lambda dialog: dialog.accept())
            page.locator("#tbody-prod button").first.click()
            page.wait_for_function("() => document.querySelector('#toast-container')?.textContent.includes('Excluido')")
            remaining = page.evaluate("async () => await API.get('/api/producao?data_inicio="
                                      + DATE + "&data_fim=" + DATE + "&setor_id=1')")
            assert remaining == []
            assert [item["method"] for item in writes] == ["POST", "DELETE"]
            created_id = None
            print(json.dumps({"role": args.role, "pcp_producao_ui": "equal",
                              "request_fields": sorted(expected),
                              "producao_diaria_empty": True, "cleanup_residue": 0}))
        finally:
            if created_id is not None:
                page.evaluate("async id => await API.delete('/api/producao/'+id)", created_id)
            context.close()
            browser.close()


if __name__ == "__main__":
    main()
