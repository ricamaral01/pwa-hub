"""Read-only Quality gateway navigation with an isolated synthetic account."""
from __future__ import annotations

import json
import subprocess
from urllib.parse import urlsplit

from playwright.sync_api import sync_playwright


BASE = "https://concrefer.concretrack.com.br"
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"


def main() -> None:
    raw = subprocess.check_output(["ssh", "vps-staging", "cat",
                                   "/etc/mapa-unificado/quality-auth-probe.env"],
                                  text=True, encoding="utf-8")
    account = dict(line.split("=", 1) for line in raw.splitlines() if "=" in line)
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True, executable_path=CHROME)
        context = browser.new_context(service_workers="block")
        page = context.new_page()
        statuses = []
        page.on("response", lambda response: statuses.append((urlsplit(response.url).path,
                 response.status)) if "/unificado/qualidade/" in response.url else None)
        page.goto(BASE + "/unificado/login.html", wait_until="domcontentloaded")
        page.locator('#unificado-login-form [name="username"]').fill(account["MAPA_TEST_USER"])
        page.locator('#unificado-login-form [name="password"]').fill(account["MAPA_TEST_PASSWORD"])
        page.locator('#unificado-login-form button[type="submit"]').click()
        page.wait_for_url("**/unificado/index.html", timeout=20000)
        bootstrap = page.evaluate("""async () => {
          const response = await fetch('/unificado/mapa/api/unified/qualidade-bootstrap',
            {method:'POST', credentials:'same-origin', cache:'no-store'});
          return response.status;
        }""")
        assert bootstrap == 200, bootstrap
        page.goto(BASE + "/unificado/qualidade/", wait_until="domcontentloaded")
        try:
            page.get_by_role("heading", name="Não conformidades").wait_for(state="visible", timeout=30000)
        except Exception:
            # Never record a login URL (which may contain a query string) or
            # the body of a login form in diagnostic output.
            print(json.dumps({"quality_path": urlsplit(page.url).path,
                              "quality_responses": statuses[-12:]}))
            raise
        response = page.request.get(BASE + "/unificado/qualidade/api/contexto")
        assert response.status == 200, response.status
        body = response.json()
        assert body["user"]["id"] == account["MAPA_TEST_USER"]
        # B5 grants this retained probe additional actions. Verify the minimum
        # navigation contract without freezing the administrator's grant set.
        assert {"qualidade.nc.abrir", "qualidade.nc.triar"}.issubset(set(body["user"]["actions"]))
        assert any(path == "/unificado/qualidade/" and status == 200 for path, status in statuses)
        assert any(path == "/unificado/qualidade/api/contexto" and status == 200 for path, status in statuses)
        print(json.dumps({"quality_login": 200, "quality_spa": 200,
                          "quality_context": 200, "actions": body["user"]["actions"]}))
        context.close()
        browser.close()


if __name__ == "__main__":
    main()
