"""Browser-engine checks of the published test PWA at tablet sizes."""

from __future__ import annotations

import json
from pathlib import Path
import subprocess
from urllib.parse import urlsplit

from playwright.sync_api import sync_playwright


BASE = "https://concrefer.concretrack.com.br"
OUT = Path("docs/capturas-ricardo-20261004")
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"


def main() -> None:
    raw = subprocess.check_output(
        ["ssh", "vps-staging", "cat", "/etc/mapa-unificado/auth-probe.env"],
        text=True, encoding="utf-8")
    account = dict(line.split("=", 1) for line in raw.splitlines() if "=" in line)
    OUT.mkdir(parents=True, exist_ok=True)
    results = []
    with sync_playwright() as playwright:
        engines = (("android-chrome", playwright.chromium, "Galaxy Tab S9"),
                   ("android-chrome", playwright.chromium, "Galaxy Tab S9 landscape"),
                   ("ipad-webkit", playwright.webkit, "iPad (gen 6)"),
                   ("ipad-webkit", playwright.webkit, "iPad (gen 6) landscape"))
        for engine_name, engine, device_name in engines:
            browser = engine.launch(headless=True, executable_path=CHROME) if engine_name == "android-chrome" else engine.launch(headless=True)
            context = browser.new_context(**playwright.devices[device_name])
            page = context.new_page()
            external = []
            page.on("request", lambda request: external.append(urlsplit(request.url).hostname)
                    if urlsplit(request.url).hostname not in {"concrefer.concretrack.com.br"} else None)
            page.goto(BASE + "/unificado/login.html", wait_until="domcontentloaded")
            page.wait_for_function("[...document.querySelectorAll('.login-brand img')].every(img => img.complete && img.naturalWidth > 0)", timeout=10000)
            logos = page.locator(".login-brand img").evaluate_all(
                "imgs => imgs.map(img => img.complete && img.naturalWidth > 0)")
            page.locator('#unificado-login-form [name="username"]').fill(account["MAPA_TEST_USER"])
            page.locator('#unificado-login-form [name="password"]').fill(account["MAPA_TEST_PASSWORD"])
            page.locator('#unificado-login-form button[type="submit"]').click()
            page.wait_for_url("**/unificado/index.html", timeout=20000)
            page.goto(BASE + "/unificado/mapa/operacao/", wait_until="domcontentloaded")
            page.wait_for_function("typeof state!=='undefined' && state.authUser?.role==='GERENCIA'", timeout=20000)
            page.wait_for_function("navigator.serviceWorker.controller !== null", timeout=20000)
            page.wait_for_timeout(1200)
            page.wait_for_function("typeof state!=='undefined' && state.authUser?.role==='GERENCIA'", timeout=20000)
            mode_results = []
            for mode in ("HUB", "LIBERACAO_S1", "INSPECAO", "RELATORIO_MANUTENCAO"):
                page.evaluate("mode => setMode(mode)", mode)
                mode_results.append({"mode": mode, "actual": page.evaluate("state.mode")})
            page.evaluate("setMode('HUB')")
            filename = f"{engine_name}-{device_name.lower().replace(' ','-').replace('(','').replace(')','')}.png"
            page.screenshot(path=str(OUT / filename))
            manifest = context.request.get(BASE + "/unificado/mapa/operacao/manifest.json").json()
            result = {"engine": engine_name, "device": device_name,
                      "viewport": page.evaluate("[innerWidth,innerHeight]"),
                      "logins": all(logos), "mode_results": mode_results,
                      "operational_icon": manifest.get("icons", [{}])[0].get("src") == "unificado-icon.png",
                      "operational_name": manifest.get("name") == "Concrefer Produção",
                      "desktop_shell_hidden": page.locator(".unificado-sidebar:visible").count() == 0,
                      "external_hosts": sorted(set(external)), "capture": filename}
            results.append(result)
            context.close()
            browser.close()
    (OUT / "tablet-engines.json").write_text(
        json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(results, ensure_ascii=True))
    assert all(item["logins"] and item["operational_icon"] and item["operational_name"]
               and item["desktop_shell_hidden"] and not item["external_hosts"]
               and all(mode["mode"] == mode["actual"] for mode in item["mode_results"])
               for item in results)


if __name__ == "__main__":
    main()
