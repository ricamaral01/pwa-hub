"""Exercise the requested TV-only login against test or production."""
import json
import sys
import time

from playwright.sync_api import sync_playwright

origin = 'https://concrefer.concretrack.com.br'
if sys.argv[1:] == ['test']:
    origin += ':18446'
elif sys.argv[1:] != ['production']:
    raise SystemExit('usage: painel_tv_short_login_smoke.py test|production')
api = origin + '/unificado/mapa/api'
unit = 'campinas'
with sync_playwright() as p:
    request = p.request.new_context(ignore_https_errors=True)
    bad = request.post(api + '/unified/login', data={'username': 'tv', 'password': 'wrong'})
    assert bad.status in (400, 401, 403), ('bad-password', bad.status)
    request.dispose()
    tv = p.request.new_context(ignore_https_errors=True)
    login = tv.post(api + '/unified/login', data={'username': 'tv', 'password': 'tv'})
    assert login.status == 200, ('login', login.status, login.text()[:180])
    me = tv.get(api + '/unified/screen-access/me')
    assert me.status == 200, ('permissions', me.status)
    permissions = me.json()
    assert permissions['screens'] == ['tvFormas'], permissions['screens']
    paths = {
        'tv': '/unificado/tv/formas/?unidade=' + unit,
        'tv_api': '/unificado/painel-tv/api/resumo?unidade=' + unit,
        'pcp': '/unificado/pcp/',
        'mapa': '/unificado/mapa/operacao/?tela=LIBERACAO',
        'qualidade': '/unificado/qualidade/',
    }
    statuses = {key: tv.get(origin + path).status for key, path in paths.items()}
    assert statuses['tv'] == statuses['tv_api'] == 200, statuses
    assert all(statuses[key] in (401, 403) for key in ('pcp', 'mapa', 'qualidade')), statuses
    cookie = next(c for c in tv.storage_state()['cookies'] if 'mapa_unificado' in c['name'] and 'session' in c['name'])
    days = (cookie['expires'] - time.time()) / 86400
    assert 29.9 <= days <= 30.1, days
    browser = p.chromium.launch(headless=True)
    visual = browser.new_context(ignore_https_errors=True, viewport={'width': 1920, 'height': 1080})
    visual.add_cookies(tv.storage_state()['cookies'])
    page = visual.new_page()
    page.goto(origin + paths['tv'], wait_until='domcontentloaded')
    page.locator('#kpis .kpi').first.wait_for(timeout=15000)
    assert 'Painel TV' in page.title(), page.title()
    assert ('Campinas' if unit == 'campinas' else 'Pederneiras') in page.locator('.brand p').inner_text()
    if unit == 'campinas':
        page.goto(origin + '/unificado/tv/formas/?unidade=pederneiras', wait_until='domcontentloaded')
        page.locator('#kpis .kpi').first.wait_for(timeout=15000)
        assert 'unidade=campinas' in page.url, page.url
    print(json.dumps({'environment': sys.argv[1], 'login': 'tv', 'screens': permissions['screens'],
                      'statuses': statuses, 'session_days': round(days, 1)}, ensure_ascii=False))
    tv.dispose()
    browser.close()
