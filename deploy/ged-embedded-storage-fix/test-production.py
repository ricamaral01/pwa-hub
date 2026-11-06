"""Read-only browser check of GED with full localStorage; prints no session token."""
import subprocess

from playwright.sync_api import sync_playwright

BASE = 'https://concrefer.concretrack.com.br'
CHROME = r'C:\Program Files\Google\Chrome\Application\chrome.exe'


def short_session(user_id: str) -> str:
    script = """from app import connect,signer
with connect() as conn,conn.cursor() as cur:
 cur.execute('SELECT id,updated_at,ativo,primeiro_acesso,deleted_at FROM public.usuarios WHERE id=%s',(USER_ID,))
 u=cur.fetchone()
assert u and u['ativo'] and not u['primeiro_acesso'] and u['deleted_at'] is None
print(signer().dumps({'scope':'session','id':u['id'],'updated_at':u['updated_at'].isoformat()}))
""".replace('USER_ID', repr(user_id))
    return subprocess.check_output(
        ['ssh', 'vps-concrefer',
         "bash -lc 'set -a; . /etc/mapa-unificado/auth.env; cd /opt/concrefer-unificado/mapa-api; .venv/bin/python -'"],
        input=script, text=True, encoding='utf-8', timeout=15,
    ).strip()


def check(user_id: str) -> None:
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True, executable_path=CHROME)
        context = browser.new_context(service_workers='block')
        context.add_cookies([{
            'name': 'mapa_unificado_session', 'value': short_session(user_id),
            'domain': 'concrefer.concretrack.com.br', 'path': '/unificado/',
            'secure': True, 'httpOnly': True, 'sameSite': 'Lax',
        }])
        page = context.new_page()
        page.goto(BASE + '/unificado/login.html', wait_until='domcontentloaded')
        page.evaluate("""userId => {
            localStorage.setItem('pwa_mapa_auth_session_v1',
                JSON.stringify({id:userId,role:'GERENCIA',name:userId}));
            let lo=0, hi=6*1024*1024;
            while (lo+1<hi) {
                const mid=(lo+hi)>>1;
                try {localStorage.setItem('ged-storage-probe','X'.repeat(mid));lo=mid}
                catch {hi=mid}
            }
        }""", user_id)
        writable = page.evaluate("""() => {
            try {localStorage.setItem('ged_token','Y'.repeat(1000));return true}
            catch {return false}
        }""")
        assert not writable, 'O armazenamento local não ficou cheio.'
        page.goto(BASE + '/unificado/?view=ged/calibrations', wait_until='domcontentloaded')
        frame = page.frame_locator('#module-host iframe.is-active')
        frame.locator('main h1').wait_for(timeout=20000)
        heading = frame.locator('main h1').first.text_content()
        assert 'calibra' in heading.lower(), heading
        assert not frame.get_by_text('Você ainda não tem acesso ao GED.').count()
        print(user_id, 'GED aberto com armazenamento local cheio')
        context.close()
        browser.close()


if __name__ == '__main__':
    for user_id in ('user-ricardo', 'ilson'):
        check(user_id)
