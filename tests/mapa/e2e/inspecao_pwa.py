"""Dedicated inspection PWA: mobile/tablet layout and shared database actions."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
import os
from playwright.sync_api import expect, sync_playwright

ROOT = Path(__file__).resolve().parents[3]
CHROME = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
os.chdir(ROOT)
server = ThreadingHTTPServer(('127.0.0.1', 0), SimpleHTTPRequestHandler)
Thread(target=server.serve_forever, daemon=True).start()
url = f'http://127.0.0.1:{server.server_port}/unificado/m/inspecao/'
records = []


def api(route):
    req = route.request
    path = req.url.split('/unificado/mapa/api/', 1)[1]
    if path == 'me':
        return route.fulfill(json={'ok': True})
    if path == 'unified/screen-access/me':
        return route.fulfill(json={'ok': True, 'screens': ['inspecao']})
    if path.startswith('rest/v1/producao'):
        sector = 'Setor 4' if 'Setor+4' in path or 'Setor%204' in path else 'Setor 3'
        row = ({'id': 'prod-4', 'data_fabricacao': '2026-10-20', 'setor': sector,
                'forma': 'F12', 'modelo': '11/300', 'status': 'LIBERADO'} if sector == 'Setor 4'
               else {'id': 'prod-3', 'data_fabricacao': '2026-10-20', 'setor': sector,
                     'forma': 'SC05', 'modelo': '9x200', 'status': 'LIBERADO'})
        return route.fulfill(json=[row])
    if path.startswith('pcp/saques-mandril'):
        return route.fulfill(json=[{'data':'2026-10-20','codigo_forma':'SC05'}]
                             if '2026-10-20' in path else [])
    if path.startswith('rest/v1/inspecao_defeitos'):
        if req.method == 'GET':
            return route.fulfill(json=records)
        if req.method == 'POST':
            records.append({**req.post_data_json, 'id': 'test-1'})
        elif req.method == 'PATCH':
            records[0].update(req.post_data_json)
        elif req.method == 'DELETE':
            records.clear()
        return route.fulfill(status=204, body='')
    return route.fulfill(status=404)


try:
    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True, executable_path=CHROME)
        for width, height in [(320, 720), (390, 844), (768, 1024), (1024, 768)]:
            context = browser.new_context(viewport={'width': width, 'height': height}, service_workers='block')
            page = context.new_page()
            errors = []
            page.on('pageerror', lambda err: errors.append(str(err)))
            page.route('**/unificado/mapa/api/**', api)
            page.route('**/unificado/mapa/operacao/inspecao-defeitos.js*',
                       lambda route: route.fulfill(path=ROOT / 'mapa-concretagem/inspecao-defeitos.js', content_type='text/javascript'))
            page.route('**/unificado/mapa/operacao/inspecao-defeitos.css*',
                       lambda route: route.fulfill(path=ROOT / 'mapa-concretagem/inspecao-defeitos.css', content_type='text/css'))
            page.goto(url)
            page.locator('#insDefApp').wait_for(state='visible')
            assert page.locator('.ins-def-drawing').count() == 17
            assert page.locator('[name="turno"]').count() == 0
            assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), width
            assert page.locator('[data-ins-tab]').count() == 3
            menu = page.locator('.pwa-menu-link')
            expect(menu).to_be_visible()
            assert menu.get_attribute('href') == './menu.html'
            assert page.evaluate('''() => Math.abs(parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--pwa-header-height')) - document.querySelector('.pwa-header').getBoundingClientRect().height) <= 1''')
            if width in (390, 768):
                out = ROOT / '.work-mapa-unificado/e2e' / f'inspecao-pwa-{width}.png'
                out.parent.mkdir(parents=True, exist_ok=True)
                page.screenshot(path=str(out), full_page=True)
            page.locator('[name="serie"]').fill(f'S3-PWA-{width}')
            if width == 768:
                page.locator('[name="setor"]').select_option('Setor 4')
            form_code = 'F12' if width == 768 else 'SC05'
            model = '11/300' if width == 768 else '9x200'
            page.locator('[name="forma_numero"]').select_option(form_code)
            assert page.locator('[name="tipo"]').input_value() == model
            page.locator('[data-code="D01"][data-region="Base"][data-step="1"]').click()
            page.locator('#insDefSalvar').click()
            expect(page.locator('#insDefMessage')).to_contain_text('salva no banco')
            page.locator('[data-ins-tab="postes"]').click()
            expect(page.locator('.ins-def-list-item')).to_have_count(1)
            assert records[0]['tipo'] == model
            assert 'turno' not in records[0]
            page.locator('[data-delete]').click()
            page.locator('[data-delete]').click()
            expect(page.locator('.ins-def-list-item')).to_have_count(0)
            assert not records
            assert not errors, errors
            if width == 768:
                menu.click()
                page.wait_for_url(f'http://127.0.0.1:{server.server_port}/unificado/m/inspecao/menu.html')
                expect(page.locator('#pwa-menu-frame')).to_have_attribute('src', '/unificado/')
            context.close()
        browser.close()
finally:
    server.shutdown()
