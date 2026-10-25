"""Create and retain one synthetic Quality NC through the HTTPS gateway."""
from __future__ import annotations

import json
import subprocess

from playwright.sync_api import sync_playwright


BASE = "https://concrefer.concretrack.com.br"
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
API = BASE + "/unificado/qualidade/api"


def main() -> None:
    raw = subprocess.check_output(["ssh", "vps-staging", "cat",
                                   "/etc/mapa-unificado/quality-auth-probe.env"],
                                  text=True, encoding="utf-8")
    account = dict(line.split("=", 1) for line in raw.splitlines() if "=" in line)
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True, executable_path=CHROME)
        context = browser.new_context(service_workers="block")
        page = context.new_page()
        page.goto(BASE + "/unificado/login.html", wait_until="domcontentloaded")
        page.locator('#unificado-login-form [name="username"]').fill(account["MAPA_TEST_USER"])
        page.locator('#unificado-login-form [name="password"]').fill(account["MAPA_TEST_PASSWORD"])
        page.locator('#unificado-login-form button[type="submit"]').click()
        page.wait_for_url("**/unificado/index.html", timeout=20000)
        bootstrap = page.evaluate("""async () => (await fetch(
          '/unificado/mapa/api/unified/qualidade-bootstrap',
          {method:'POST', credentials:'same-origin', cache:'no-store'})).status""")
        assert bootstrap == 200, bootstrap
        company = page.request.get(API + "/contexto").json()["companies"][0]["id"]
        unit = "pederneiras"
        catalogs_response = page.request.get(API + f"/catalogos?company={company}&unit={unit}")
        assert catalogs_response.status == 200, catalogs_response.text()
        areas = catalogs_response.json()["area"]
        area = next(x for x in areas if x["codigo"] == "SGQ")
        draft_response = page.request.post(API + "/nc/rascunhos", data={
            "empresa_id": company, "unidade_codigo": unit,
            "descricao": "NC sintética de validação do lote 1, manter como evidência.",
            "area_emissora_id": area["id"],
        })
        assert draft_response.status == 201, draft_response.text()
        draft = draft_response.json()
        assert draft["status"] == "RASCUNHO" and draft["numero"] is None
        register_response = page.request.post(API + f"/nc/{draft['id']}/registrar",
                                               data={"mobile": True})
        assert register_response.status == 200, register_response.text()
        registered = register_response.json()
        assert registered["status"] == "REGISTRADA"
        assert registered["numero"].startswith("NC-2026-")
        detail_response = page.request.get(API + f"/nc/{draft['id']}")
        assert detail_response.status == 200, detail_response.text()
        detail = detail_response.json()
        events = [e["tipo"] for e in detail["nc_evento"]]
        assert "RASCUNHO" in events and "REGISTRO" in events, events
        print(json.dumps({"quality_nc": "ok", "id": draft["id"],
                          "numero": registered["numero"], "events": events,
                          "retained": True}))
        context.close()
        browser.close()


if __name__ == "__main__":
    main()
