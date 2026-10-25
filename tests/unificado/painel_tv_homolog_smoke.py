"""TV isolation and API checks against the existing isolated test vhost."""

from pathlib import Path
import sys

from playwright.sync_api import sync_playwright

sys.path.insert(0, str(Path(__file__).resolve().parent))
from homolog_session import test_cookie_for

BASE = 'https://concrefer.concretrack.com.br:18446'

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(ignore_https_errors=True)
    context.add_cookies([{'name': 'mapa_unificado_homolog_session',
                          'value': test_cookie_for('tv-producao'),
                          'domain': 'concrefer.concretrack.com.br',
                          'path': '/unificado/', 'httpOnly': True,
                          'secure': True, 'sameSite': 'Lax'}])
    request = context.request
    root = request.get(BASE + '/unificado/tv/formas/')
    summary = request.get(BASE + '/unificado/painel-tv/api/resumo?unidade=pederneiras&data=2026-10-15')
    invalid_unit = request.get(BASE + '/unificado/painel-tv/api/resumo?unidade=ribeirao&data=2026-10-15')
    production = request.get(BASE + '/unificado/mapa/operacao/?tela=LIBERACAO')
    planning = request.get(BASE + '/unificado/pcp/')
    quality = request.get(BASE + '/unificado/qualidade/')
    ged = request.get(BASE + '/unificado/ged/')
    me = request.get(BASE + '/unificado/mapa/api/unified/screen-access/me')
    print({'tv': root.status, 'api': summary.status,
           'other_unit': invalid_unit.status, 'producao': production.status,
           'pcp': planning.status, 'qualidade': quality.status,
           'ged': ged.status, 'ged_url': ged.url, 'me_status': me.status,
           'me_keys': list(me.json()), 'ged_access': me.json().get('ged_access'),
           'ged_is_html': '<html' in ged.text().lower()})
    assert root.status == summary.status == 200
    assert invalid_unit.status == 422
    assert all(result.status in (401, 403) for result in (production, planning, quality))
    assert me.json().get('screens') == ['tvFormas']
    browser.close()
