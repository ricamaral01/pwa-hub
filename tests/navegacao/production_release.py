"""Deploy navigation once, verify the real SW update, and roll back on failure."""

import re
import subprocess
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright
from nav_matrix import CHROME, HOST, token_for

ROOT=Path(__file__).resolve().parents[2]
TARGET_VERSION=(ROOT/'unificado/VERSION').read_text(encoding='utf-8').strip()
BASE=f'https://{HOST}/unificado/'
BACKUP_PATTERN=re.compile(r'/opt/concrefer-unificado/backups/navigation-production-20\d{6}T\d{6}Z')


def remote(*args):
    result=subprocess.run(['ssh','vps-concrefer',*args],text=True,
                          capture_output=True,timeout=180)
    print(result.stdout.strip(),flush=True)
    if result.returncode:
        print(result.stderr.strip(),file=sys.stderr,flush=True)
        raise RuntimeError('Remote command failed')
    return result.stdout


def main():
    backup=None
    token=token_for('production')
    with sync_playwright() as playwright:
        browser=playwright.chromium.launch(executable_path=CHROME,headless=True)
        context=browser.new_context(viewport={'width':1440,'height':900})
        context.add_cookies([{'name':'mapa_unificado_session','value':token,
                              'domain':HOST,'path':'/unificado/','secure':True,
                              'httpOnly':True,'sameSite':'Lax'}])
        page=context.new_page()
        page.goto(BASE+'login.html',wait_until='domcontentloaded')
        page.evaluate("localStorage.setItem('pwa_mapa_auth_session_v1', JSON.stringify({id:'user-ricardo',role:'GERENCIA',name:'Ricardo'}))")
        page.goto(BASE,wait_until='domcontentloaded')
        page.wait_for_selector('#sidebar-model-a .sb-update',state='attached',timeout=30000)
        page.wait_for_function("window.UnificadoSidebarModelA?.snapshot()?.updateState==='current'")
        old=page.evaluate('window.UnificadoSidebarModelA.snapshot().version')
        old_modern=page.evaluate("document.body.classList.contains('nav-modern-ready')")
        if old_modern:page.wait_for_selector('.nav-footer .nav-update-check')
        assert old!=TARGET_VERSION,(old,TARGET_VERSION)
        page.evaluate('navigator.serviceWorker.ready')
        print(f'Old shell {old}; service worker ready',flush=True)
        try:
            output=remote('bash','/tmp/navigation_shell.sh','production')
            match=BACKUP_PATTERN.search(output)
            assert match,output
            backup=match.group(0)
            page.evaluate('window.UnificadoSidebarModelA.checkUpdate()')
            page.wait_for_function("window.UnificadoSidebarModelA.snapshot().updateState==='available'",
                                   timeout=30000)
            update_button=page.locator('.nav-footer .nav-update' if old_modern else
                                       '#sidebar-model-a .sb-update')
            assert TARGET_VERSION in update_button.inner_text()
            update_button.click()
            page.wait_for_function('''target => window.UnificadoSidebarModelA?.snapshot()?.version===target &&
                document.body.classList.contains('nav-modern-ready')''',arg=TARGET_VERSION,
                timeout=90000)
            assert page.locator('.nav-unit-toggle').count()==2
            assert page.locator('.nav-rail-item[aria-label="Usinas"]').count()==1
            assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
            (ROOT/'docs/navegacao/capturas/desktop-atualizacao-sucesso-producao.png').parent.mkdir(
                parents=True,exist_ok=True)
            page.screenshot(path=str(ROOT/'docs/navegacao/capturas/desktop-atualizacao-sucesso-producao.png'))
            print(f'Real SW update {old} -> {TARGET_VERSION}: OK',flush=True)
            matrix=subprocess.run([sys.executable,str(ROOT/'tests/navegacao/nav_matrix.py'),
                                   'production-after'],cwd=ROOT,text=True,capture_output=True,
                                  timeout=180)
            print(matrix.stdout.strip(),flush=True)
            if matrix.returncode:
                print(matrix.stderr,file=sys.stderr,flush=True)
                raise RuntimeError('Production viewport/module matrix failed')
            print(f'Production backup: {backup}',flush=True)
        except Exception:
            if backup:
                print('Post-deploy verification failed; rolling production back',flush=True)
                remote('bash','/tmp/navigation_rollback.sh',backup)
            raise
        finally:
            context.close();browser.close()


if __name__=='__main__':main()
