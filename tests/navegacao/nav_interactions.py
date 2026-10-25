"""Read-only navigation interaction checks on the isolated homologation shell."""

import json
from playwright.sync_api import sync_playwright
from nav_matrix import CHROME, HOST, token_for

BASE=f'https://{HOST}:18446/unificado/'


def page_for(browser,width,height,token):
    context=browser.new_context(viewport={'width':width,'height':height},
                                is_mobile=width<768,has_touch=width<1280,
                                service_workers='block')
    context.add_cookies([{'name':'mapa_unificado_homolog_session','value':token,
                          'domain':HOST,'path':'/unificado/','secure':True,
                          'httpOnly':True,'sameSite':'Lax'}])
    page=context.new_page()
    page.goto(BASE+'login.html',wait_until='domcontentloaded')
    page.evaluate("localStorage.setItem('pwa_mapa_auth_session_v1', JSON.stringify({id:'user-ricardo',role:'GERENCIA',name:'Ricardo'}))")
    page.goto(BASE+'?view=mapa%2Foperacao%2F%3Ftela%3DLIBERACAO_S3',
              wait_until='domcontentloaded')
    page.wait_for_function("document.body.classList.contains('nav-modern-ready')")
    return context,page


def main():
    token=token_for('homolog')
    result={}
    with sync_playwright() as playwright:
        browser=playwright.chromium.launch(executable_path=CHROME,headless=True)
        context,page=page_for(browser,390,844,token)
        assert page.locator('.nav-mobile-top').is_visible()
        assert page.locator('.nav-mobile-bottom').is_visible()
        assert page.locator('.nav-mobile-bottom .nav-bottom-action').count()==4
        assert page.locator('.nav-quick-chip').count()>=2
        page.get_by_role('button',name='Abrir telas').click()
        assert page.locator('.nav-modern').is_visible()
        assert page.locator('.nav-panel-close svg').count()==1
        assert page.locator('.nav-panel-close').evaluate("button => getComputedStyle(button.querySelector('svg')).width")=='22px'
        assert page.locator('.nav-unit-toggle').count()==1
        assert page.locator('.nav-unit-toggle svg.nav-chevron').count()==1
        # Homologation IAM grants Ricardo neither Usinas nor the Pederneiras
        # screens; the navigation must not expose their links or empty groups.
        assert page.locator('.nav-rail-item[aria-label="Usinas"]').count()==0
        assert page.locator('.nav-unit-toggle').count()==1
        assert page.locator('.nav-tree [data-item-id^="pdr"]').count()==0
        assert page.locator('.nav-unit-toggle').first.get_attribute('aria-expanded')=='true'
        assert page.locator('.nav-unit-toggle .nav-chevron').evaluate(
            "icon => getComputedStyle(icon).transform")=='matrix(-1, 0, 0, -1, 0, 0)'
        page.locator('.nav-unit-toggle').first.click()
        assert page.locator('.nav-unit-toggle').first.get_attribute('aria-expanded')=='false'
        page.wait_for_timeout(220)
        assert page.locator('.nav-unit-toggle .nav-chevron').evaluate(
            "icon => getComputedStyle(icon).transform")=='none'
        page.reload(wait_until='domcontentloaded')
        page.wait_for_function("document.body.classList.contains('nav-modern-ready')")
        page.get_by_role('button',name='Abrir telas').click()
        # The active route reopens its ancestors on every page load.
        assert page.locator('.nav-unit-toggle').first.get_attribute('aria-expanded')=='true'
        page.get_by_role('button',name='Recolher tudo').click()
        assert page.locator('.nav-unit-toggle').first.get_attribute('aria-expanded')=='false'
        page.get_by_role('button',name='Expandir tudo').click()
        assert page.locator('.nav-unit-toggle').first.get_attribute('aria-expanded')=='true'
        assert page.locator('.nav-tree .nav-group-toggle').count()==4
        assert page.locator('.nav-tree .nav-group-toggle svg.nav-chevron').count()==4
        page.locator('.nav-search').fill('Dashboard Defeitos')
        assert page.locator('.nav-tree .nav-search-result').count()==1
        assert 'Produção' in page.locator('.nav-tree .nav-search-result small').inner_text()
        page.locator('.nav-search').fill('')
        page.locator('.nav-module-chip').filter(has_text='Qualidade').click()
        assert page.locator('.nav-tree .nav-unit').count()==0
        assert page.locator('.nav-tree .nav-group-toggle').count()>=1
        page.locator('.nav-module-chip').filter(has_text='Produção').click()
        page.locator('.nav-tree .nav-item[data-item-id="dashDefeitos"]').click()
        page.wait_for_function("new URLSearchParams(location.search).get('view')?.includes('DASHBOARD_DEFEITOS')")
        assert not page.locator('.nav-modern').is_visible()
        page.locator('.nav-mobile-bottom .nav-bottom-action[data-mode="recentes"]').click()
        assert page.locator('.nav-search-result').count()>=2
        assert 'Dashboard Defeitos' in page.locator('.nav-tree').inner_text()
        page.keyboard.press('Escape')
        assert not page.locator('.nav-modern').is_visible()
        page.locator('.nav-mobile-bottom .nav-bottom-action[data-mode="telas"]').click()
        page.go_back(wait_until='domcontentloaded')
        assert not page.locator('.nav-modern').is_visible()
        assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
        result['mobile']='top/bottom, unit/group, search, route, recent, Esc/back, width'
        context.close()

        context,page=page_for(browser,820,1180,token)
        assert page.locator('.nav-rail').is_visible()
        page.get_by_role('button',name='Abrir painel de telas').click()
        assert page.locator('.nav-panel').is_visible()
        page.locator('.nav-panel-close').click()
        assert not page.locator('.nav-panel').is_visible()
        page.reload(wait_until='domcontentloaded')
        page.wait_for_function("document.body.classList.contains('nav-modern-ready')")
        assert not page.locator('.nav-panel').is_visible()
        page.get_by_role('button',name='Abrir painel de telas').click()
        assert page.locator('.nav-panel').is_visible()
        result['tablet']='rail, panel toggle, persisted closed state'
        context.close()

        context,page=page_for(browser,1440,900,token)
        assert page.locator('.nav-panel').is_visible()
        page.get_by_role('button',name='Selecionar módulo').click()
        assert page.locator('.nav-module-area').is_visible()
        assert page.locator('.nav-module-switcher svg.nav-switcher-chevron').count()==1
        page.locator('.nav-module-chip').filter(has_text='Laboratório').click()
        assert not page.locator('.nav-module-area').is_visible()
        assert 'Laboratório' in page.locator('.nav-module-switcher').inner_text()
        page.locator('.nav-panel-close').click()
        assert not page.locator('.nav-panel').is_visible()
        page.reload(wait_until='domcontentloaded')
        page.wait_for_function("document.body.classList.contains('nav-modern-ready')")
        assert not page.locator('.nav-panel').is_visible()
        result['desktop']='collapse, persisted state'
        context.close()
        browser.close()
    print(json.dumps(result,ensure_ascii=False,indent=2))


if __name__=='__main__':main()
