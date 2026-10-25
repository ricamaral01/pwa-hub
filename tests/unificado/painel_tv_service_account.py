"""Provision and verify the TV-only account through the isolated test user API.

Passwords and cookies stay in process memory and are never printed.
"""

import json
import secrets
from pathlib import Path
import sys

from playwright.sync_api import sync_playwright

sys.path.insert(0, str(Path(__file__).resolve().parent))
from homolog_session import test_cookies

BASE = 'https://concrefer.concretrack.com.br:18446'
ORIGIN = BASE
API = BASE + '/unificado/mapa/api'

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    admin = browser.new_context(ignore_https_errors=True)
    admin.add_cookies([{'name': 'mapa_unificado_homolog_session',
                        'value': test_cookies()['ricardo'],
                        'domain': 'concrefer.concretrack.com.br',
                        'path': '/unificado/', 'httpOnly': True,
                        'secure': True, 'sameSite': 'Lax'}])
    admin_probe = admin.request.get(API + '/unified/screen-access/me')
    assert admin_probe.status == 200, f'admin session: HTTP {admin_probe.status}'
    password = secrets.token_urlsafe(32)
    response = admin.request.post(API + '/unified/guests',
        data={'login': 'tv-producao', 'name': 'Painel TV — Formas',
              'password': password, 'sector': 'Todos'},
        headers={'Origin': ORIGIN})
    assert response.status == 201, f'guest create: HTTP {response.status} {response.text()[:160]}'
    response = admin.request.patch(API + '/unified/users/tv-producao',
        data={'name': 'Painel TV — Formas', 'role': 'CONVIDADO',
              'sector': 'Todos', 'screens': ['tvFormas'],
              'actions': {'tvFormas': ['view']}},
        headers={'Origin': ORIGIN})
    assert response.status == 200, f'guest grant: HTTP {response.status} {response.text()[:200]}'
    tv = browser.new_context(ignore_https_errors=True)
    response = tv.request.post(API + '/unified/login',
        data={'username': 'tv-producao', 'password': password})
    assert response.status == 200, f'first login: HTTP {response.status}'
    token = response.json().get('first_access_token')
    assert token, 'first-access token absent'
    new_password = secrets.token_urlsafe(32)
    response = tv.request.post(API + '/first-access',
        data={'token': token, 'password': new_password})
    assert response.status == 200, f'first access: HTTP {response.status}'
    response = tv.request.get(API + '/unified/screen-access/me')
    assert response.status == 200, f'TV session: HTTP {response.status}'
    screens = response.json().get('screens')
    assert screens == ['tvFormas'], f'TV screens: {screens}'
    permitted = tv.request.get(BASE + '/unificado/painel-tv/api/resumo?unidade=pederneiras&data=2026-10-15')
    denied = tv.request.get(BASE + '/unificado/pcp/')
    assert permitted.status == 200, f'TV summary: HTTP {permitted.status}'
    assert denied.status in (401, 403), f'PCP should deny TV account: HTTP {denied.status}'
    print(json.dumps({'account': 'tv-producao', 'screens': screens,
                      'tv_status': permitted.status, 'pcp_status': denied.status,
                      'session_max_age': [c for c in tv.cookies() if c['name'].startswith('mapa_unificado')][0]['expires']},
                     ensure_ascii=False))
    browser.close()
