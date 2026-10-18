"""Read-only homologation smoke with an isolated, short-lived test session."""
from __future__ import annotations

import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'tests/unificado'))
from homolog_session import test_cookies  # noqa: E402

BASE = 'https://concrefer.concretrack.com.br:18446'
OUT = ROOT / 'docs/porting/cronoanalise/capturas-T6a'


def main() -> None:
    OUT.mkdir(exist_ok=True)
    token = test_cookies()['ricardo']
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1440, 'height': 900},
                                      ignore_https_errors=True, service_workers='block')
        context.add_cookies([{
            'name': 'mapa_unificado_homolog_session', 'value': token,
            'domain': 'concrefer.concretrack.com.br', 'path': '/unificado/',
            'secure': True, 'httpOnly': True, 'sameSite': 'Lax'
        }])
        bootstrap = context.request.post(BASE + '/unificado/mapa/api/unified/laboratorio-bootstrap')
        assert bootstrap.status == 200, ('bootstrap', bootstrap.status, bootstrap.text()[:200])
        for path in ['cronoanalise', 'cronoanalise/coletar', 'cronoanalise/metodologia']:
            response = context.request.get(BASE + '/unificado/laboratorio/' + path)
            assert response.status == 200, (path, response.status, response.text()[:200])
        status = context.request.get(BASE + '/unificado/laboratorio/api/laboratorio/cronoanalise/status')
        assert status.status == 200, (status.status, status.text()[:400])
        state = status.json()
        assert state['schema'] == 'cronoanalise' and state['medicoes'] == 0, state
        catalog = context.request.get(BASE + '/unificado/laboratorio/api/laboratorio/cronoanalise/atividades')
        assert catalog.status == 200 and len(catalog.json()) == 40, (catalog.status, catalog.text()[:300])
        print('HOMOLOG_API_OK routes=3 atividades=40 medicoes=0')

        page = context.new_page()
        page.goto(BASE + '/unificado/login.html', wait_until='domcontentloaded')
        page.evaluate("localStorage.setItem('pwa_mapa_auth_session_v1', JSON.stringify({id:'user-ricardo',role:'GERENCIA',name:'Ricardo'}))")
        page.goto(BASE + '/unificado/?view=laboratorio%2Fcronoanalise', wait_until='domcontentloaded')
        page.wait_for_function("document.body.classList.contains('unificado-permissions-loading') === false", timeout=20000)
        page.wait_for_function("document.querySelector('#module-host iframe.is-active') !== null", timeout=30000)
        frame = page.frame_locator('#module-host iframe.is-active')
        frame.get_by_role('heading', name='Cronoanálise').wait_for(timeout=30000)
        page.screenshot(path=str(OUT / 'cronoanalise-casca-desktop.png'))
        assert frame.get_by_role('heading', name='Cronoanálise').is_visible()
        assert page.get_by_text('CRONOANÁLISE').count() > 0
        for name in ['Início', 'Coletar', 'Medições', 'Catálogo', 'Dimensionar', 'Simular', 'Metodologia']:
            assert page.locator('#sidebar-model-a a.sb-link').filter(has_text=name).count() > 0, name
        page.locator('#sidebar-model-a .sb-scroll').evaluate('el => el.scrollTop = el.scrollHeight')
        page.screenshot(path=str(OUT / 'cronoanalise-menu-desktop.png'))
        print('HOMOLOG_SHELL_OK')

        page.goto(BASE + '/unificado/?view=mapa%2Foperacao%2F%3Ftela%3DUSUARIOS',
                  wait_until='domcontentloaded')
        user_frame = page.frame_locator('#module-host iframe.is-active')
        user_frame.locator('#viewUsuarios .unified-users-search').wait_for(timeout=30000)
        user_frame.locator('#viewUsuarios .unified-user-row-actions button').filter(has_text='Editar').first.click()
        editor = user_frame.locator('#unified-user-editor:not([hidden])')
        editor.wait_for(timeout=20000)
        assert editor.locator('.unified-screen-view[data-screen^="cronoanalise."]').count() == 7
        assert editor.locator('.unified-crono-action').count() == 3
        editor.locator('.unified-screen-view[data-screen="cronoanalise.inicio"]').scroll_into_view_if_needed()
        page.screenshot(path=str(OUT / 'cronoanalise-permissoes.png'))
        print('HOMOLOG_PERMISSIONS_UI_OK screens=7 actions=3')
        context.close()
        browser.close()


if __name__ == '__main__':
    main()
