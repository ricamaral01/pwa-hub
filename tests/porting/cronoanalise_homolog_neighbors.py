"""Read-only screenshots of neighboring Unificado modules in homologation."""
from __future__ import annotations

import sys
from pathlib import Path
from urllib.parse import quote

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'tests/unificado'))
from homolog_session import test_cookies  # noqa: E402

BASE = 'https://concrefer.concretrack.com.br:18446'
OUT = ROOT / 'docs/porting/cronoanalise/capturas-T6a'
CASES = [
    ('pcp', 'pcp/dashboard/', '/unificado/pcp/'),
    ('mapa', 'mapa/operacao/?tela=LIBERACAO', '/unificado/mapa/'),
    ('ged', 'ged/dashboard', '/unificado/ged/'),
    ('laboratorio', 'laboratorio/', '/unificado/laboratorio/'),
]


def main() -> None:
    OUT.mkdir(exist_ok=True)
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1440, 'height': 900},
                                      ignore_https_errors=True, service_workers='block')
        context.add_cookies([{
            'name': 'mapa_unificado_homolog_session', 'value': test_cookies()['ricardo'],
            'domain': 'concrefer.concretrack.com.br', 'path': '/unificado/',
            'secure': True, 'httpOnly': True, 'sameSite': 'Lax'
        }])
        page = context.new_page()
        page.goto(BASE + '/unificado/login.html', wait_until='domcontentloaded')
        page.evaluate("localStorage.setItem('pwa_mapa_auth_session_v1', JSON.stringify({id:'user-ricardo',role:'GERENCIA',name:'Ricardo'}))")
        linked = page.evaluate("""async () => {
          const response = await fetch('/unificado/mapa/api/unified/pcp-session', {credentials:'same-origin'});
          if (!response.ok) return false;
          const data = await response.json();
          localStorage.setItem('pcp_token', data.access_token);
          localStorage.setItem('pcp_user', JSON.stringify(data.usuario));
          return Boolean(data.access_token);
        }""")
        assert linked, 'Conta de teste sem vínculo PCP'
        for name, view, expected in CASES:
            page.goto(BASE + '/unificado/?view=' + quote(view, safe=''), wait_until='domcontentloaded')
            try:
                page.wait_for_function("document.querySelector('#module-host iframe.is-active') !== null",
                                       timeout=30000)
            except Exception:
                page.screenshot(path=str(OUT / f'debug-{name}.png'))
                print(name, page.url, page.locator('body').inner_text()[:300])
                raise
            iframe = page.locator('#module-host iframe.is-active')
            iframe.wait_for(state='visible', timeout=30000)
            frame = iframe.element_handle().content_frame()
            assert frame is not None
            frame.wait_for_load_state('domcontentloaded', timeout=30000)
            assert expected in frame.url, (name, frame.url)
            assert 'login.html' not in frame.url, (name, frame.url)
            if name == 'pcp':
                frame.get_by_text('PROGRAMADO VS REALIZADO POR SETOR').wait_for(timeout=30000)
                page.wait_for_timeout(1500)
            page.screenshot(path=str(OUT / f'regressao-{name}.png'))
            print(f'NEIGHBOR_OK {name} {frame.url}')
        context.close()
        browser.close()


if __name__ == '__main__':
    main()
