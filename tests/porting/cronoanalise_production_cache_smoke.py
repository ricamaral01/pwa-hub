"""Read-only check that a returning browser receives the new Cronoanálise menu."""
from __future__ import annotations

import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'tests/unificado'))
from marcelo_ged_browser_smoke import short_session  # noqa: E402

BASE = 'https://concrefer.concretrack.com.br'
OUT = ROOT / 'docs/porting/cronoanalise/capturas-T6b/crono-menu-cache-corrigido.png'


def main() -> None:
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1440, 'height': 900},
                                      ignore_https_errors=True)
        context.add_cookies([{'name': 'mapa_unificado_session', 'value': short_session('user-ricardo'),
                             'domain': 'concrefer.concretrack.com.br', 'path': '/unificado/',
                             'secure': True, 'httpOnly': True, 'sameSite': 'Lax'}])
        page = context.new_page()
        page.goto(BASE + '/unificado/login.html', wait_until='domcontentloaded', timeout=60000)
        page.evaluate("localStorage.setItem('pwa_mapa_auth_session_v1', JSON.stringify({id:'user-ricardo',role:'GERENCIA',name:'Ricardo'}))")
        for reload_count in range(2):
            page.goto(BASE + '/unificado/?view=laboratorio%2Fcronoanalise', wait_until='domcontentloaded', timeout=60000)
            page.wait_for_function("!document.body.classList.contains('unificado-permissions-loading')", timeout=30000)
            page.get_by_text('CRONOANÁLISE').wait_for(timeout=30000)
            links = page.locator('#sidebar-model-a a.sb-link[href*="cronoanalise"]')
            assert links.count() == 7, (reload_count, links.count())
            page.frame_locator('#module-host iframe.is-active').get_by_role(
                'heading', name='Cronoanálise').wait_for(timeout=30000)
            versions = page.evaluate("""() => ({
              scripts: [...document.scripts].map(s => s.src).filter(s => s.includes('/shell/')),
              cache: navigator.serviceWorker.controller?.scriptURL || ''
            })""")
            assert all('1.0.16-cronoanalise' in url for url in versions['scripts']
                       if any(name in url for name in ('menu.config.js', 'shell.js', 'router.js', 'modelo-a-loader.js'))), versions
            print('MENU_OK', reload_count + 1, 'links=7', versions)
        page.locator('#sidebar-model-a .sb-scroll').evaluate('el => el.scrollTop = el.scrollHeight')
        page.locator('#sidebar-model-a').screenshot(path=str(OUT))
        context.close()
        browser.close()


if __name__ == '__main__':
    main()
