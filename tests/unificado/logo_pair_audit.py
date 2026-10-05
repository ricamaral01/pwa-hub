"""Capture every published screen location that displays the two official marks."""

from __future__ import annotations

import json
from pathlib import Path
import subprocess

from playwright.sync_api import sync_playwright


BASE = "https://concrefer.concretrack.com.br"
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
OUT = Path(__file__).resolve().parents[2] / "docs" / "capturas-validacao-0512" / "logos"


def secret_file(name: str) -> dict[str, str]:
    raw = subprocess.check_output(["ssh", "vps-staging", "cat", name], text=True)
    return dict(line.split("=", 1) for line in raw.splitlines() if "=" in line)


def login(page, username: str, password: str, next_path: str) -> None:
    page.goto(f"{BASE}/unificado/login.html?next={next_path}", wait_until="domcontentloaded")
    page.locator('#unificado-login-form [name="username"]').fill(username)
    page.locator('#unificado-login-form [name="password"]').fill(password)
    page.locator('#unificado-login-form button[type="submit"]').click()


def visible_pair(page, selector: str) -> bool:
    root = page.locator(selector)
    return root.is_visible() and root.locator('img[alt="Concrefer"]:visible').count() == 1 \
        and root.locator('img[alt="ConcreTrack"]:visible').count() == 1


def main() -> None:
    mapa = secret_file("/etc/mapa-unificado/auth-probe.env")
    pcp = secret_file("/etc/mapa-unificado/pcp-auth-probe.env")
    OUT.mkdir(parents=True, exist_ok=True)
    results = []
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True, executable_path=CHROME)
        for width, height in ((1366, 768), (390, 844)):
            context = browser.new_context(viewport={"width": width, "height": height}, service_workers="block")
            page = context.new_page()
            page.goto(BASE + "/unificado/login.html", wait_until="networkidle")
            results.append({"place": "login", "size": f"{width}x{height}", "pair": visible_pair(page, ".login-brand")})
            page.screenshot(path=str(OUT / f"login-{width}x{height}.png"), full_page=False)
            login(page, mapa["MAPA_TEST_USER"], mapa["MAPA_TEST_PASSWORD"], "testar/")
            page.wait_for_url("**/unificado/testar/", timeout=20000)
            results.append({"place": "testar", "size": f"{width}x{height}", "pair": visible_pair(page, ".brand")})
            page.screenshot(path=str(OUT / f"testar-{width}x{height}.png"), full_page=False)
            page.goto(BASE + "/unificado/mapa/operacao/", wait_until="domcontentloaded")
            page.wait_for_function("state.authUser?.role === 'GERENCIA'", timeout=20000)
            selector = ".unificado-brand-logos" if width > 1024 else ".unificado-test-logos"
            results.append({"place": "mapa", "size": f"{width}x{height}", "pair": visible_pair(page, selector)})
            page.screenshot(path=str(OUT / f"mapa-{width}x{height}.png"), full_page=False)
            if width > 1024:
                page.evaluate("""() => {
                  const event=new Event('beforeinstallprompt',{cancelable:true});
                  Object.defineProperty(event,'prompt',{value:async()=>{}});
                  Object.defineProperty(event,'userChoice',{value:Promise.resolve({outcome:'dismissed'})});
                  dispatchEvent(event);
                }""")
                page.locator(".unificado-install-button:visible").click()
                results.append({"place": "instalacao-pwa", "size": f"{width}x{height}",
                                "pair": visible_pair(page, ".unificado-install-logos")})
                page.screenshot(path=str(OUT / f"instalacao-pwa-{width}x{height}.png"), full_page=False)
                page.locator(".unificado-install-dialog [data-close]").click()
                page.locator(".unificado-collapse").click()
                results.append({"place": "mapa-menu-recolhido", "size": f"{width}x{height}",
                                "pair": visible_pair(page, ".unificado-brand-logos")})
                page.screenshot(path=str(OUT / f"mapa-menu-recolhido-{width}x{height}.png"), full_page=False)
                page.locator(".unificado-collapse").click()
                page.locator("#loadingModal").evaluate("node => node.classList.add('modal-visible')")
                results.append({"place": "mapa-carregamento", "size": f"{width}x{height}", "pair": visible_pair(page, ".unificado-loading-logos")})
                page.screenshot(path=str(OUT / f"mapa-carregamento-{width}x{height}.png"), full_page=False)
            context.close()
        for width, height in ((1366, 768), (390, 844)):
            context = browser.new_context(viewport={"width": width, "height": height}, service_workers="block")
            page = context.new_page()
            login(page, pcp["PCP_TEST_USER"], pcp["PCP_TEST_PASSWORD"], "pcp/dashboard/")
            page.wait_for_url("**/unificado/pcp/dashboard/", timeout=20000)
            page.wait_for_timeout(1200)
            selector = ".unificado-pcp-brand-logos" if width > 1024 else ".unificado-pcp-test-brand"
            results.append({"place": "pcp", "size": f"{width}x{height}", "pair": visible_pair(page, selector)})
            page.screenshot(path=str(OUT / f"pcp-{width}x{height}.png"), full_page=False)
            if width > 1024:
                page.locator(".unificado-pcp-collapse").click()
                results.append({"place": "pcp-menu-recolhido", "size": f"{width}x{height}",
                                "pair": visible_pair(page, ".unificado-pcp-brand-logos")})
                page.screenshot(path=str(OUT / f"pcp-menu-recolhido-{width}x{height}.png"), full_page=False)
            context.close()
        browser.close()
    assert all(item["pair"] for item in results), results
    (OUT / "audit.json").write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({"places": len(results), "pairs": sum(item["pair"] for item in results),
                      "captures": len(list(OUT.glob("*.png")))}, ensure_ascii=False))


if __name__ == "__main__":
    main()
