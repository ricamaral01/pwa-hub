"""Verify a previously installed browser profile updates at the published URL."""

from __future__ import annotations

import json
from pathlib import Path
import subprocess

from playwright.sync_api import sync_playwright


BASE = "https://concrefer.concretrack.com.br"
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
PROFILE = Path(".work-mapa-unificado/browser-old-cache")
OUT = Path("docs/capturas-ricardo-20261004")


def main() -> None:
    expected = Path("unificado/VERSION").read_text(encoding="utf-8").strip()
    OUT.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as playwright:
        context = playwright.chromium.launch_persistent_context(
            str(PROFILE), headless=True, executable_path=CHROME,
            viewport={"width": 1366, "height": 768})
        page = context.pages[0] if context.pages else context.new_page()
        raw = subprocess.check_output(
            ["ssh", "vps-staging", "cat", "/etc/mapa-unificado/auth-probe.env"],
            text=True, encoding="utf-8")
        account = dict(line.split("=", 1) for line in raw.splitlines() if "=" in line)
        page.goto(BASE + "/unificado/login.html", wait_until="domcontentloaded")
        page.locator('#unificado-login-form [name="username"]').fill(account["MAPA_TEST_USER"])
        page.locator('#unificado-login-form [name="password"]').fill(account["MAPA_TEST_PASSWORD"])
        page.locator('#unificado-login-form button[type="submit"]').click()
        page.wait_for_url("**/unificado/index.html", timeout=20000)
        page.evaluate("localStorage.setItem('unificado_menu_collapsed','0')")
        page.goto(BASE + "/unificado/mapa/operacao/", wait_until="domcontentloaded")
        page.wait_for_function("navigator.serviceWorker.controller !== null", timeout=20000)
        page.wait_for_function("version => document.querySelector('#unificado-version')?.textContent.includes(version)",
                               arg=expected, timeout=20000)
        page.wait_for_function("typeof state !== 'undefined' && state.authUser?.role === 'GERENCIA'", timeout=20000)
        if page.locator("body.kiosk-active").count():
            page.locator("#btnKioskBack:visible").click(timeout=5000)
        page.wait_for_timeout(1500)
        page.reload(wait_until="domcontentloaded")
        page.wait_for_function("version => document.querySelector('#unificado-version')?.textContent.includes(version)",
                               arg=expected, timeout=20000)
        page.wait_for_function("typeof state !== 'undefined' && state.authUser?.role === 'GERENCIA'", timeout=20000)
        if page.locator("body.kiosk-active").count():
            page.locator("#btnKioskBack:visible").click(timeout=5000)
        page.wait_for_function("[...document.querySelectorAll('.unificado-brand-logos img')].every(img => img.complete && img.naturalWidth > 0)", timeout=10000)
        page.wait_for_function("""async version => {
          const keys = await caches.keys();
          return keys.every(key => !key.startsWith('concrefer-unificado-mapa-operacao-') || key.endsWith('v' + version));
        }""", arg=expected, timeout=20000)
        result = page.evaluate("""async () => ({
          version: document.querySelector('#unificado-version')?.textContent.trim(),
          caches: await caches.keys(),
          logos: [...document.querySelectorAll('.unificado-brand-logos img')]
            .map(img => ({src: img.currentSrc, loaded: img.complete && img.naturalWidth > 0})),
          url: location.href
        })""")
        page.screenshot(path=str(OUT / "cache-anterior-mapa-1366x768.png"))
        context.close()
    assert expected in result["version"], result
    assert all(item["loaded"] for item in result["logos"]), result
    assert all(key.endswith("v" + expected) for key in result["caches"]), result
    (OUT / "old-cache.json").write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(result, ensure_ascii=True))


if __name__ == "__main__":
    main()
