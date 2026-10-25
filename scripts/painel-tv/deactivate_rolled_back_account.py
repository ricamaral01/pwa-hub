"""Change TV account state through the Unificado user API."""
import subprocess
import sys
from playwright.sync_api import sync_playwright

action = sys.argv[1] if len(sys.argv) > 1 else 'deactivate'
if action not in {'deactivate', 'reactivate'}:
    raise SystemExit('Use deactivate or reactivate')

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
cookie = subprocess.run(['ssh','vps-staging',
    '/opt/concrefer-unificado/mapa-api/.venv/bin/python','-'],
    input=REMOTE,text=True,capture_output=True,check=True).stdout.strip()
with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    admin = browser.new_context(ignore_https_errors=True)
    admin.add_cookies([{'name':'mapa_unificado_session','value':cookie,
                        'domain':'concrefer.concretrack.com.br','path':'/unificado/',
                        'secure':True,'httpOnly':True,'sameSite':'Lax'}])
    response = admin.request.post(BASE + '/unificado/mapa/api/unified/users/tv-producao/action',
        data={'action':action}, headers={'Origin':BASE})
    print(action + '_status', response.status)
    assert response.status == 200
    browser.close()
