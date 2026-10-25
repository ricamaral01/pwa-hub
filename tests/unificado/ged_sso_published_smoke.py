"""Browser smoke for the published GED-only identity bridge; prints no credentials."""
import subprocess
from playwright.sync_api import sync_playwright

BASE = 'https://concrefer.concretrack.com.br'
CHROME = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
ROUTES = ('dashboard', 'documents', 'approvals', 'tasks', 'calibrations')

def session(user_id):
    code = '''from app import connect,signer
with connect() as conn,conn.cursor() as cur:
 cur.execute('SELECT id,updated_at FROM public.usuarios WHERE id=%s',('USER_ID',))
 u=cur.fetchone()
print(signer().dumps({'scope':'session','id':u['id'],'updated_at':u['updated_at'].isoformat()}))
'''.replace('USER_ID', user_id)
    return subprocess.check_output(
        ['ssh','-o','ConnectTimeout=5','vps-staging',
         "bash -lc 'set -a; . /etc/mapa-unificado/auth.env; cd /opt/concrefer-unificado/mapa-api; .venv/bin/python -'"],
        input=code, text=True, timeout=12).strip()

def context_for(browser, user_id, role='GERENCIA'):
    context = browser.new_context(service_workers='block', viewport={'width':1440,'height':900})
    context.add_cookies([{'name':'mapa_unificado_session','value':session(user_id),
       'domain':'concrefer.concretrack.com.br','path':'/unificado/',
       'secure':True,'httpOnly':True,'sameSite':'Lax'}])
    page=context.new_page()
    page.goto(BASE+'/unificado/login.html',wait_until='domcontentloaded',timeout=20000)
    page.evaluate("user => localStorage.setItem('pwa_mapa_auth_session_v1',JSON.stringify(user))",
                  {'id':user_id,'role':role,'name':user_id})
    return context,page

def main():
    with sync_playwright() as p:
        browser=p.chromium.launch(headless=True,executable_path=CHROME)
        context,page=context_for(browser,'user-ricardo')
        page.goto(BASE+'/unificado/?view=ged/dashboard',wait_until='domcontentloaded',timeout=20000)
        for route in ROUTES:
            page.locator(f'#sidebar [data-ged-route="{route}"]').click(timeout=12000)
            frame=page.frame_locator('#module-host iframe.is-active')
            frame.locator('main').wait_for(timeout=12000)
            assert not frame.get_by_text('Bem-vindo',exact=True).count(), route
            assert not frame.get_by_text('Você ainda não tem acesso ao GED. Peça ao administrador.').count(), route
            page.reload(wait_until='domcontentloaded',timeout=20000)
            frame=page.frame_locator('#module-host iframe.is-active')
            frame.locator('main').wait_for(timeout=12000)
            assert not frame.get_by_text('Bem-vindo',exact=True).count(), route+' reload'
            print(route,'and reload OK')
        context.close()
        context,page=context_for(browser,'marcelo')
        page.goto(BASE+'/unificado/?view=ged/dashboard',wait_until='domcontentloaded',timeout=20000)
        page.wait_for_timeout(2000)
        assert page.locator('.unificado-access-denied').is_visible()
        assert not page.get_by_text('Bem-vindo',exact=True).count()
        assert page.locator('#module-host iframe.is-active').count()==0
        print('unlinked without GED screen: shell denies; no GED login')
        context.close()
        context,page=context_for(browser,'e2e-gerencia-probe')
        page.goto(BASE+'/unificado/?view=ged/dashboard',wait_until='domcontentloaded',timeout=20000)
        page.locator('#sidebar [data-ged-route="dashboard"]').click(timeout=12000)
        frame=page.frame_locator('#module-host iframe.is-active')
        frame.get_by_text('Você ainda não tem acesso ao GED. Peça ao administrador.').wait_for(timeout=12000)
        assert not frame.get_by_text('Bem-vindo',exact=True).count()
        print('unlinked with GED menu: access notice; no GED login')
        context.close()
        browser.close()

if __name__=='__main__': main()
