"""One module losing authorization must keep the other module available."""

from __future__ import annotations

import json
from pathlib import Path

from playwright.sync_api import sync_playwright

from paired_navigation_published import BASE, CHROME, credentials, login


OUT = Path("docs/capturas-ricardo-20261004")


def main() -> None:
    account = credentials()
    results = []
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True, executable_path=CHROME)
        for failed_module in ("Produção", "Planejamento"):
            context = browser.new_context(viewport={"width": 1366, "height": 768},
                                          service_workers="block")
            page = context.new_page()
            login(page, account)
            if failed_module == "Produção":
                context.clear_cookies()
                page.goto(BASE + "/unificado/mapa/operacao/")
                page.locator("text=Produção indisponível para esta conta.").wait_for(timeout=15000)
                page.goto(BASE + "/unificado/pcp/dashboard/")
                page.locator("#sidebar nav").wait_for(timeout=15000)
                other = "Planejamento"
            else:
                page.evaluate("localStorage.removeItem('pcp_token')")
                page.goto(BASE + "/unificado/pcp/dashboard/")
                page.locator("text=Planejamento indisponível para esta conta.").wait_for(timeout=15000)
                page.goto(BASE + "/unificado/mapa/operacao/")
                page.wait_for_function("typeof state !== 'undefined' && state.authUser?.role === 'GERENCIA'", timeout=15000)
                other = "Produção"
            assert "/login.html" not in page.url
            results.append({"failed_module": failed_module, "other_module_available": other,
                            "returned_to_login": False})
            context.close()
        browser.close()
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "session-isolation.json").write_text(
        json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(results, ensure_ascii=True))


if __name__ == "__main__":
    main()
