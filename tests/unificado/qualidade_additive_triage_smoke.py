"""Triage the retained synthetic NC and verify event through the HTTPS API."""
from __future__ import annotations

from datetime import date, timedelta
import json
import subprocess

from playwright.sync_api import sync_playwright


BASE = "https://concrefer.concretrack.com.br"
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
API = BASE + "/unificado/qualidade/api"
NC_ID = "4f0f0e4d-76ff-4262-9bfe-d4d089cfd47b"


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
        catalogs = page.request.get(API + f"/catalogos?company={company}&unit=pederneiras").json()
        severity = next(x for x in catalogs["gravidade"] if x["codigo"] == "MENOR")
        area = next(x for x in catalogs["area"] if x["codigo"] == "SGQ")
        response = page.request.post(API + f"/nc/{NC_ID}/triagem", data={
            "origem_id": catalogs["origem"][0]["id"],
            "tipo_id": catalogs["tipo"][0]["id"],
            "gravidade_id": severity["id"],
            "area_responsavel_id": area["id"],
            "responsavel_id": account["MAPA_TEST_USER"],
            "prazo_final": (date.today() + timedelta(days=1)).isoformat(),
        })
        assert response.status == 200, response.text()
        assert response.json()["status"] == "CONTENCAO"
        detail = page.request.get(API + f"/nc/{NC_ID}").json()
        events = [e["tipo"] for e in detail["nc_evento"]]
        assert "TRIAR" in events and detail["nc"]["responsavel_id"] == account["MAPA_TEST_USER"]
        print(json.dumps({"quality_triage": "ok", "nc_id": NC_ID,
                          "status": detail["nc"]["status"], "events": events,
                          "retained": True}))
        context.close()
        browser.close()


if __name__ == "__main__":
    main()
