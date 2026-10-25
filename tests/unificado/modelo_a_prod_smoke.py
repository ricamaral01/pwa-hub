"""Read-only smoke of the approved sidebar with existing session identities."""

import argparse
from playwright.sync_api import sync_playwright

from ged_sso_published_smoke import BASE as PROD_BASE, CHROME, context_for
from homolog_session import test_cookie_for, test_cookies


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--homolog", action="store_true")
    parser.add_argument("--pre-change", action="store_true")
    args = parser.parse_args()
    base = "https://concrefer.concretrack.com.br:18446" if args.homolog else PROD_BASE
    cookies = test_cookies() if args.homolog else None
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True, executable_path=CHROME)

        def session(user_id):
            if not args.homolog:
                return context_for(browser, user_id)
            context = browser.new_context(service_workers="block", viewport={"width": 1440, "height": 900})
            context.add_cookies([{
                "name": "mapa_unificado_homolog_session",
                "value": cookies["ricardo"] if user_id == "user-ricardo" else test_cookie_for(user_id),
                "domain": "concrefer.concretrack.com.br", "path": "/unificado/",
                "secure": True, "httpOnly": True, "sameSite": "Lax",
            }])
            page = context.new_page()
            page.goto(base + "/unificado/login.html", wait_until="domcontentloaded")
            page.evaluate("user => localStorage.setItem('pwa_mapa_auth_session_v1', JSON.stringify(user))",
                          {"id": user_id, "role": "GERENCIA", "name": user_id})
            return context, page

        context, page = session("user-ricardo")
        page.goto(base + "/unificado/", wait_until="domcontentloaded", timeout=20000)
        sidebar = page.locator("#sidebar-model-a .sb")
        sidebar.wait_for(state="visible", timeout=20000)
        assert sidebar.evaluate("el => Math.round(el.getBoundingClientRect().width)") == 272
        page.locator("#sidebar-model-a .sb-switcher-btn").click()
        page.get_by_role("menuitemradio", name="GED").click()
        for route, title in (("dashboard", "Painel"), ("documents", "Documentos"),
                             ("approvals", "Aprovações"), ("tasks", "Tarefas"),
                             ("calibrations", "Calibrações")):
            page.locator(f'#sidebar-model-a a[href$="ged%2F{route}"]').click(timeout=12000)
            page.frame_locator("#module-host iframe.is-active").locator("main").wait_for(timeout=20000)
            page.wait_for_function(
                "title => document.querySelector('#sidebar-model-a .sb-link.is-active')?.textContent?.trim() === title",
                arg=title, timeout=20000)
            assert page.locator("#sidebar-model-a .sb-link.is-active").count() == 1
            page.reload(wait_until="domcontentloaded", timeout=20000)
            page.frame_locator("#module-host iframe.is-active").locator("main").wait_for(timeout=20000)
            assert page.locator("#sidebar-model-a .sb-link.is-active").count() == 1
            print(f"GED {route} + reload: OK", flush=True)
        linked = page.evaluate("""async () => {
          const response = await fetch('/unificado/mapa/api/unified/pcp-session', {credentials:'same-origin'});
          const data = response.ok ? await response.json() : {};
          if (!data.access_token || !data.usuario) return false;
          localStorage.setItem('pcp_token', data.access_token);
          localStorage.setItem('pcp_user', JSON.stringify(data.usuario));
          return true;
        }""")
        assert linked, "Ricardo's linked PCP session was unavailable"
        page.reload(wait_until="domcontentloaded")
        page.locator("#sidebar-model-a .sb").wait_for(state="visible", timeout=20000)
        page.locator("#sidebar-model-a .sb-switcher-btn").click()
        page.get_by_role("menuitemradio", name="Planejamento").click()
        page.wait_for_function("new URLSearchParams(location.search).get('view') === 'pcp/dashboard/'", timeout=20000)
        page.locator("#sidebar-model-a .sb-switcher-btn").click()
        page.get_by_role("menuitemradio", name="Produção").click()
        page.wait_for_function(
            "new URLSearchParams(location.search).get('view') === 'mapa/operacao/?tela=LIBERACAO'",
            timeout=20000)
        assert page.locator("#sidebar-model-a .sb-link.is-active").count() == 1
        print("Planejamento para Produção: primeira tela, um destaque", flush=True)
        context.close()

        context, page = session("marcelo")
        page.goto(base + "/unificado/", wait_until="domcontentloaded", timeout=20000)
        page.locator("#sidebar-model-a .sb").wait_for(state="visible", timeout=20000)
        page.locator("#sidebar-model-a .sb-switcher-btn").click()
        expected_lab = 0 if args.pre_change else 1
        assert page.get_by_role("menuitemradio", name="Laboratório").count() == expected_lab
        print("Laboratório no menu de Marcelo:", expected_lab, flush=True)
        context.close()

        context, page = session("user-ricardo")
        page.set_viewport_size({"width": 390, "height": 844})
        page.goto(base + "/unificado/", wait_until="domcontentloaded", timeout=20000)
        page.wait_for_function("!document.body.classList.contains('unificado-permissions-loading')", timeout=20000)
        # Mobile mode is selected by the same viewport rule as the published shell.
        assert not page.locator("#sidebar-model-a").is_visible()
        assert page.locator("#sidebar").is_visible()
        print("390 px: menu anterior preservado", flush=True)
        context.close()
        browser.close()


if __name__ == "__main__":
    main()
