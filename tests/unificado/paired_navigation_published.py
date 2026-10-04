"""Published navigation audit with a temporary ADMIN/GERENCIA paired account."""

from __future__ import annotations

import json
from pathlib import Path
import subprocess
from urllib.parse import urljoin, urlsplit

from playwright.sync_api import sync_playwright


BASE = "https://concrefer.concretrack.com.br"
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
OUT = Path("docs/capturas-ricardo-20261004")


def credentials() -> dict[str, str]:
    raw = subprocess.check_output(
        ["ssh", "vps-staging", "cat", "/etc/mapa-unificado/auth-probe.env"],
        text=True, encoding="utf-8")
    return dict(line.split("=", 1) for line in raw.splitlines() if "=" in line)


def login(page, account: dict[str, str]) -> None:
    page.goto(BASE + "/unificado/login.html", wait_until="domcontentloaded")
    page.locator('#unificado-login-form [name="username"]').fill(account["MAPA_TEST_USER"])
    page.locator('#unificado-login-form [name="password"]').fill(account["MAPA_TEST_PASSWORD"])
    page.locator('#unificado-login-form button[type="submit"]').click()
    page.wait_for_url("**/unificado/index.html", timeout=20000)
    assert page.evaluate("!!localStorage.getItem('pcp_token')")


def checked(page, area: str, label: str, action, results: list) -> None:
    try:
        action()
        page.wait_for_timeout(220)
        destination = urlsplit(page.url).path
        ok = "/login.html" not in destination
        results.append({"area": area, "item": label, "ok": ok,
                        "destination": destination})
    except Exception as error:
        results.append({"area": area, "item": label, "ok": False,
                        "error": str(error).splitlines()[0][:180]})


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    account = credentials()
    results: list[dict] = []
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True, executable_path=CHROME)
        for width, height in ((1366, 768), (1024, 768), (768, 1024), (390, 844)):
            context = browser.new_context(viewport={"width": width, "height": height})
            page = context.new_page()
            login(page, account)
            page.screenshot(path=str(OUT / f"inicio-{width}x{height}.png"))
            if width in (1366, 1024):
                page.goto(BASE + "/unificado/index.html")
                links = page.locator('#sidebar a[href]:not([aria-disabled="true"]), .shortcut-link:not([aria-disabled="true"])')
                routes = list(dict.fromkeys((link.get_attribute("href"), link.inner_text().strip())
                                            for link in links.all() if link.get_attribute("href")))
                for href, label in routes:
                    resolved = urlsplit(urljoin(BASE + "/unificado/index.html", href))
                    if resolved.netloc != "concrefer.concretrack.com.br" or not resolved.path.startswith("/unificado/"):
                        continue
                    def visit_home(href=href):
                        page.goto(BASE + "/unificado/index.html")
                        page.locator(f'a[href="{href}"]:visible').first.click(timeout=5000)
                    checked(page, f"inicio-{width}", label, visit_home, results)

                page.goto(BASE + "/unificado/pcp/dashboard/")
                page.locator("#sidebar nav").wait_for(timeout=15000)
                menu = page.locator('#sidebar nav a.nav-link[href]:not([aria-disabled="true"])')
                pcp_routes = list(dict.fromkeys((link.get_attribute("href"), link.inner_text().strip())
                                                 for link in menu.all() if link.get_attribute("href")))
                for href, label in pcp_routes:
                    if not href.startswith("/unificado/"):
                        continue
                    def visit_pcp(href=href):
                        page.goto(BASE + "/unificado/pcp/dashboard/")
                        link = page.locator(f'#sidebar nav a.nav-link[href="{href}"]').first
                        group = link.locator('xpath=ancestor::div[contains(@class,"nav-group")]').first
                        if group.count() and group.locator('.nav-group-toggle').get_attribute('aria-expanded') == 'false':
                            group.locator('.nav-group-toggle').click(timeout=5000)
                        link.click(timeout=5000)
                    checked(page, f"pcp-menu-{width}", label, visit_pcp, results)

            page.goto(BASE + "/unificado/mapa/operacao/")
            page.wait_for_function("typeof state!=='undefined' && state.authUser?.role==='GERENCIA'", timeout=20000)
            page.wait_for_function("navigator.serviceWorker.controller !== null", timeout=20000)
            page.wait_for_timeout(1200)
            page.wait_for_function("typeof state!=='undefined' && state.authUser?.role==='GERENCIA'", timeout=20000)
            page.screenshot(path=str(OUT / f"mapa-{width}x{height}.png"))
            if width == 1366:
                modes = page.locator('.unificado-nav-link:visible').evaluate_all(
                    "els => els.map(el => [el.dataset.mode,el.getAttribute('aria-label')])")
                for mode, label in modes:
                    def visit_mode(mode=mode):
                        if page.locator("body.kiosk-active").count():
                            page.locator("#btnKioskBack:visible").click(timeout=5000)
                        page.locator(f'.unificado-nav-link[data-mode="{mode}"]').click(timeout=5000)
                        page.wait_for_function("mode => state.mode===mode", arg=mode, timeout=10000)
                    checked(page, "mapa-menu-1366", label, visit_mode, results)
            elif width == 1024:
                hub_ids = ("hubLiberacao", "hubLiberacaoS1", "hubLiberacaoS2",
                           "hubLiberacaoS3", "hubLiberacaoS4", "hubInspecao",
                           "hubMontagemPostes", "hubMontagemIndicadores",
                           "hubDashboardDefeitos", "hubRelatorio", "hubHistorico",
                           "hubAcmpConcretagem", "hubSequenciaS3", "hubMandrilCircular",
                           "hubRelatorioManutencao", "hubTratativaDefeitos")
                for item_id in hub_ids:
                    def visit_tablet(item_id=item_id):
                        page.evaluate("setMode('HUB')")
                        page.locator("#" + item_id).click(timeout=5000)
                    checked(page, "mapa-tablet-1024", item_id, visit_tablet, results)
            context.close()
        browser.close()
    report = {"version": Path("unificado/VERSION").read_text(encoding="utf-8").strip(),
              "total": len(results), "ok": sum(item["ok"] for item in results),
              "items": results}
    (OUT / "paired-navigation.json").write_text(
        json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({"total": report["total"], "ok": report["ok"],
                      "failed": [item for item in results if not item["ok"]],
                      "evidence": str(OUT / "paired-navigation.json")}, ensure_ascii=True))


if __name__ == "__main__":
    main()
