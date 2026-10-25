"""Capture published shell layout using browser-only, empty GED fixture data."""
from __future__ import annotations

import json
import subprocess
from pathlib import Path
from playwright.sync_api import sync_playwright

BASE = "https://concrefer.concretrack.com.br"
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
OUT = Path("docs/porting/capturas-ged-layout-20261015")
USER = {"id": "browser-fixture", "name": "Ensaio visual", "username": "fixture",
        "email": "fixture@example.invalid", "role": "LEITOR", "company_id": "fixture",
        "company_slug": "concrefer", "permissions": ["documents.read"]}
ROUTES = [("dashboard", "Dashboard", "painel"),
          ("documents", "Documentos", "documentos"),
          ("calibrations", "Certificados de calibração", "calibracoes")]


def capture(mobile: bool, creds: dict[str, str]) -> None:
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
        page.evaluate("user => { localStorage.setItem('ged_token','browser-fixture'); localStorage.setItem('ged_user',JSON.stringify(user)); }", USER)

        def api(route, request):
            path = request.url.split("/api/")[-1].split("?")[0]
            data = USER if path == "auth/me" else (
                {"total": "0", "aprovados": "0", "em_revisao": "0", "obsoletos": "0", "pendentes": "0"}
                if path == "documents/stats" else
                {"total": 0, "current": 0, "due_soon": 0, "expired": 0}
                if path == "calibrations/stats" else [])
            route.fulfill(status=200, content_type="application/json", body=json.dumps(data))

        context.route("**/unificado/ged/api/**", api)
        page.goto(BASE + "/unificado/", wait_until="domcontentloaded")
        device = "celular" if mobile else "desktop"
        for route, heading, slug in ROUTES:
            page.locator(f'#sidebar [data-ged-route="{route}"]').first.click()
            frame = page.frame_locator('#module-host iframe.is-active')
            frame.get_by_role("heading", name=heading, exact=True).first.wait_for(timeout=30000)
            frame.locator("aside").wait_for(state="detached", timeout=30000)
            frame.locator("header").wait_for(state="detached", timeout=30000)
            assert frame.locator("aside").count() == 0
            assert frame.locator("header").count() == 0
            assert page.locator(f'#sidebar [data-ged-route="{route}"].is-active').count() == 1
            assert page.locator("#sidebar").is_visible()
            page.wait_for_timeout(450)
            page.screenshot(path=str(OUT / f"ged-{slug}-{device}.png"), full_page=False)
            print(json.dumps({"route": route, "device": device, "capture": str(OUT / f"ged-{slug}-{device}.png")}))
        page.goto(BASE + "/unificado/ged/users", wait_until="domcontentloaded")
        page.get_by_text("Você não tem acesso a esta tela.").wait_for(timeout=30000)
        assert page.locator("table").count() == 0
        print(json.dumps({"device": device, "other_ged_account_users_page": "denied"}))
        context.close()
        browser.close()


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    raw = subprocess.check_output(["ssh", "vps-staging", "cat", "/etc/mapa-unificado/quality-auth-probe.env"],
                                  text=True, encoding="utf-8")
    creds = dict(line.split("=", 1) for line in raw.splitlines() if "=" in line)
    capture(False, creds)
    capture(True, creds)
