"""Read-only production check of the user editor, including joaog."""
from __future__ import annotations

import sys
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'tests/unificado'))
from marcelo_ged_browser_smoke import short_session  # noqa: E402

BASE = 'https://concrefer.concretrack.com.br'

with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context(viewport={'width': 1440, 'height': 900},
                                  ignore_https_errors=True, service_workers='block')
    context.add_cookies([{'name': 'mapa_unificado_session', 'value': short_session('user-ricardo'),
                         'domain': 'concrefer.concretrack.com.br', 'path': '/unificado/',
                         'secure': True, 'httpOnly': True, 'sameSite': 'Lax'}])
    page = context.new_page()
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.goto(BASE + '/unificado/login.html', wait_until='domcontentloaded', timeout=60000)
    page.evaluate("localStorage.setItem('pwa_mapa_auth_session_v1', JSON.stringify({id:'user-ricardo',role:'GERENCIA',name:'Ricardo'}))")
    page.goto(BASE + '/unificado/?view=mapa%2Foperacao%2F%3Ftela%3DUSUARIOS',
              wait_until='domcontentloaded', timeout=60000)
    frame = page.frame_locator('#module-host iframe.is-active')
    search = frame.locator('#viewUsuarios .unified-users-search')
    search.wait_for(timeout=30000)
    search.fill('João')
    rows = frame.locator('#viewUsuarios .unified-user-row-actions:visible')
    rows.first.wait_for(timeout=30000)
    print('ROWS', rows.count(), 'ERRORS', errors)
    rows.first.locator('button').filter(has_text='Editar').click()
    editor = frame.locator('#unified-user-editor:not([hidden])')
    editor.wait_for(timeout=30000)
    print('EDITOR', editor.inner_text()[:500], 'SCREENS',
          editor.locator('.unified-screen-view').count(), 'ERRORS', errors)
    page.screenshot(path=str(ROOT / 'docs/porting/cronoanalise/capturas-T6b/users-editor-joaog-diagnostico.png'))
    context.close()
    browser.close()
