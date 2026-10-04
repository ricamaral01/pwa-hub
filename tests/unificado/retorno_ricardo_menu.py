"""Capture shared desktop menu and measure the Planning switch on the test site."""
from __future__ import annotations

import json
import subprocess
import time
from pathlib import Path

from playwright.sync_api import sync_playwright


BASE = "https://concrefer.concretrack.com.br"
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
OUT = Path("docs/capturas-retorno-ricardo")


def account(path: str) -> dict[str, str]:
    raw = subprocess.check_output(["ssh", "vps-staging", "cat", path], text=True)
    return dict(line.split("=", 1) for line in raw.splitlines() if "=" in line)


def login(page, path: str, username: str, password: str, next_path: str) -> None:
    credentials = account(path)
    page.goto(BASE + "/unificado/login.html?next=" + next_path)
    page.locator('#unificado-login-form [name="username"]').fill(credentials[username])
    page.locator('#unificado-login-form [name="password"]').fill(credentials[password])
    page.locator('#unificado-login-form button[type="submit"]').click()
    page.wait_for_url("**/unificado/" + next_path, timeout=25000)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    results = []
    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True, executable_path=CHROME)
        for width, height in ((1366, 768), (1920, 1080)):
            context = browser.new_context(viewport={"width": width, "height": height}, service_workers="block")
            page = context.new_page()
            if width == 1366:
                page.goto(BASE + "/unificado/login.html")
                page.wait_for_function("Array.from(document.querySelectorAll('.login-brand img')).every(img => img.complete && img.naturalWidth > 0)")
                page.screenshot(path=str(OUT / "login-1366x768.png"))
            login(page, "/etc/mapa-unificado/auth-probe.env", "MAPA_TEST_USER", "MAPA_TEST_PASSWORD", "mapa/operacao/")
            page.goto(BASE + "/unificado/testar/")
            assert "Dashboard Defeitos conta cada defeito" in page.locator("main").inner_text()
            expected_version = Path("unificado/VERSION").read_text(encoding="utf-8").strip()
            assert page.locator("#unificado-version").inner_text().strip() == "Versao " + expected_version
            assert page.locator('img[src*="qr-testar"]').evaluate("img => img.complete && img.naturalWidth > 0")
            for module, url, selector in (
                ("producao", "/unificado/mapa/operacao/", ".unificado-sidebar"),
                ("planejamento", "/unificado/pcp/dashboard/", ".unificado-pcp-brand"),
            ):
                page.goto(BASE + url, wait_until="domcontentloaded")
                page.locator(selector).wait_for(timeout=20000)
                page.wait_for_timeout(500)
                toggle = page.locator(".unificado-collapse" if module == "producao" else ".unificado-pcp-collapse")
                page.evaluate("localStorage.setItem('unificado_menu_collapsed','0')")
                page.reload(wait_until="domcontentloaded")
                page.locator(selector).wait_for(timeout=20000)
                page.wait_for_function("Array.from(document.querySelectorAll('.unificado-brand-logos img,.unificado-pcp-brand-logos img')).every(img => img.complete && img.naturalWidth > 0)")
                page.screenshot(path=str(OUT / f"{module}-{width}x{height}-expandido.png"))
                side = page.locator(".unificado-sidebar" if module == "producao" else "#sidebar")
                assert round(side.bounding_box()["width"]) == 228
                toggle.click()
                page.wait_for_timeout(300)
                page.screenshot(path=str(OUT / f"{module}-{width}x{height}-recolhido.png"))
                assert round(side.bounding_box()["width"]) == 64
                collapsed = page.evaluate("document.body.classList.contains('unificado-menu-collapsed')")
                assert collapsed, module
                if module == "planejamento":
                    group = page.locator("#sidebar .nav-group:has(.nav-group-toggle)").first
                    group.locator(".nav-group-toggle").click()
                    assert group.locator(".nav-link:visible").count() > 0, group.evaluate("e => ({html:e.outerHTML.slice(0,1000),className:e.className})")
                    page.screenshot(path=str(OUT / f"{module}-{width}x{height}-grupo.png"))
                results.append({"module": module, "viewport": f"{width}x{height}", "collapsed": collapsed})
            page.goto(BASE + "/unificado/mapa/operacao/", wait_until="domcontentloaded")
            page.locator(".unificado-sidebar").wait_for()
            start = time.perf_counter()
            page.evaluate("location.assign('/unificado/pcp/')")
            page.wait_for_url("**/unificado/pcp/dashboard/", timeout=20000)
            page.locator(".unificado-pcp-brand").wait_for(timeout=20000)
            redirect_ms = round((time.perf_counter() - start) * 1000)
            page.goto(BASE + "/unificado/mapa/operacao/", wait_until="domcontentloaded")
            page.locator(".unificado-sidebar").wait_for()
            start = time.perf_counter()
            page.locator(".unificado-switch-btn", has_text="Planejamento").click()
            page.wait_for_url("**/unificado/pcp/dashboard/", timeout=20000)
            page.locator(".unificado-pcp-brand").wait_for(timeout=20000)
            new_ms = round((time.perf_counter() - start) * 1000)
            assert page.locator("body.unificado-menu-collapsed").count() == 1
            page.locator(".unificado-pcp-switch-button", has_text="Produção").click()
            page.wait_for_url("**/unificado/mapa/operacao/", timeout=20000)
            page.locator(".unificado-sidebar").wait_for(timeout=20000)
            assert page.locator("body.unificado-menu-collapsed").count() == 1
            results.append({"viewport": f"{width}x{height}", "root_redirect_ms": redirect_ms,
                            "direct_route_ms": new_ms, "both_directions_direct": True,
                            "collapsed_preference_shared": True})
            context.close()
        browser.close()
    (OUT / "medidas.json").write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(results, ensure_ascii=False))


if __name__ == "__main__":
    main()
