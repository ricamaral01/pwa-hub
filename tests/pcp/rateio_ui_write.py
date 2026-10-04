"""Verify Rateio MOI form, child rows and cleanup in the PCP test DB."""
from __future__ import annotations

import argparse
import json
import subprocess

from playwright.sync_api import sync_playwright

BASE = "https://concrefer.concretrack.com.br"
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
DATE = "2099-02-04"


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--group", choices=("12", "34"), required=True)
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
        posts = []
        created_id = None
        page.on("request", lambda req: posts.append(req.post_data_json)
                if "/unificado/pcp/api/maodeobra-com-rateio" in req.url
                and req.method == "POST" and req.post_data else None)
        try:
            page.goto(BASE + "/unificado/login.html?next=pcp/maodeobra-rateio/",
                      wait_until="domcontentloaded")
            page.locator('#unificado-login-form [name="username"]').fill(account["PCP_TEST_USER"])
            page.locator('#unificado-login-form [name="password"]').fill(account["PCP_TEST_PASSWORD"])
            page.locator('#unificado-login-form button[type="submit"]').click()
            page.wait_for_url("**/unificado/pcp/maodeobra-rateio/", timeout=20000)
            assert page.evaluate("async () => await API.get('/api/maodeobra?data_inicio="
                                 + DATE + "&data_fim=" + DATE + "')") == []
            page.locator("#rateio-data").fill(DATE)
            page.wait_for_function("() => atividadesPorGrupo['" + args.group + "'].length > 0")
            page.locator("#rateio-grupo").select_option(args.group)
            activity = page.locator('#rateio-atividade option[value]:not([value=""])').first.get_attribute("value")
            page.locator("#rateio-atividade").select_option(activity)
            page.locator("#total-pessoas").fill("3")
            inputs = page.locator("#tbody-rateio .rateio-input")
            assert inputs.count() == 2
            sectors = [int(inputs.nth(i).get_attribute("data-setor")) for i in range(2)]
            inputs.nth(0).fill("2")
            inputs.nth(0).dispatch_event("change")
            inputs.nth(1).fill("1")
            inputs.nth(1).dispatch_event("change")
            assert not page.locator("#btn-salvar-rateio").is_disabled()
            page.locator("#btn-salvar-rateio").click()
            page.wait_for_function("() => document.querySelector('#toast-container')?.textContent.includes('Rateio de MOI registrado')",
                                   timeout=15000)
            expected = {"data": DATE, "atividade_id": int(activity),
                        "quantidade_pessoas": 3, "rateio": [
                            {"setor_id": sectors[0], "quantidade_rateada": 2},
                            {"setor_id": sectors[1], "quantidade_rateada": 1}]}
            assert posts == [expected], posts
            rows = page.evaluate("async () => await API.get('/api/maodeobra?data_inicio="
                                 + DATE + "&data_fim=" + DATE + "')")
            assert len(rows) == 1 and rows[0]["quantidade_pessoas"] == 3, rows
            created_id = rows[0]["id"]
            detail = page.evaluate("async id => await API.get('/api/maodeobra-com-rateio/'+id)",
                                   created_id)
            assert sorted((r["setor_id"], r["quantidade_rateada"])
                          for r in detail["rateios"]) == sorted(
                              (r["setor_id"], r["quantidade_rateada"])
                              for r in expected["rateio"]), detail
            assert page.locator("#total-pessoas").input_value() == "0"
        finally:
            context.close()
            browser.close()
            if created_id is not None:
                subprocess.run(["ssh", "vps-staging",
                                "/opt/concrefer-unificado/mapa-api/.venv/bin/python",
                                "/opt/concrefer-unificado/migration/cleanup_pcp_rateio_probe.py"],
                               check=True)
    print(json.dumps({"role": args.role, "group": args.group,
                      "rateio_ui": "equal", "request_fields": sorted(expected),
                      "child_rows": 2, "cleanup_residue": 0}))


if __name__ == "__main__":
    main()
