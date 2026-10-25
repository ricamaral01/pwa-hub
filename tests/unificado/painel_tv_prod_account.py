"""Create the authorized TV-only production account through Unificado's user flow.

No password or cookie is printed or persisted. Ricardo can reset the service
password in the Unificado user screen before installing the TV.
"""
import json
import secrets
import time
import subprocess
from playwright.sync_api import sync_playwright

BASE = 'https://concrefer.concretrack.com.br'
API = BASE + '/unificado/mapa/api'
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
    admin = browser.new_context(ignore_https_errors=True)
    admin.add_cookies([{'name':'mapa_unificado_session','value':cookie,
                        'domain':'concrefer.concretrack.com.br','path':'/unificado/',
                        'secure':True,'httpOnly':True,'sameSite':'Lax'}])
    assert admin.request.get(API + '/unified/screen-access/me').status == 200
    temporary = secrets.token_urlsafe(32)
    response = admin.request.post(API + '/unified/guests',
        data={'login':'tv-producao','name':'Painel TV — Formas',
              'password':temporary,'sector':'Todos'},
        headers={'Origin':BASE})
    assert response.status == 201, f'create HTTP {response.status}'
    response = admin.request.patch(API + '/unified/users/tv-producao',
        data={'name':'Painel TV — Formas','role':'CONVIDADO','sector':'Todos',
              'screens':['tvFormas'],'actions':{'tvFormas':['view']}},
        headers={'Origin':BASE})
    assert response.status == 200, f'grant HTTP {response.status}'
    tv = browser.new_context(ignore_https_errors=True)
    response = tv.request.post(API + '/unified/login',
        data={'username':'tv-producao','password':temporary})
    assert response.status == 200, f'first login HTTP {response.status}'
    token = response.json().get('first_access_token')
    assert token, 'first access token absent'
    response = tv.request.post(API + '/first-access',
        data={'token':token,'password':secrets.token_urlsafe(32)})
    assert response.status == 200, f'first access HTTP {response.status}'
    me = tv.request.get(API + '/unified/screen-access/me')
    assert me.status == 200 and me.json().get('screens') == ['tvFormas']
    assert me.json().get('ged_access') is False
    tv_page = tv.request.get(BASE + '/unificado/tv/formas/')
    tv_api = tv.request.get(BASE + '/unificado/painel-tv/api/resumo?unidade=pederneiras')
    pcp = tv.request.get(BASE + '/unificado/pcp/')
    mapa = tv.request.get(BASE + '/unificado/mapa/operacao/?tela=LIBERACAO')
    quality = tv.request.get(BASE + '/unificado/qualidade/')
    assert tv_page.status == tv_api.status == 200
    assert all(r.status in (401,403) for r in (pcp,mapa,quality))
    session = next(c for c in tv.cookies() if c['name'] == 'mapa_unificado_session')
    age_days = round((session['expires'] - time.time()) / 86400, 1)
    assert 29.9 <= age_days <= 30.1, f'session age {age_days}'
    print(json.dumps({'account':'tv-producao','screens':me.json()['screens'],
                      'tv_page':tv_page.status,'tv_api':tv_api.status,
                      'pcp':pcp.status,'mapa':mapa.status,
                      'qualidade':quality.status,'ged_access':False,
                      'session_days':age_days},ensure_ascii=False))
    browser.close()
