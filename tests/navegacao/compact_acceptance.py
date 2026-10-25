"""Check the compact navigation and update flow against a deployed shell."""

import json
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright
from nav_matrix import CHROME, HOST, SIZES, token_for

ROOT = Path(__file__).resolve().parents[2]
CAPTURES = ROOT / 'docs/navegacao/capturas'
TARGET_VERSION = (ROOT / 'unificado/VERSION').read_text(encoding='utf-8').strip()


def main():
    environment = sys.argv[1] if len(sys.argv) > 1 else 'homolog'
    assert environment in {'homolog', 'production'}
    base = f'https://{HOST}' + (':18446' if environment == 'homolog' else '') + '/unificado/'
    token = token_for(environment)
    result = {}
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(executable_path=CHROME, headless=True)
        for label, width, height in SIZES:
            context = browser.new_context(viewport={'width': width, 'height': height},
                                          is_mobile=width < 768, has_touch=width < 1280,
                                          service_workers='block')
            context.add_cookies([{'name': 'mapa_unificado_homolog_session' if environment == 'homolog'
                                  else 'mapa_unificado_session', 'value': token, 'domain': HOST,
                                  'path': '/unificado/', 'secure': True, 'httpOnly': True,
                                  'sameSite': 'Lax'}])
            page = context.new_page()
            page.goto(base + 'login.html', wait_until='domcontentloaded')
            page.evaluate("localStorage.setItem('pwa_mapa_auth_session_v1', JSON.stringify({id:'user-ricardo',role:'GERENCIA',name:'Ricardo'}))")
            page.goto(base + '?view=mapa%2Foperacao%2F%3Ftela%3DLIBERACAO_S3',
                      wait_until='domcontentloaded')
            page.wait_for_function("document.body.classList.contains('nav-modern-ready')")
            page.wait_for_function("window.UnificadoSidebarModelA.snapshot().updateState==='current'")
            if width < 768:
                page.get_by_role('button', name='Abrir telas').click()
                assert page.locator('.nav-close-icon').is_visible()
            elif width < 1280:
                assert page.locator('.nav-rail-logo').is_visible()
                page.get_by_role('button', name='Abrir painel de telas').click()
                assert page.locator('.nav-close-icon').is_visible()
            else:
                assert page.locator('.nav-collapse-icon').is_visible()
            assert page.locator('.nav-brand-logo').is_visible()
            assert page.locator('.nav-brand-logo').evaluate('img => img.naturalWidth > 0')
            assert page.locator('.nav-footer .nav-update').is_visible()
            assert page.locator('.nav-footer .nav-update').inner_text().strip() == 'Atualizar'
            assert page.locator('.nav-footer .nav-update-version').is_visible()
            if width >= 768:
                assert page.locator('.nav-footer .nav-help-toggle').is_visible()
                page.locator('.nav-footer .nav-help-toggle').click()
                assert page.locator('.nav-footer .nav-help-menu').is_visible()
                assert 'Como funciona' in page.locator('.nav-footer .nav-help-menu').inner_text()
                assert 'Relatar problema' in page.locator('.nav-footer .nav-help-menu').inner_text()
                page.locator('.nav-footer .nav-help-toggle').click()
            if width >= 768:
                page.get_by_role('button', name='Expandir tudo').click()
            metrics = page.evaluate('''() => {
              const tree=document.querySelector('.nav-tree');
              const bounds=tree.getBoundingClientRect();
              return {horizontal:document.documentElement.scrollWidth-innerWidth,
                footerHeight:Math.round(document.querySelector('.nav-footer').getBoundingClientRect().height),
                treeTop:Math.round(bounds.top),treeBottom:Math.round(bounds.bottom),
                itemBounds:[...tree.querySelectorAll('.nav-item')].slice(0,12).map(item=>[
                  item.textContent.trim(),Math.round(item.getBoundingClientRect().top),
                  Math.round(item.getBoundingClientRect().bottom)]),
                visibleItems:[...tree.querySelectorAll('.nav-item')].filter(item=>{
                  const rect=item.getBoundingClientRect();
                  return rect.height>0 && rect.top>=bounds.top && rect.bottom<=bounds.bottom;
                }).length};
            }''')
            assert metrics['horizontal'] <= 1, (label, metrics)
            assert metrics['footerHeight'] <= 155, (label, metrics)
            if width >= 768:
                assert metrics['visibleItems'] >= 10, (label, metrics)
            if width < 768:
                page.locator('.nav-panel-close').click()
                page.locator('.nav-mobile-bottom [data-mode="conta"]').click()
                assert page.locator('.nav-tree .nav-update').is_visible()
                assert page.locator('.nav-tree .nav-update-version').is_visible()
                page.locator('.nav-tree .nav-help-toggle').click()
                assert 'Como funciona' in page.locator('.nav-tree .nav-help-menu').inner_text()
                assert 'Relatar problema' in page.locator('.nav-tree .nav-help-menu').inner_text()
            elif width >= 1280:
                page.locator('.nav-panel-close').click()
                assert page.locator('.nav-rail-logo').is_visible()
                assert page.locator('.nav-rail-update').is_visible()
            else:
                assert page.locator('.nav-rail-update').is_visible()
            page.screenshot(path=str(CAPTURES / f'{label}-{environment}-compact-{TARGET_VERSION}.png'))
            result[label] = metrics
            context.close()

        # Verify user link gating and the update states without mutating IAM data.
        context = browser.new_context(viewport={'width': 1440, 'height': 900}, service_workers='block')
        context.add_cookies([{'name': 'mapa_unificado_homolog_session' if environment == 'homolog'
                              else 'mapa_unificado_session', 'value': token, 'domain': HOST,
                              'path': '/unificado/', 'secure': True, 'httpOnly': True,
                              'sameSite': 'Lax'}])
        page = context.new_page()
        page.goto(base + 'login.html', wait_until='domcontentloaded')
        page.evaluate("localStorage.setItem('pwa_mapa_auth_session_v1', JSON.stringify({id:'user-ricardo',role:'GERENCIA',name:'Ricardo'}))")
        page.goto(base, wait_until='domcontentloaded')
        page.wait_for_function("document.body.classList.contains('nav-modern-ready')")
        page.wait_for_function("window.UnificadoSidebarModelA.snapshot().updateState==='current'")
        def without_users(route):
            response = route.fetch()
            data = response.json()
            data['screens'] = [item for item in data.get('screens', [])
                               if item not in {'prodUsuarios', 'pcpUsuarios'}]
            route.fulfill(response=response, json=data)
        page.route('**/unificado/mapa/api/unified/screen-access/me', without_users)
        page.reload(wait_until='domcontentloaded')
        page.wait_for_function("document.body.classList.contains('nav-modern-ready')")
        assert page.locator('.nav-footer-links').get_by_text('Usuários').count() == 0
        page.unroute('**/unificado/mapa/api/unified/screen-access/me')
        page.reload(wait_until='domcontentloaded')
        page.wait_for_function("window.UnificadoSidebarModelA.snapshot().updateState==='current'")
        current = page.evaluate('window.UnificadoSidebarModelA.snapshot().version')
        major, minor, patch = map(int, current.split('.'))
        next_version = f'{major}.{minor}.{patch+1}'
        page.route('**/unificado/VERSION?*', lambda route: route.fulfill(status=200, body=next_version + '\n'))
        page.evaluate('window.UnificadoSidebarModelA.checkUpdate()')
        page.wait_for_function("window.UnificadoSidebarModelA.snapshot().updateState==='available'")
        assert next_version in page.locator('.nav-footer .nav-update').inner_text()
        assert page.locator('.nav-footer .nav-update').evaluate('button => getComputedStyle(button).backgroundColor') == 'rgb(246, 139, 60)'
        page.unroute('**/unificado/VERSION?*')
        page.route('**/unificado/VERSION?*', lambda route: route.abort())
        page.locator('.nav-footer .nav-update').click()
        page.wait_for_function("window.UnificadoSidebarModelA.snapshot().updateState==='failed'")
        assert 'Falhou' in page.locator('.nav-footer .nav-update').inner_text()
        page.locator('.nav-footer .nav-update').click()
        page.wait_for_selector('.nav-footer .nav-update-reset')
        page.unroute('**/unificado/VERSION?*')
        page.route('**/unificado/VERSION?*', lambda route: route.fulfill(status=200, body=current + '\n'))
        page.evaluate('''() => {
          navigator.serviceWorker.getRegistration=async()=>({update:async()=>
            sessionStorage.setItem('nav-sw-update-called','1')});
        }''')
        page.locator('.nav-footer .nav-update').click()
        page.wait_for_selector('.unificado-update-toast')
        assert current in page.locator('.unificado-update-toast').inner_text()
        assert page.evaluate("sessionStorage.getItem('nav-sw-update-called')") == '1'
        result['update'] = 'available, failed twice, recovery, no-new-version reload and toast'
        context.close()
        browser.close()
    (CAPTURES / f'compact-acceptance-{environment}-{TARGET_VERSION}.json').write_text(
        json.dumps(result, ensure_ascii=False, indent=2), encoding='utf-8')
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
