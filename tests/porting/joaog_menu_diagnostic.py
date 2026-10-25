"""Read-only production diagnosis of a blank Unificado menu for joaog."""
from __future__ import annotations

import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'tests/unificado'))
from marcelo_ged_browser_smoke import short_session  # noqa: E402

BASE = 'https://concrefer.concretrack.com.br'


def main() -> None:
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1440, 'height': 900}, ignore_https_errors=True)
        context.add_cookies([{'name': 'mapa_unificado_session', 'value': short_session('joaog'),
                             'domain': 'concrefer.concretrack.com.br', 'path': '/unificado/',
                             'secure': True, 'httpOnly': True, 'sameSite': 'Lax'}])
        response = context.request.get(BASE + '/unificado/mapa/api/unified/screen-access/me')
        print('ACCESS', response.status, response.text()[:1000])
        linked = context.request.get(BASE + '/unificado/mapa/api/unified/pcp-session')
        print('PCP_SESSION', linked.status)
        page = context.new_page()
        errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.goto(BASE + '/unificado/login.html', wait_until='domcontentloaded', timeout=60000)
        page.evaluate("localStorage.setItem('pwa_mapa_auth_session_v1', JSON.stringify({id:'joaog',role:'GERENCIA',name:'João Gabriel'}))")
        if linked.status == 200:
            page.evaluate("data => { localStorage.setItem('pcp_token', data.access_token); localStorage.setItem('pcp_user', JSON.stringify(data.usuario)); }", linked.json())
        page.goto(BASE + '/unificado/?view=laboratorio%2F', wait_until='domcontentloaded', timeout=60000)
        page.wait_for_function("!document.body.classList.contains('unificado-permissions-loading')", timeout=30000)
        print('PAGE', page.url, 'links', page.locator('#sidebar-model-a a.sb-link').count(),
              'sections', page.locator('#sidebar-model-a .sb-section').all_text_contents(),
              'errors', errors)
        page.screenshot(path=str(ROOT / 'docs/porting/cronoanalise/capturas-T6b/joaog-menu-diagnostico.png'))
        with page.expect_navigation(wait_until='domcontentloaded', timeout=60000):
            page.locator('#sidebar-model-a .sb-update').click()
        page.wait_for_function("!document.body.classList.contains('unificado-permissions-loading')", timeout=30000)
        print('AFTER_UPDATE', page.url, page.locator('#sidebar-model-a .sb-section').count(), 'errors', errors)
        page.get_by_role('link', name='Dashboard' if linked.status == 200 else 'Produção / Liberação').click()
        frame = page.locator('#module-host iframe.is-active')
        frame.wait_for(state='visible', timeout=30000)
        inner = frame.element_handle().content_frame()
        print('CLICK_VIEW', page.url, inner.url, inner.locator('body').inner_text()[:150], 'errors', errors)
        context.close()
        browser.close()


if __name__ == '__main__':
    main()
