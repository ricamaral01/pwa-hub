"""Open all 24 published PCP pages with an isolated ADMIN account."""

from __future__ import annotations

import json
from pathlib import Path
import subprocess
import argparse
from urllib.parse import urlsplit

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / ".work-mapa-unificado" / "pcp-e2e"
BASE = "https://concrefer.concretrack.com.br"
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
PAGES = (
    "acompanhamento-mensal", "acompanhamento-mensal-setor-34", "apontamento-mega",
    "comparacao", "dashboard", "etiquetas", "etiquetas-armaduras", "etiquetas-sc",
    "formas-por-setor", "maodeobra", "maodeobra-rateio", "pcp-diario", "primeiro-acesso",
    "producao", "programacao", "programacao-alex", "programacao-circular-s3",
    "programacao-circular-s4", "programacao-final", "relatorio-producao",
    "relatorio-programacao-s3", "relatorio-programacao-s4", "teste-programacao", "usuarios",
)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--role", default="ADMIN")
    args = parser.parse_args()
    raw = subprocess.check_output(
        ["ssh", "vps-staging", "cat", "/etc/mapa-unificado/pcp-auth-probe.env"],
        text=True, encoding="utf-8")
    account = dict(line.split("=", 1) for line in raw.splitlines() if "=" in line)
    OUT.mkdir(parents=True, exist_ok=True)
    results = []
    external = []
    wrong_api = []
    writes = []
    api_responses = []
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True, executable_path=CHROME)
        context = browser.new_context(viewport={"width": 1366, "height": 768},
                                      service_workers="block")
        def restrict(route):
            request = route.request
            url = urlsplit(request.url)
            if url.hostname != "concrefer.concretrack.com.br" and url.scheme in {"http", "https"}:
                external.append({"host": url.hostname, "path": url.path})
                route.abort()
            elif url.path.startswith("/api/"):
                wrong_api.append(url.path)
                route.abort()
            elif request.method not in {"GET", "HEAD"} and \
                    url.path != "/unificado/mapa/api/unified/login":
                writes.append({"method": request.method, "path": url.path})
                route.abort()
            else:
                route.continue_()
        context.route("**/*", restrict)
        page = context.new_page()
        page.on("response", lambda response: api_responses.append({"path": urlsplit(response.url).path,
                "status": response.status}) if "/unificado/pcp/api/" in response.url else None)
        current_errors = []
        page.on("pageerror", lambda error: current_errors.append(str(error)))
        page.goto(BASE + "/unificado/login.html?next=pcp/dashboard/", wait_until="domcontentloaded")
        page.locator('#unificado-login-form [name="username"]').fill(account["PCP_TEST_USER"])
        page.locator('#unificado-login-form [name="password"]').fill(account["PCP_TEST_PASSWORD"])
        page.locator('#unificado-login-form button[type="submit"]').click()
        page.wait_for_url("**/unificado/pcp/dashboard/", timeout=20000)
        for name in PAGES:
            current_errors.clear()
            response = page.goto(BASE + "/unificado/pcp/" + name + "/",
                                 wait_until="domcontentloaded", timeout=30000)
            page.wait_for_timeout(900)
            result = {"page": name, "http": response.status if response else None,
                      "location": urlsplit(page.url).path,
                      "shell": page.locator(".unificado-pcp-brand").count() > 0,
                      "errors": current_errors[:3]}
            results.append(result)
            if name == "dashboard":
                page.screenshot(path=str(OUT / "dashboard-1366x768.png"), full_page=True)
        context.close()
        browser.close()
    report = {"results": results, "external": external, "wrong_api": wrong_api,
              "api_responses": api_responses,
              "unexpected_writes": writes}
    (OUT / f"pages-{args.role.lower()}.json").write_text(json.dumps(report, ensure_ascii=False, indent=2),
                                           encoding="utf-8")
    summary = {"role": args.role, "pages": len(results),
               "http_200": sum(item["http"] == 200 for item in results),
               "shell": sum(item["shell"] for item in results),
               "redirected": [item["page"] for item in results
                              if item["location"] != "/unificado/pcp/" + item["page"] + "/"],
               "page_errors": sum(len(item["errors"]) for item in results),
               "external": len(external), "wrong_api": len(wrong_api),
               "unexpected_writes": len(writes),
               "api_2xx": sum(200 <= item["status"] < 300 for item in api_responses),
               "api_4xx": [item for item in api_responses if item["status"] >= 400][:10]}
    print(json.dumps(summary, ensure_ascii=False))


if __name__ == "__main__":
    main()
