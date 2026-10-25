"""Exercise current, available, updating, failed and recovery update UI on :18446."""

import json
from playwright.sync_api import sync_playwright
from nav_matrix import CHROME, HOST, token_for

BASE=f'https://{HOST}:18446/unificado/'


def main():
    token=token_for('homolog')
    with sync_playwright() as playwright:
        browser=playwright.chromium.launch(executable_path=CHROME,headless=True)
        context=browser.new_context(viewport={'width':1440,'height':900},service_workers='block')
        context.add_cookies([{'name':'mapa_unificado_homolog_session','value':token,
                              'domain':HOST,'path':'/unificado/','secure':True,
                              'httpOnly':True,'sameSite':'Lax'}])
        page=context.new_page()
        page.goto(BASE+'login.html',wait_until='domcontentloaded')
        page.evaluate("localStorage.setItem('pwa_mapa_auth_session_v1', JSON.stringify({id:'user-ricardo',role:'GERENCIA',name:'Ricardo'}))")
        page.goto(BASE,wait_until='domcontentloaded')
        page.wait_for_function("document.body.classList.contains('nav-modern-ready')")
        page.wait_for_function("window.UnificadoSidebarModelA.snapshot().updateState==='current'")
        assert page.locator('.nav-footer .nav-update').is_visible()
        assert page.locator('.nav-footer .nav-update').inner_text().strip()=='Atualizar'
        current=page.evaluate('window.UnificadoSidebarModelA.snapshot().version')

        page.route('**/unificado/VERSION?*',lambda route:route.abort())
        page.evaluate('window.UnificadoSidebarModelA.checkUpdate()')
        page.wait_for_function("window.UnificadoSidebarModelA.snapshot().updateState==='failed'")
        assert 'tentar de novo' in page.locator('.nav-footer .nav-update').inner_text()
        page.evaluate('window.UnificadoSidebarModelA.checkUpdate()')
        page.wait_for_selector('.nav-footer .nav-update-reset')
        page.unroute('**/unificado/VERSION?*')

        major,minor,patch=map(int,current.split('.'))
        next_version=f'{major}.{minor}.{patch+1}'
        page.route('**/unificado/VERSION?*',lambda route:route.fulfill(
            status=200,body=next_version+'\n'))
        page.evaluate('window.UnificadoSidebarModelA.checkUpdate()')
        page.wait_for_function("window.UnificadoSidebarModelA.snapshot().updateState==='available'")
        assert next_version in page.locator('.nav-footer .nav-update').inner_text()
        page.evaluate('''() => {
          const original=window.fetch;
          window.fetch=(url,options) => String(url).includes('/unificado/VERSION?update=')
            ? new Promise(() => {}) : original(url,options);
          window.UnificadoSidebarModelA.update();
        }''')
        page.wait_for_function("window.UnificadoSidebarModelA.snapshot().updateState==='updating'")
        assert 'Atualizando' in page.locator('.nav-footer .nav-update').inner_text()
        print(json.dumps({'version':current,'simulated_latest':next_version,
                          'states':['current','failed','recovery','available','updating'],
                          'always_visible_button':True},ensure_ascii=False))
        context.close();browser.close()


if __name__=='__main__':main()
