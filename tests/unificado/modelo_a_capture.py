"""Capture one evidence set for the Modelo A sidebar in isolated homologation."""

import argparse
import json
from pathlib import Path

from playwright.sync_api import sync_playwright

from homolog_session import test_cookies


BASE = 'https://concrefer.concretrack.com.br:18446/unificado/'
CHROME = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
OUT = Path('docs/porting/menu-lateral-modelo-a-evidencias')


def context(browser, token, width, height, mobile=False, standalone=False):
    ctx = browser.new_context(
        viewport={'width': width, 'height': height},
        is_mobile=mobile, has_touch=mobile, service_workers='block',
    )
    ctx.add_cookies([{
        'name': 'mapa_unificado_homolog_session', 'value': token,
        'domain': 'concrefer.concretrack.com.br', 'path': '/unificado/',
        'secure': True, 'httpOnly': True, 'sameSite': 'Lax',
    }])
    if standalone:
        ctx.add_init_script("Object.defineProperty(navigator, 'standalone', {get: () => true});")
    return ctx


def open_shell(page, user_id='user-ricardo', role='GERENCIA'):
    page.goto(BASE + 'login.html', wait_until='domcontentloaded')
    page.evaluate("([id,role]) => localStorage.setItem('pwa_mapa_auth_session_v1', JSON.stringify({id,role,name:id}))", [user_id, role])
    page.goto(BASE, wait_until='domcontentloaded')
    page.wait_for_function("document.body.classList.contains('unificado-permissions-loading') === false", timeout=20000)


def capture_before(browser, token):
    for name, standalone in [('celular', False), ('pwa', True)]:
        ctx = context(browser, token, 390, 844, mobile=True, standalone=standalone)
        page = ctx.new_page()
        open_shell(page)
        page.screenshot(path=str(OUT / f'{name}-antes.png'))
        print(name, 'before', page.evaluate("document.querySelector('#sidebar')?.outerHTML.length"), flush=True)
        ctx.close()


def select_module(page, label):
    page.locator('#sidebar-model-a .sb-switcher-btn').click()
    page.get_by_role('menuitemradio', name=label).click()
    page.wait_for_function("document.querySelector('#sidebar-model-a .sb-switcher-name')?.textContent === " + json.dumps(label), timeout=20000)


def capture_after(browser, token):
    report = {}
    for name, width, height in [('pc',1440,900), ('tablet-paisagem',1024,768), ('tablet-retrato',768,1024)]:
        ctx = context(browser, token, width, height)
        page = ctx.new_page()
        page.on('pageerror', lambda error: print('pageerror', error, flush=True))
        page.on('console', lambda message: print('console', message.type, message.text, flush=True) if message.type == 'error' else None)
        page.on('response', lambda response: print('http403', response.url.split('?')[0], flush=True)
                if response.status == 403 else None)
        open_shell(page)
        pcp_session = page.evaluate("""async () => {
          const response = await fetch('/unificado/mapa/api/unified/pcp-session', {credentials:'same-origin'});
          const data = response.ok ? await response.json() : {};
          if (data.access_token && data.usuario) {
            localStorage.setItem('pcp_token', data.access_token);
            localStorage.setItem('pcp_user', JSON.stringify(data.usuario));
          }
          return {status:response.status, linked:!!data.access_token};
        }""")
        print('pcp_session', pcp_session, flush=True)
        if pcp_session['linked']:
            page.reload(wait_until='domcontentloaded')
            page.wait_for_function("document.body.classList.contains('unificado-permissions-loading') === false", timeout=20000)
        try:
            page.wait_for_selector('#sidebar-model-a .sb', timeout=10000)
        except Exception:
            print('diagnostic', page.evaluate("""() => ({
              body:document.body.className, mount:document.querySelector('#sidebar-model-a')?.outerHTML,
              bridge:!!window.UnificadoSidebarModelA,
              snapshot:window.UnificadoSidebarModelA?.snapshot(),
              scripts:[...document.scripts].map(s=>s.src),
            })"""), flush=True)
            raise
        page.evaluate("""() => {
          const banner = document.querySelector('.test-environment-bar');
          if (banner) banner.style.display = 'none';
          document.body.style.paddingTop = '0';
        }""")
        collapsed = page.locator('#sidebar-model-a .sb').evaluate("el => el.classList.contains('is-collapsed')")
        if collapsed:
            page.get_by_role('button', name='Expandir menu').click()
            page.wait_for_timeout(250)
        select_module(page, 'Laboratório')
        page.get_by_role('link', name='Monitoramento').click()
        page.wait_for_url('**/unificado/?view=laboratorio%2F', timeout=30000)
        page.wait_for_function("!document.querySelector('#module-host')?.classList.contains('is-loading')", timeout=30000)
        page.screenshot(path=str(OUT / f'{name}-aberto-laboratorio.png'))
        sidebar = page.locator('#sidebar-model-a .sb')
        open_width = sidebar.evaluate('el => el.getBoundingClientRect().width')
        page.get_by_role('button', name='Recolher menu').click()
        page.wait_for_timeout(250)
        page.screenshot(path=str(OUT / f'{name}-recolhido.png'))
        collapsed_width = sidebar.evaluate('el => el.getBoundingClientRect().width')
        if name == 'pc':
            page.locator('#sidebar-model-a .sb-link[data-tip="Monitoramento"]').hover()
            page.wait_for_selector('#sidebar-model-a .sb-tip')
            page.screenshot(path=str(OUT / 'pc-recolhido-dica.png'))
            report['tooltip'] = page.locator('#sidebar-model-a .sb-tip').inner_text()
        page.get_by_role('button', name='Expandir menu').click()
        page.wait_for_timeout(250)
        page.locator('#sidebar-model-a .sb-switcher-btn').click()
        page.screenshot(path=str(OUT / f'{name}-seletor.png'))
        page.get_by_role('menuitemradio', name='Planejamento').click()
        try:
            page.wait_for_function("new URLSearchParams(location.search).get('view') === 'pcp/dashboard/'", timeout=15000)
        except Exception:
            print('planning diagnostic', page.url, page.evaluate("""() => ({
              breadcrumb:document.querySelector('.breadcrumb')?.textContent,
              denied:document.querySelector('.unificado-access-denied')?.textContent,
              host:document.querySelector('#module-host')?.className,
            })"""), flush=True)
            raise
        scroll = page.locator('#sidebar-model-a .sb-scroll')
        metrics = scroll.evaluate('el => ({height:el.clientHeight,content:el.scrollHeight})')
        scroll.evaluate('el => {el.scrollTop = el.scrollHeight}')
        page.screenshot(path=str(OUT / f'{name}-rolagem.png'))
        scrolled = scroll.evaluate('el => el.scrollTop')
        select_module(page, 'Produção')
        page.wait_for_function("new URLSearchParams(location.search).get('view') === 'mapa/operacao/?tela=LIBERACAO'", timeout=30000)
        page.screenshot(path=str(OUT / f'{name}-planejamento-para-producao.png'))
        report[name] = {
            'open_width': open_width, 'collapsed_width': collapsed_width,
            'scroll': metrics, 'scroll_top_after': scrolled,
            'production_url': page.url.split(':18446')[-1],
            'active_items': page.locator('#sidebar-model-a .sb-link.is-active').count(),
        }
        ctx.close()
    for name, standalone in [('celular', False), ('pwa', True)]:
        ctx = context(browser, token, 390, 844, mobile=True, standalone=standalone)
        page = ctx.new_page()
        react_requests = []
        page.on('request', lambda request: react_requests.append(request.url)
                if '/shell/modelo-a/menu.js' in request.url else None)
        open_shell(page)
        page.screenshot(path=str(OUT / f'{name}-depois.png'))
        report[name] = {
            'modelo_a_visible': page.locator('#sidebar-model-a').is_visible(),
            'legacy_sidebar_visible': page.locator('#sidebar').is_visible(),
            'react_bundle_requests': len(react_requests),
        }
        ctx.close()
    (OUT / 'resultado.json').write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
    print(json.dumps(report, ensure_ascii=False, indent=2), flush=True)


def capture_permissions(browser, token):
    ctx = context(browser, token, 1440, 900)
    page = ctx.new_page()
    open_shell(page, 'conta-sem-vinculo', 'CONVIDADO')
    page.wait_for_timeout(500)
    snapshot = page.evaluate('window.UnificadoSidebarModelA?.snapshot()')
    assert 'laboratorio' not in snapshot['allowedModuleIds']
    assert not any(item.startswith('lab') for item in snapshot['allowedItemIds'])
    if page.locator('#sidebar-model-a .sb-switcher-btn').count():
        page.locator('#sidebar-model-a .sb-switcher-btn').click()
        assert page.get_by_role('menuitemradio', name='Laboratório').count() == 0
    print('permissões: Laboratório oculto para conta não Ricardo', flush=True)
    ctx.close()


def verify_reload(browser, token):
    ctx = context(browser, token, 1440, 900)
    page = ctx.new_page()
    open_shell(page)
    page.goto(BASE + '?view=ged%2Fdocuments', wait_until='domcontentloaded')
    page.wait_for_function("document.querySelector('#sidebar-model-a .sb-switcher-name')?.textContent === 'GED'", timeout=20000)
    page.wait_for_function("document.querySelector('#sidebar-model-a .sb-link.is-active')?.textContent?.trim() === 'Documentos'", timeout=20000)
    page.reload(wait_until='domcontentloaded')
    page.wait_for_function("document.querySelector('#sidebar-model-a .sb-link.is-active')?.textContent?.trim() === 'Documentos'", timeout=20000)
    linked = page.evaluate("""async () => {
      const response = await fetch('/unificado/mapa/api/unified/pcp-session', {credentials:'same-origin'});
      const data = response.ok ? await response.json() : {};
      if (!data.access_token || !data.usuario) return false;
      localStorage.setItem('pcp_token', data.access_token);
      localStorage.setItem('pcp_user', JSON.stringify(data.usuario));
      return true;
    }""")
    assert linked
    page.reload(wait_until='domcontentloaded')
    page.wait_for_function("document.querySelector('#sidebar-model-a .sb-link.is-active')?.textContent?.trim() === 'Documentos'", timeout=20000)
    select_module(page, 'Planejamento')
    page.wait_for_function("new URLSearchParams(location.search).get('view') === 'pcp/dashboard/'", timeout=30000)
    select_module(page, 'Produção')
    page.wait_for_function("new URLSearchParams(location.search).get('view') === 'mapa/operacao/?tela=LIBERACAO'", timeout=30000)
    page.reload(wait_until='domcontentloaded')
    page.wait_for_function("document.querySelector('#sidebar-model-a .sb-link.is-active')?.textContent?.trim() === 'Produção / Liberação'", timeout=30000)
    print('reload: GED Documentos e Produção / Liberação mantêm um item ativo', flush=True)
    ctx.close()


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('phase', choices=['before', 'after', 'permissions', 'reload'])
    args = parser.parse_args()
    OUT.mkdir(parents=True, exist_ok=True)
    cookies = test_cookies()
    token = cookies['unlinked'] if args.phase == 'permissions' else cookies['ricardo']
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(executable_path=CHROME, headless=True)
        try:
            {'before': capture_before, 'after': capture_after,
             'permissions': capture_permissions, 'reload': verify_reload}[args.phase](browser, token)
        finally:
            browser.close()
