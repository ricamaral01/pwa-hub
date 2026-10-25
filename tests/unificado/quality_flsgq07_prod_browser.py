"""Read-only browser check of the approved Quality SPA in production."""
from __future__ import annotations

from playwright.sync_api import sync_playwright

from ged_sso_published_smoke import BASE, CHROME, context_for


SMOKE_ID = "a6203f85-fc4a-4f5b-8c02-b430a053014b"


def main():
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True, executable_path=CHROME)
        context, page = context_for(browser, "user-ricardo")
        bootstrap = page.request.post(BASE + "/unificado/mapa/api/unified/qualidade-bootstrap")
        assert bootstrap.status == 200, bootstrap.status
        for route, title in (
            ("", "RNCs · Não conformidades"),
            ("abrir", "Nova RNC"),
            ("nc/" + SMOKE_ID, "SMOKE FL-SGQ-07 - validação da publicação"),
        ):
            response = page.goto(BASE + "/unificado/qualidade/" + route,
                                 wait_until="domcontentloaded", timeout=20000)
            assert response and response.status == 200, (route, response.status if response else None)
            page.get_by_role("heading", name=title).wait_for(timeout=15000)
            print(route or "lista", "rendered 200")
        page.get_by_role("heading", name="FL-SGQ-07 · dados do formulário").wait_for(timeout=15000)
        download = page.request.get(BASE + f"/unificado/qualidade/api/nc/{SMOKE_ID}/pdf")
        assert download.status == 200 and download.body().startswith(b"%PDF-")
        print("tratativa e PDF 200")
        context.close()
        browser.close()


if __name__ == "__main__":
    main()
