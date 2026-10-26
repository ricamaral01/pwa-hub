"""Authenticated, read-only CQ navigation smoke on stage or production."""
from __future__ import annotations

import os
import subprocess
from pathlib import Path

import requests
from playwright.sync_api import sync_playwright


TARGET = os.getenv('CQ_NAV_TARGET', 'stage')
assert TARGET in {'stage', 'production'}
BASE = 'https://concrefer.concretrack.com.br' + (':18446' if TARGET == 'stage' else '')
COOKIE_DOMAIN = 'concrefer.concretrack.com.br'
OUTPUT = Path('docs/certificado-qualidade/evidencias/navegacao-20261026') / TARGET
REMOTE = r'''
from pathlib import Path
import psycopg
from itsdangerous import URLSafeTimedSerializer
values={}
for line in Path('/etc/concrefer-unificado/homolog/mapa-auth.env').read_text().splitlines():
 if '=' in line and not line.startswith('#'):
  k,v=line.split('=',1);values[k]=v.strip().strip('"').strip("'")
with psycopg.connect(values['MAPA_AUTH_DATABASE_URL']) as conn:
 with conn.cursor() as cur:
  cur.execute("SELECT id,updated_at FROM public.usuarios WHERE id='user-ricardo' AND ativo")
  row=cur.fetchone()
print(URLSafeTimedSerializer(values['MAPA_AUTH_SIGNING_KEY'],salt='mapa-login-v1').dumps({'scope':'session','id':row[0],'updated_at':row[1].isoformat()}))
'''


def main() -> None:
    remote = REMOTE.replace('/etc/concrefer-unificado/homolog/mapa-auth.env',
                            '/etc/concrefer-unificado/homolog/mapa-auth.env'
                            if TARGET == 'stage' else '/etc/mapa-unificado/auth.env')
    python = ('/opt/concrefer-unificado/homolog-next/mapa-api/.venv/bin/python'
              if TARGET == 'stage' else '/opt/concrefer-unificado/mapa-api/.venv/bin/python')
    mapa_cookie = ('mapa_unificado_homolog_session' if TARGET == 'stage'
                   else 'mapa_unificado_session')
    lab_cookie = ('unificado_homolog_laboratorio_session' if TARGET == 'stage'
                  else 'unificado_laboratorio_session')
    result = subprocess.run(
        ['ssh', 'vps-staging', python, '-'],
        input=remote, text=True, capture_output=True, check=True)
    token = result.stdout.strip()
    session = requests.Session()
    session.cookies.set(mapa_cookie, token,
                        domain=COOKIE_DOMAIN, path='/unificado/')
    response = session.post(BASE + '/unificado/mapa/api/unified/laboratorio-bootstrap', timeout=15)
    assert response.status_code == 200, f'bootstrap {response.status_code}'
    root = BASE + '/unificado/laboratorio/certificados-qualidade/'
    for suffix in ('', '?tab=historico', '?tab=cadastros', 'api/config', 'api/certificados'):
        response = session.get(root + suffix, timeout=15)
        assert response.status_code == 200, f'{suffix}: {response.status_code} {response.text[:80]}'
        print('GET', suffix or '/', response.status_code)

    OUTPUT.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True,
            executable_path=os.getenv('CHROME_PATH', r'C:\Program Files\Google\Chrome\Application\chrome.exe'))
        for width, height in ((1366, 768), (390, 844)):
            context = browser.new_context(viewport={'width': width, 'height': height},
                                          ignore_https_errors=True, service_workers='block')
            context.add_cookies([
                {'name': mapa_cookie, 'value': token,
                 'domain': COOKIE_DOMAIN, 'path': '/unificado/', 'secure': True},
                {'name': lab_cookie,
                 'value': session.cookies.get(lab_cookie),
                 'domain': COOKIE_DOMAIN, 'path': '/unificado/laboratorio/', 'secure': True},
            ])
            context.add_init_script("localStorage.setItem('pwa_mapa_auth_session_v1',JSON.stringify({id:'user-ricardo',role:'GERENCIA',name:'Ricardo'}))")
            page = context.new_page()
            failures = []
            page.on('console', lambda message: failures.append(message.text) if message.type == 'error' else None)
            page.goto(BASE + '/unificado/?view=laboratorio%2Fcertificados-qualidade%2F',
                      wait_until='domcontentloaded', timeout=30000)
            frame = page.frame_locator('#module-host iframe.is-active')
            frame.locator('#account').get_by_text('Ricardo', exact=False).wait_for(timeout=20000)
            assert frame.locator('.sidebar').count() == 0
            assert frame.locator('.view-tabs .nav').count() == 3
            assert frame.locator('#notice.error').is_hidden()
            assert page.evaluate('document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1')
            page.screenshot(path=str(OUTPUT / f'qualidade-{width}x{height}.png'), full_page=True)
            if width > 600:
                page.get_by_role('link', name='Histórico de certificados').click()
            else:
                frame.locator('.view-tabs [data-view="historico"]').click()
            frame.locator('#historico').wait_for()
            assert frame.locator('#historico').is_visible()
            assert frame.locator('#notice.error').is_hidden()
            print('shell', width, height, 'no nested sidebar, history loaded')
            assert not failures, failures
            context.close()
        browser.close()


if __name__ == '__main__':
    main()
