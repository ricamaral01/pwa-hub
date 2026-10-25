"""Read-only Laboratory navigation smoke with an isolated synthetic account."""
from __future__ import annotations

import os
import subprocess
from urllib.parse import urlsplit

from playwright.sync_api import sync_playwright


BASE = os.environ.get("UNIFICADO_BASE_URL", "https://concrefer.concretrack.com.br").rstrip("/")
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"


def main() -> None:
    raw = subprocess.check_output(["ssh", "vps-staging", "cat",
                                   "/etc/mapa-unificado/lab-auth-probe.env"],
                                  text=True, encoding="utf-8")
    account = dict(line.split("=", 1) for line in raw.splitlines() if "=" in line)
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True, executable_path=CHROME)
        context = browser.new_context(service_workers="block")
        page = context.new_page()
        statuses = []
        page.on("response", lambda response: statuses.append((urlsplit(response.url).path,
                 response.status)) if "/unificado/laboratorio/" in response.url else None)
        page.goto(BASE + "/unificado/login.html?next=laboratorio/", wait_until="domcontentloaded")
        page.locator('#unificado-login-form [name="username"]').fill(account["MAPA_TEST_USER"])
        page.locator('#unificado-login-form [name="password"]').fill(account["MAPA_TEST_PASSWORD"])
        page.locator('#unificado-login-form button[type="submit"]').click()
        page.wait_for_url("**/unificado/laboratorio/", timeout=20000)
        page.locator("body").wait_for(state="visible", timeout=20000)
        page.locator("text=Monitoramento").first.wait_for(state="visible", timeout=20000)
        assert any(path == "/unificado/laboratorio/" and status == 200
                   for path, status in statuses), statuses
        assert "Você não tem acesso" not in page.locator("body").inner_text()
        print("laboratorio_login=200 navigation=200 monitoramento=visible")
        context.close()
        browser.close()


if __name__ == "__main__":
    main()
