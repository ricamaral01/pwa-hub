"""Exercise the isolated GED frontend with browser-only fixture data."""
from __future__ import annotations

import json
from playwright.sync_api import sync_playwright

BASE = "http://127.0.0.1:13072"
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
USER = {"id": "browser-fixture", "name": "Ensaio visual", "username": "fixture",
        "email": "fixture@example.invalid", "role": "LEITOR", "company_id": "fixture",
        "company_slug": "concrefer", "permissions": ["documents.read"]}


def main() -> None:
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True, executable_path=CHROME)
        context = browser.new_context(service_workers="block")
        context.add_init_script("""
          localStorage.setItem('ged_token', 'browser-fixture');
          localStorage.setItem('ged_user', JSON.stringify(%s));
        """ % json.dumps(USER))

        def api(route, request):
            path = request.url.split("/api/")[-1].split("?")[0]
            data = USER if path == "auth/me" else (
                {"total": "0", "aprovados": "0", "em_revisao": "0", "obsoletos": "0", "pendentes": "0"}
                if path == "documents/stats" else [])
            route.fulfill(status=200, content_type="application/json", body=json.dumps(data))

        context.route("**/unificado/ged/api/**", api)
        context.route("**/mock-shell", lambda route, request: route.fulfill(
            status=200, content_type="text/html",
            body='<iframe style="width:100%;height:900px" src="/unificado/ged/dashboard?embed=1"></iframe>'))
        page = context.new_page()
        page.goto(BASE + "/mock-shell")
        frame = page.frame_locator("iframe")
        frame.get_by_role("heading", name="Dashboard").wait_for(timeout=30000)
        assert frame.locator("aside").count() == 0
        assert frame.locator("header").count() == 0
        page.locator("iframe").evaluate("node => node.contentWindow.location.assign('/unificado/ged/documents')")
        frame.get_by_role("heading", name="Documentos").first.wait_for(timeout=30000)
        assert frame.locator("aside").count() == 0
        assert frame.locator("header").count() == 0
        direct = context.new_page()
        direct.goto(BASE + "/unificado/ged/dashboard")
        direct.get_by_role("heading", name="Dashboard").wait_for(timeout=30000)
        assert direct.locator("aside").count() == 1
        assert direct.locator("header").count() == 1
        assert direct.get_by_role("link", name="RNCs").count() == 0
        assert direct.get_by_role("link", name="Usuários").count() == 0
        direct.goto(BASE + "/unificado/ged/users")
        direct.get_by_text("Você não tem acesso a esta tela.").wait_for(timeout=30000)
        print(json.dumps({"embedded_controls_hidden": True, "direct_controls_visible": True,
                          "embed_persists_after_navigation": True, "ged_menu_excludes_rnc_users": True,
                          "non_ricardo_users_page_denied": True}))
        context.close()
        browser.close()


if __name__ == "__main__":
    main()
