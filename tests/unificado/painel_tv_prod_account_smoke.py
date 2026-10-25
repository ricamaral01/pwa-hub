"""Read-only production access test for the created TV service account."""
import json
import subprocess
import time
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
    cur.execute("SELECT id,updated_at FROM public.usuarios WHERE id='tv-producao' AND ativo AND NOT primeiro_acesso")
    row = cur.fetchone()
signer = URLSafeTimedSerializer(env['MAPA_AUTH_SIGNING_KEY'], salt='mapa-login-v1')
print(signer.dumps({'scope':'tv_session','id':row[0],'updated_at':row[1].isoformat()}))
'''
cookie = subprocess.run(['ssh', 'vps-staging',
    '/opt/concrefer-unificado/mapa-api/.venv/bin/python', '-'],
    input=REMOTE, text=True, capture_output=True, check=True).stdout.strip()
with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    tv = browser.new_context(ignore_https_errors=True)
    tv.add_cookies([{'name':'mapa_unificado_session','value':cookie,
                    'domain':'concrefer.concretrack.com.br','path':'/unificado/',
                    'secure':True,'httpOnly':True,'sameSite':'Lax'}])
    me = tv.request.get(API + '/unified/screen-access/me')
    page = tv.request.get(BASE + '/unificado/tv/formas/')
    summary = tv.request.get(BASE + '/unificado/painel-tv/api/resumo?unidade=pederneiras')
    pcp = tv.request.get(BASE + '/unificado/pcp/')
    mapa = tv.request.get(BASE + '/unificado/mapa/operacao/?tela=LIBERACAO')
    quality = tv.request.get(BASE + '/unificado/qualidade/')
    cookie_row = next(c for c in tv.cookies() if c['name'] == 'mapa_unificado_session')
    age_days = round((cookie_row['expires'] - time.time()) / 86400, 1)
    result = {'screens':me.json().get('screens'),'tv':page.status,'api':summary.status,
              'pcp':pcp.status,'mapa':mapa.status,'qualidade':quality.status,
              'session_days':age_days}
    print(json.dumps(result, ensure_ascii=False))
    assert result['screens'] == ['tvFormas']
    assert page.status == summary.status == 200
    assert all(r.status in (401,403) for r in (pcp,mapa,quality))
    assert 29.9 <= age_days <= 30.1
    browser.close()
