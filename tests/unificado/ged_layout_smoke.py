"""Read-only GED shell route smoke. Uses a synthetic GED session only in the browser."""
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path
from urllib.parse import urlsplit, parse_qs

from playwright.sync_api import sync_playwright

BASE = "https://concrefer.concretrack.com.br"
ROOT = Path(__file__).resolve().parents[2]
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
ROUTES = ["dashboard", "documents", "approvals", "tasks", "calibrations"]


def main() -> None:
    published = "--published" in sys.argv
    mobile = "--mobile" in sys.argv
    raw = subprocess.check_output(
        ["ssh", "vps-staging", "cat", "/etc/mapa-unificado/quality-auth-probe.env"],
        text=True, encoding="utf-8")
    creds = dict(line.split("=", 1) for line in raw.splitlines() if "=" in line)
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True, executable_path=CHROME)
        context = browser.new_context(
            service_workers="block", viewport={"width": 390, "height": 844} if mobile else {"width": 1440, "height": 900},
            is_mobile=mobile, has_touch=mobile)
        page = context.new_page()
        page.goto(BASE + "/unificado/login.html", wait_until="domcontentloaded")
        page.locator('#unificado-login-form [name="username"]').fill(creds["MAPA_TEST_USER"])
        page.locator('#unificado-login-form [name="password"]').fill(creds["MAPA_TEST_PASSWORD"])
        page.locator('#unificado-login-form button[type="submit"]').click()
        page.wait_for_url("**/unificado/index.html", timeout=30000)
        if not published:
            for name, typ in (("shell.js", "text/javascript"), ("router.js", "text/javascript"),
                              ("shared-menu.css", "text/css")):
                source = (ROOT / "unificado/shell" / name).read_text(encoding="utf-8")
                page.route("**/unificado/shell/" + name + "*",
                           lambda route, request, source=source, typ=typ: route.fulfill(status=200, content_type=typ, body=source))
        page.goto(BASE + "/unificado/", wait_until="domcontentloaded")
        page.locator('#sidebar [data-ged-route="dashboard"]').wait_for(state="visible", timeout=30000)
        assert page.locator('.ged-preview-group [data-ged-route]').count() == 5
        for route in ROUTES:
            link = page.locator(f'#sidebar [data-ged-route="{route}"]').first
            link.click()
            frame = page.locator('#module-host iframe.is-active')
            frame.wait_for(state="visible", timeout=30000)
            frame_url = frame.get_attribute("src") or ""
            assert urlsplit(frame_url).path == "/unificado/ged/" + route, (route, frame_url)
            assert parse_qs(urlsplit(frame_url).query).get("embed") == ["1"]
            page.wait_for_timeout(350)
            assert link.evaluate("node => node.classList.contains('is-active')"), route
            assert page.locator('#sidebar [data-ged-route].is-active').count() == 1
            assert not page.locator('#sidebar .module-button.is-active').count()
            assert not page.locator('#sidebar .nav-home.is-active').count()
            assert page.locator('.breadcrumb strong').inner_text() == "GED"
            assert page.evaluate("new URLSearchParams(location.search).get('view')") == "ged/" + route
        print(json.dumps({"mode": "published" if published else "candidate",
                          "device": "mobile" if mobile else "desktop", "routes": ROUTES,
                          "shell_retained": page.locator('#sidebar').is_visible(), "highlight": "GED"}))
        context.close()
        browser.close()


if __name__ == "__main__":
    main()
