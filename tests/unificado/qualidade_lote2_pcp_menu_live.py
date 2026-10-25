"""Read-only browser check: linked PCP-only user sees no empty Mapa group."""
from __future__ import annotations

import json
import subprocess
from playwright.sync_api import sync_playwright

BASE = "https://concrefer.concretrack.com.br"
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"


def main():
    raw = subprocess.check_output(["ssh", "vps-staging", "cat",
        "/etc/mapa-unificado/pcp-quality-e2e-probe.env"], text=True, encoding="utf-8")
    account = dict(line.split("=", 1) for line in raw.splitlines() if "=" in line)
    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True, executable_path=CHROME)
        context = browser.new_context(service_workers="block")
        page = context.new_page()
        page.goto(BASE + "/unificado/login.html", wait_until="domcontentloaded")
        page.locator('#unificado-login-form [name="username"]').fill(account["PCP_TEST_USER"])
        page.locator('#unificado-login-form [name="password"]').fill(account["PCP_TEST_PASSWORD"])
        page.locator('#unificado-login-form button[type="submit"]').click()
        page.wait_for_url("**/unificado/index.html", timeout=20000)
        page.wait_for_timeout(1500)
        module_buttons = page.locator(".module-button")
        modules = [text.strip() for text in module_buttons.all_text_contents()]
        joined = " ".join(modules).lower()
        assert "mapa" not in joined and "produção" not in joined, modules
        assert "pcp" in joined or "planejamento" in joined, modules
        assert "qualidade" in joined, modules
        print(json.dumps({"pcp_linked_menu": "PASS", "modules": modules}, ensure_ascii=False))
        context.close()
        browser.close()


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"PCP menu check failed: {type(error).__name__}; inspect step checks")
        raise SystemExit(1) from None
