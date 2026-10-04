"""Verify PCP shell crosses the desktop breakpoint without changing page state."""
from __future__ import annotations

import json
import subprocess

from playwright.sync_api import sync_playwright

BASE = "https://concrefer.concretrack.com.br"
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"


def main() -> None:
    raw = subprocess.check_output(
        ["ssh", "vps-staging", "cat", "/etc/mapa-unificado/pcp-auth-probe.env"],
        text=True, encoding="utf-8")
    account = dict(line.split("=", 1) for line in raw.splitlines() if "=" in line)
    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True, executable_path=CHROME)
        context = browser.new_context(viewport={"width": 1366, "height": 768},
                                      service_workers="block")
        page = context.new_page()
        page.goto(BASE + "/unificado/login.html?next=pcp/dashboard/")
        page.locator('#unificado-login-form [name="username"]').fill(account["PCP_TEST_USER"])
        page.locator('#unificado-login-form [name="password"]').fill(account["PCP_TEST_PASSWORD"])
        page.locator('#unificado-login-form button[type="submit"]').click()
        page.wait_for_url("**/unificado/pcp/dashboard/", timeout=20000)
        results = []
        for route in ("dashboard", "formas-por-setor"):
            page.goto(BASE + f"/unificado/pcp/{route}/", wait_until="networkidle")
            for width in (1366, 1024, 1366):
                page.set_viewport_size({"width": width, "height": 768})
                page.wait_for_function("width => (document.querySelectorAll('.unificado-pcp-brand').length === (width > 1024 ? 1 : 0))",
                                       arg=width)
                assert page.locator(".unificado-pcp-brand").count() == (1 if width > 1024 else 0)
                if route == "dashboard":
                    assert page.locator("#sidebar>.sidebar-brand:first-child").count() == (0 if width > 1024 else 1)
                else:
                    assert page.locator("body.unificado-pcp-standalone").count() == (1 if width > 1024 else 0)
                results.append({"page": route, "width": width, "shell": width > 1024})
        context.close()
        browser.close()
    print(json.dumps({"breakpoint_transitions": len(results), "status": "equal"}))


if __name__ == "__main__":
    main()
