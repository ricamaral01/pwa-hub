"""Read-only and expired-session checks using existing test users, no account edits."""
import json
import subprocess
from playwright.sync_api import expect, sync_playwright
from maodeobra_stage2_homolog import BASE, credentials
from maodeobra_stage3_homolog import sql


def consultation_token():
    user_id = int(sql("SELECT id FROM usuarios WHERE username='consulta' AND ativo;"))
    script = f'''from datetime import datetime, timedelta, timezone
from pathlib import Path
from jose import jwt
values = {{}}
for line in Path('/etc/concrefer-unificado/homolog/pcp.env').read_text().splitlines():
    if '=' in line and not line.startswith('#'):
        key, value = line.split('=',1)
        values[key] = value.strip().strip('"').strip("'")
now = datetime.now(timezone.utc)
print(jwt.encode({{'sub':'{user_id}','exp':now+timedelta(minutes=10),
  'session_epoch_ms':int(now.timestamp()*1000)}}, values['SECRET_KEY'],algorithm='HS256'))
'''
    result = subprocess.run(['ssh','vps-staging',
        '/opt/concrefer-unificado/homolog-next/pcp-api/.venv-py310/bin/python','-'],
        input=script,text=True,capture_output=True,check=True)
    return user_id, result.stdout.strip()


def run():
    account = credentials()
    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True,
            ignore_https_errors=True)
        page = context.new_page()
        page.goto(BASE+'/unificado/login.html?next=pcp/maodeobra/',wait_until='domcontentloaded')
        page.locator('#unificado-login-form [name="username"]').fill(account['PCP_TEST_USER'])
        page.locator('#unificado-login-form [name="password"]').fill(account['PCP_TEST_PASSWORD'])
        page.locator('#unificado-login-form button[type="submit"]').click()
        page.wait_for_url('**/unificado/?view=pcp%2Fmaodeobra%2F',timeout=20000)
        frame = page.frame_locator('#module-host iframe.is-active')
        root = frame.locator('#mdo-mobile')
        expect(root.locator('.activity-card')).to_have_count(7,timeout=15000)
        frame.locator('#mdo-m-date').fill('2099-10-21')
        expect(root.locator('.date-box')).to_contain_text('2099',timeout=15000)
        root.locator('.activity-card input').first.fill('1,5')
        admin_token = frame.locator('body').evaluate("() => API.getToken()")
        frame.locator('body').evaluate("() => localStorage.setItem('pcp_token','expired-token')")
        page.reload(wait_until='domcontentloaded')
        page.wait_for_url('**/unificado/login.html?next=*',timeout=20000)
        assert 'pcp%2Fmaodeobra%2F' in page.url
        page.locator('#unificado-login-form [name="username"]').fill(account['PCP_TEST_USER'])
        page.locator('#unificado-login-form [name="password"]').fill(account['PCP_TEST_PASSWORD'])
        page.locator('#unificado-login-form button[type="submit"]').click()
        page.wait_for_url('**/unificado/?view=pcp%2Fmaodeobra%2F',timeout=20000)
        expect(root.locator('.activity-card')).to_have_count(7,timeout=20000)
        frame.locator('#mdo-m-date').fill('2099-10-21')
        expect(root.locator('.date-box')).to_contain_text('2099',timeout=15000)
        assert root.locator('.activity-card input').first.input_value() == '1,5'
        recovered = frame.locator('body').evaluate("() => API.getToken()")
        assert recovered and recovered != 'expired-token'
        print(json.dumps({'expired_session_recovered':True,'draft_preserved':True}))

        user_id, token = consultation_token()
        frame.locator('body').evaluate("""(_, data) => {
          localStorage.setItem('pcp_token',data.token);
          localStorage.setItem('pcp_user',JSON.stringify({id:data.id,nome:'Consulta',nivel_acesso:'CONSULTA'}));
          location.reload();
        }""", {'id':user_id,'token':token})
        page.wait_for_timeout(1500)
        expect(frame.locator('body')).to_contain_text('Você não tem acesso a esta tela',timeout=20000)
        forbidden = page.evaluate("""async () => {
          const body = {data:'2099-10-21',grupo_setor:'12',sem_producao:false,itens:[]};
          const response = await fetch('/unificado/pcp/api/maodeobra/grupo',{
            method:'POST',headers:{'Content-Type':'application/json',
              Authorization:`Bearer ${localStorage.getItem('pcp_token')}`,'X-Unificado-Screen':'maodeobra'},
            body:JSON.stringify(body)});
          return response.status;
        }""")
        assert forbidden == 403, forbidden
        print(json.dumps({'consulta_screen_denied':True,'write_status':forbidden}))
        # Repor o token apenas neste contexto descartável evita interferir nos demais testes.
        page.evaluate("(_, token) => localStorage.setItem('pcp_token',token)",admin_token)
        browser.close()


if __name__ == '__main__': run()
