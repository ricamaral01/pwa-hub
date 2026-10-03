"""Exercise the published isolated operation without writing to official hosts."""

from __future__ import annotations

import json
from pathlib import Path
import subprocess
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

from playwright.sync_api import sync_playwright


URL = "https://concrefer.concretrack.com.br/unificado/mapa/operacao/"
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
OUT = Path(__file__).resolve().parents[3] / ".work-mapa-unificado" / "e2e"


def credentials() -> dict[str, str]:
    raw = subprocess.check_output(
        ["ssh", "vps-staging", "cat", "/etc/mapa-unificado/auth-probe.env"],
        text=True,
    )
    return dict(line.split("=", 1) for line in raw.splitlines() if "=" in line)


def login_operacao(page, user: str, password: str, role: str = "GERENCIA") -> None:
    page.goto(URL, wait_until="domcontentloaded", timeout=30000)
    page.wait_for_url("**/unificado/login.html?next=*", timeout=15000)
    page.locator('#unificado-login-form [name="username"]').fill(user)
    page.locator('#unificado-login-form [name="password"]').fill(password)
    page.locator('#unificado-login-form button[type="submit"]').click()
    page.wait_for_url(URL, timeout=15000)
    page.wait_for_function("state.authUser?.role === " + json.dumps(role), timeout=15000)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    account = credentials()
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True, executable_path=CHROME)
        context = browser.new_context(viewport={"width": 1024, "height": 768},
                                      service_workers="block")
        page = context.new_page()
        errors = []
        requests = []
        responses = []
        page.on("pageerror", lambda error: errors.append(str(error)))
        def safe_url(value: str) -> str:
            parts = urlsplit(value)
            query = urlencode([(key, "eq.[redacted]" if key == "senha" else val)
                               for key, val in parse_qsl(parts.query, keep_blank_values=True)])
            return urlunsplit((parts.scheme, parts.netloc, parts.path, query, parts.fragment))

        page.on("request", lambda request: requests.append({"method": request.method, "url": safe_url(request.url)}))
        page.on("response", lambda response: responses.append({"status": response.status,
                                                               "url": safe_url(response.url)}))
        login_operacao(page, account["MAPA_TEST_USER"], account["MAPA_TEST_PASSWORD"])
        page.locator("#ambiente-teste").wait_for(timeout=15000)
        page.wait_for_timeout(3500)
        result = {
            "banner": page.locator("#ambiente-teste").inner_text(),
            "login_visible": page.locator("#loginScreen").is_visible(),
            "hub_visible": page.locator("#viewHub").is_visible(),
            "feedback": page.locator("#loginFeedback").inner_text(),
            "page_errors": errors,
            "external_data_requests": [item for item in requests if any(
                host in item["url"] for host in
                ("supabase.co", "pcp.concretrack.com.br/api", "dautomacao.com/api"))],
            "requests": requests,
            "api_failures": [item for item in responses if item["status"] >= 400
                             and "/api/" in item["url"]],
        }
        page.screenshot(path=str(OUT / "smoke-1024x768.png"), full_page=True)
        (OUT / "smoke.json").write_text(json.dumps(result, indent=2, ensure_ascii=False), encoding="utf-8")
        print(json.dumps({key: value for key, value in result.items() if key != "requests"}, ensure_ascii=False))
        context.close()
        browser.close()


if __name__ == "__main__":
    main()
