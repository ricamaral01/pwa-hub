"""Exercise four labour entry modes through the published PCP interface."""
from __future__ import annotations

import json
import argparse
import subprocess

from playwright.sync_api import sync_playwright

BASE = "https://concrefer.concretrack.com.br"
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
DATE = "2099-02-03"
MODES = ("moi-12", "moi-34", "mod-12", "mod-34")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--mode", choices=MODES, required=True)
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
        page.on("request", lambda req: writes.append({
            "method": req.method, "path": req.url.split("/unificado/pcp/api", 1)[-1].split("?", 1)[0],
            "body": req.post_data_json if req.method == "POST" and req.post_data else None})
            if "/unificado/pcp/api/maodeobra" in req.url and req.method in {"POST", "DELETE"}
            else None)
        try:
            page.goto(BASE + "/unificado/login.html?next=pcp/maodeobra/",
                      wait_until="domcontentloaded")
            page.locator('#unificado-login-form [name="username"]').fill(account["PCP_TEST_USER"])
            page.locator('#unificado-login-form [name="password"]').fill(account["PCP_TEST_PASSWORD"])
            page.locator('#unificado-login-form button[type="submit"]').click()
            page.wait_for_url("**/unificado/pcp/maodeobra/", timeout=20000)
            page.locator("#f-inicio").fill(DATE)
            page.locator("#f-fim").fill(DATE)
            page.locator("#btn-buscar").click()
            initial = page.evaluate("async () => await API.get('/api/maodeobra?data_inicio="
                                    + DATE + "&data_fim=" + DATE + "')")
            assert initial == [], initial
            page.locator("#mdo-data").fill(DATE)
            results = []
            page.on("dialog", lambda dialog: dialog.accept())
            for mode in (args.mode,):
                page.locator("#mdo-modo").select_option(mode)
                editable = page.locator('#tbody-mdo-grid .mdo-qtd[data-atividade-id]:not([disabled])')
                editable.first.wait_for(state="visible", timeout=15000)
                activity = int(editable.first.get_attribute("data-atividade-id"))
                sector_attr = editable.first.get_attribute("data-setor-id")
                editable.first.fill("1")
                page.locator("#btn-salvar-lote").click()
                page.wait_for_function("() => document.querySelector('#toast-container')?.textContent.includes('Mão de obra registrada')",
                                       timeout=15000)
                page.wait_for_function("""async ({date,activity}) => {
                  const rows=await API.get('/api/maodeobra?data_inicio='+date+'&data_fim='+date);
                  return rows.some(row=>row.atividade_id===activity);
                }""", arg={"date": DATE, "activity": activity}, timeout=15000)
                rows = page.evaluate("async () => await API.get('/api/maodeobra?data_inicio="
                                     + DATE + "&data_fim=" + DATE + "')")
                matching = [row for row in rows if row["atividade_id"] == activity]
                assert len(matching) == 1 and matching[0]["quantidade_pessoas"] == 1, {
                    "mode": mode, "activity": activity, "rows": rows}
                row = matching[0]
                if sector_attr:
                    assert row["setor_id"] == int(sector_attr)
                post = [item for item in writes if item["method"] == "POST"][-1]
                assert post["path"] == "/maodeobra/lote"
                assert post["body"] == {"data": DATE, "itens": [{
                    "atividade_id": activity,
                    "setor_id": int(sector_attr) if sector_attr else None,
                    "quantidade_pessoas": 1}]}
                assert row["atividade"]["tipo"] == ("MOI" if mode.startswith("moi") else "MOD")
                page.wait_for_function(
                    "description => document.querySelector('#tbody-mdo')?.textContent.includes(description)",
                    arg=row["atividade"]["descricao"], timeout=15000)
                table_text = page.locator("#tbody-mdo").inner_text()
                assert row["atividade"]["descricao"] in table_text, {
                    "mode": mode, "activity": row["atividade"]["descricao"],
                    "table": table_text[:400]}
                page.locator(f'#tbody-mdo button[onclick="deleteMdo({row["id"]})"]').click()
                page.wait_for_function("() => document.querySelector('#toast-container')?.textContent.includes('Excluído')")
                remaining = page.evaluate("async () => await API.get('/api/maodeobra?data_inicio="
                                          + DATE + "&data_fim=" + DATE + "')")
                assert remaining == []
                results.append({"mode": mode, "activity_id": activity,
                                "sector_id": row["setor_id"], "cleaned": True})
            assert len([item for item in writes if item["method"] == "POST"]) == 1
            assert len([item for item in writes if item["method"] == "DELETE"]) == 1
            print(json.dumps({"pcp_maodeobra_ui": "equal", "results": results,
                              "test_db_cleaned": True}))
        finally:
            if page.url.startswith(BASE + "/unificado/pcp/maodeobra/"):
                rows = page.evaluate("async () => await API.get('/api/maodeobra?data_inicio="
                                     + DATE + "&data_fim=" + DATE + "')")
                for row in rows:
                    page.evaluate("async id => await API.delete('/api/maodeobra/'+id)", row["id"])
            context.close()
            browser.close()


if __name__ == "__main__":
    main()
