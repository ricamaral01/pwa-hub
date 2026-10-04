"""Check denied PCP writes with a synthetic account on the published test route."""

from __future__ import annotations

import argparse
import json
import subprocess
from playwright.sync_api import sync_playwright

BASE = "https://concrefer.concretrack.com.br"
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--role", required=True, choices=("PRODUCAO", "CONSULTA"))
    args = parser.parse_args()
    raw = subprocess.check_output(["ssh", "vps-staging", "cat",
                                   "/etc/mapa-unificado/pcp-auth-probe.env"], text=True)
    account = dict(line.split("=", 1) for line in raw.splitlines() if "=" in line)
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True, executable_path=CHROME)
        context = browser.new_context(service_workers="block")
        page = context.new_page()
        page.goto(BASE + "/unificado/login.html?next=pcp/dashboard/")
        page.locator('#unificado-login-form [name="username"]').fill(account["PCP_TEST_USER"])
        page.locator('#unificado-login-form [name="password"]').fill(account["PCP_TEST_PASSWORD"])
        page.locator('#unificado-login-form button[type="submit"]').click()
        page.wait_for_url("**/unificado/pcp/dashboard/", timeout=20000)
        cases = [("programacao", {
            "data": "2099-02-01", "setor_id": 3, "produto_id": 1,
            "quantidade_programada": 1, "volume_m3_programado": 1,
        })]
        if args.role == "CONSULTA":
            cases.append(("producao", {
                "data": "2099-02-01", "setor_id": 3, "produto_id": 1,
                "quantidade_realizada": 1, "volume_m3_realizado": 1,
            }))
        result = []
        for endpoint, body in cases:
            status = page.evaluate("""async ({endpoint, body}) => {
              const token = localStorage.getItem('pcp_token');
              const response = await fetch('/unificado/pcp/api/' + endpoint, {
                method:'POST',headers:{'Authorization':'Bearer '+token,
                'Content-Type':'application/json'},body:JSON.stringify(body)});
              return response.status;
            }""", {"endpoint": endpoint, "body": body})
            result.append({"endpoint": endpoint, "status": status})
            assert status == 403, result
        context.close()
        browser.close()
    print(json.dumps({"role": args.role, "denials": result, "writes": 0}))


if __name__ == "__main__":
    main()
