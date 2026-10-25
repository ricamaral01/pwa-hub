"""Authenticated production TV smoke; generated cookies never leave process memory."""
import json
import subprocess
from playwright.sync_api import sync_playwright

BASE = 'https://concrefer.concretrack.com.br'
REMOTE = r'''
from pathlib import Path
import psycopg
from itsdangerous import URLSafeTimedSerializer

env = {}
for line in Path('/etc/mapa-unificado/auth.env').read_text().splitlines():
    if '=' in line and not line.startswith('#'):
        key, value = line.split('=', 1)
        env[key] = value.strip().strip('"').strip("'")
with psycopg.connect(env['MAPA_AUTH_DATABASE_URL']) as conn, conn.cursor() as cur:
    cur.execute("SELECT id,updated_at FROM public.usuarios WHERE id='user-ricardo' AND ativo")
    row = cur.fetchone()
signer = URLSafeTimedSerializer(env['MAPA_AUTH_SIGNING_KEY'], salt='mapa-login-v1')
print(signer.dumps({'scope':'session','id':row[0],'updated_at':row[1].isoformat()}))
'''
cookie = subprocess.run(['ssh', 'vps-staging',
    '/opt/concrefer-unificado/mapa-api/.venv/bin/python', '-'],
    input=REMOTE, text=True, capture_output=True, check=True).stdout.strip()
with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(viewport={'width': 1920, 'height': 1080},
                                  ignore_https_errors=True)
    context.add_cookies([{'name': 'mapa_unificado_session', 'value': cookie,
                          'domain': 'concrefer.concretrack.com.br',
                          'path': '/unificado/', 'secure': True,
                          'httpOnly': True, 'sameSite': 'Lax'}])
    page = context.new_page()
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    response = page.goto(BASE + '/unificado/tv/formas/?unidade=pederneiras',
                         wait_until='domcontentloaded', timeout=30000)
    page.wait_for_function("document.querySelectorAll('.setor').length === 4", timeout=30000)
    summary = context.request.get(BASE + '/unificado/painel-tv/api/resumo?unidade=pederneiras')
    data = summary.json()
    page.get_by_role('button', name='Setor 1').click()
    page.wait_for_function("document.querySelector('.det') !== null")
    page.get_by_role('button', name='Visão geral').click()
    page.get_by_role('button', name='Pausar').click()
    paused = page.get_by_role('button', name='Continuar').count() == 1
    print(json.dumps({'page': response.status, 'api': summary.status,
                      'day': data.get('data'), 'sectors': len(data.get('setores', [])),
                      'total': data.get('total', {}).get('programadas'),
                      'carousel_pause': paused, 'page_errors': errors}, ensure_ascii=False))
    assert response.status == summary.status == 200
    assert len(data['setores']) == 4 and paused and not errors
    browser.close()
