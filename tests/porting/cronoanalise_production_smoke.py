"""Read-only authenticated T6b browser evidence; never creates a measurement."""
from __future__ import annotations

import sys
import time
from pathlib import Path
from urllib.parse import quote

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'tests/unificado'))
from marcelo_ged_browser_smoke import short_session  # noqa: E402

BASE = 'https://concrefer.concretrack.com.br'
OUT = ROOT / 'docs/porting/cronoanalise/capturas-T6b'
ROUTES = ('', 'coletar', 'medicoes', 'catalogo', 'dimensionar', 'simular', 'metodologia')
NEIGHBORS = (
    ('pcp', 'pcp/dashboard/', '/unificado/pcp/'),
    ('mapa', 'mapa/operacao/?tela=LIBERACAO', '/unificado/mapa/'),
    ('ged', 'ged/dashboard', '/unificado/ged/'),
    ('laboratorio', 'laboratorio/', '/unificado/laboratorio/'),
)


def open_view(page, view: str):
    page.goto(BASE + '/unificado/?view=' + quote(view, safe=''), wait_until='domcontentloaded')
    iframe = page.locator('#module-host iframe.is-active')
    iframe.wait_for(state='visible', timeout=30000)
    frame = iframe.element_handle().content_frame()
    assert frame is not None
    frame.wait_for_load_state('domcontentloaded', timeout=30000)
    return frame


def main() -> None:
    OUT.mkdir(exist_ok=True)
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1440, 'height': 900},
                                      ignore_https_errors=True, service_workers='block')
        context.add_cookies([{'name': 'mapa_unificado_session', 'value': short_session('user-ricardo'),
                             'domain': 'concrefer.concretrack.com.br', 'path': '/unificado/',
                             'secure': True, 'httpOnly': True, 'sameSite': 'Lax'}])
        page = context.new_page()
        page.goto(BASE + '/unificado/login.html', wait_until='domcontentloaded')
        page.evaluate("localStorage.setItem('pwa_mapa_auth_session_v1', JSON.stringify({id:'user-ricardo',role:'GERENCIA',name:'Ricardo'}))")
        bootstrap = context.request.post(BASE + '/unificado/mapa/api/unified/laboratorio-bootstrap')
        assert bootstrap.status == 200, ('bootstrap', bootstrap.status)
        status = context.request.get(BASE + '/unificado/laboratorio/api/laboratorio/cronoanalise/status')
        assert status.status == 200 and status.json()['schema'] == 'cronoanalise', (status.status, status.text()[:200])
        assert status.json()['medicoes'] == 0, status.json()
        print('STATUS_OK', status.status, status.json())

        for suffix in ROUTES:
            view = 'laboratorio/cronoanalise' + ('/' + suffix if suffix else '')
            frame = open_view(page, view)
            frame.locator('.cr-app').wait_for(timeout=30000)
            assert '/unificado/laboratorio/cronoanalise' in frame.url, frame.url
            page.screenshot(path=str(OUT / ('crono-' + (suffix or 'inicio') + '.png')))
            print('SCREEN_OK', suffix or 'inicio', frame.url)

        frame = open_view(page, 'laboratorio/cronoanalise/dimensionar')
        frame.get_by_role('button', name='Calcular dimensionamento').click()
        frame.locator('.cr-highlight strong').wait_for(timeout=30000)
        warning = frame.get_by_text('Estimativa: há atividades sem amostra suficiente.')
        warning.wait_for(timeout=30000)
        print('DIMENSION_OK', frame.locator('.cr-highlight strong').inner_text(), 'warning=estimativa')
        page.screenshot(path=str(OUT / 'dimensionar-resultado.png'))

        frame = open_view(page, 'laboratorio/cronoanalise/simular')
        frame.get_by_role('button', name='Sequências', exact=True).click()
        frame.get_by_label('Replicações').fill('10')
        button = frame.get_by_role('button', name='Comparar 6 sequências')
        button.wait_for(state='visible', timeout=30000)
        assert button.is_enabled()
        start = time.perf_counter()
        button.click()
        frame.get_by_role('heading', name='Comparação de sequências').wait_for(timeout=90000)
        rows = frame.locator('.cr-card').last.locator('tbody tr').count()
        assert rows == 6, rows
        print(f'SIMULATION_OK sequences={rows} replications=10 elapsed_s={time.perf_counter()-start:.3f}')
        page.screenshot(path=str(OUT / 'simular-resultado.png'))

        linked = page.evaluate("""async () => {
          const response = await fetch('/unificado/mapa/api/unified/pcp-session', {credentials:'same-origin'});
          if (!response.ok) return false;
          const data = await response.json();
          localStorage.setItem('pcp_token', data.access_token);
          localStorage.setItem('pcp_user', JSON.stringify(data.usuario));
          return Boolean(data.access_token);
        }""")
        assert linked, 'Vínculo PCP de Ricardo indisponível'
        for name, view, expected in NEIGHBORS:
            frame = open_view(page, view)
            assert expected in frame.url and 'login.html' not in frame.url, (name, frame.url)
            if name == 'pcp':
                frame.get_by_text('PROGRAMADO VS REALIZADO POR SETOR').wait_for(timeout=30000)
            page.screenshot(path=str(OUT / ('regressao-' + name + '.png')))
            print('NEIGHBOR_OK', name, frame.url)
        context.close()
        browser.close()


if __name__ == '__main__':
    main()
