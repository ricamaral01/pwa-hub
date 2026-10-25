"""Read-only browser checks for the quality presets in the combined shell."""

import sys
import os
from playwright.sync_api import sync_playwright

sys.path.insert(0, 'tests/unificado')
from homolog_session import test_cookie_for
from marcelo_ged_browser_smoke import short_session

BASE = os.environ.get('UNIFICADO_BASE_URL', 'https://concrefer.concretrack.com.br:18446')
CHROME = r'C:\Program Files\Google\Chrome\Application\chrome.exe'


def session(browser, user_id):
    context = browser.new_context(viewport={'width': 1440, 'height': 900}, service_workers='block')
    context.add_cookies([{'name': 'mapa_unificado_homolog_session' if ':18446' in BASE else 'mapa_unificado_session',
                          'value': test_cookie_for(user_id) if ':18446' in BASE else short_session(user_id),
                          'domain': 'concrefer.concretrack.com.br', 'path': '/unificado/',
                          'secure': True, 'httpOnly': True, 'sameSite': 'Lax'}])
    page = context.new_page()
    page.goto(BASE + '/unificado/login.html', wait_until='domcontentloaded')
    page.evaluate('user => localStorage.setItem("pwa_mapa_auth_session_v1", JSON.stringify(user))',
                  {'id': user_id, 'role': 'GERENCIA', 'name': user_id})
    page.goto(BASE + '/unificado/?view=mapa%2Foperacao%2F%3Ftela%3DUSUARIOS',
              wait_until='domcontentloaded')
    frame = page.frame_locator('#module-host iframe.is-active')
    frame.locator('#viewUsuarios .unified-users-search').wait_for(timeout=20000)
    return context, page, frame


with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True, executable_path=CHROME)
    for user_id in ('user-ricardo', 'marcelo'):
        context, page, frame = session(browser, user_id)
        assert frame.get_by_role('button', name='Criar convidado').is_visible()
        frame.locator('#viewUsuarios .unified-user-row-actions button').filter(has_text='Editar').first.click()
        editor = frame.locator('#unified-user-editor:not([hidden])')
        editor.wait_for(timeout=20000)
        section = editor.locator('[data-quality-actions]')
        assert section.is_visible()
        for label, preset, counts in [('Ver', 'view', (2, 1, 0)),
                                      ('Editar', 'edit', (3, 4, 0)),
                                      ('Todas', 'all', (4, 9, 20)),
                                      ('Limpar', 'clear', (0, 0, 0))]:
            section.locator(f'[data-quality-preset="{preset}"]').click()
            actual = tuple(section.locator(selector).count() for selector in (
                '.unified-screen-view:checked', '.unified-quality-action:checked',
                '.unified-quality-area:checked'))
            assert actual == counts, (user_id, label, actual)
        assert section.evaluate('el => el.scrollWidth <= el.clientWidth')
        print(user_id, 'quality presets 2/1, 3/4, 4/9/20, 0/0; guest button; no overflow: OK')
        context.close()
    browser.close()
