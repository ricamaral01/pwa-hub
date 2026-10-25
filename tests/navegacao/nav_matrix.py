"""Capture legacy and new navigation across modules and approved viewports."""

import json
import subprocess
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'unificado/laboratorio/certificados-qualidade/tests'))
from homolog_flow import REMOTE  # noqa: E402

CHROME = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
HOST = 'concrefer.concretrack.com.br'
CAPTURES = ROOT / 'docs/navegacao/capturas'
CAPTURES.mkdir(parents=True, exist_ok=True)
SIZES = [('celular',390,844),('tablet-retrato',820,1180),
         ('tablet-paisagem',1180,820),('desktop',1440,900)]


def token_for(environment):
    source = REMOTE if environment == 'homolog' else REMOTE.replace(
        '/etc/concrefer-unificado/homolog/mapa-auth.env', '/etc/mapa-unificado/auth.env')
    python = ('/opt/concrefer-unificado/homolog-next/mapa-api/.venv/bin/python'
              if environment == 'homolog' else
              '/opt/concrefer-unificado/mapa-api/.venv/bin/python')
    return subprocess.run(['ssh','vps-concrefer',python,'-'],input=source,
                          text=True,capture_output=True,check=True).stdout.strip()


def main():
    environment = sys.argv[1]
    assert environment in ('production-before','homolog-after','production-after')
    is_homolog = environment == 'homolog-after'
    base = f'https://{HOST}' + (':18446' if is_homolog else '') + '/unificado/'
    token = token_for('homolog' if is_homolog else 'production')
    report = {}
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(executable_path=CHROME, headless=True)
        for size,width,height in SIZES:
            context = browser.new_context(viewport={'width':width,'height':height},
                                          is_mobile=width<768,has_touch=width<1280,
                                          service_workers='block')
            context.add_cookies([{'name':'mapa_unificado_homolog_session' if is_homolog else
                                  'mapa_unificado_session','value':token,'domain':HOST,
                                  'path':'/unificado/','secure':True,'httpOnly':True,
                                  'sameSite':'Lax'}])
            page = context.new_page()
            page.goto(base+'login.html',wait_until='domcontentloaded')
            page.evaluate("localStorage.setItem('pwa_mapa_auth_session_v1', JSON.stringify({id:'user-ricardo',role:'GERENCIA',name:'Ricardo'}))")
            page.goto(base+'?view=mapa%2Foperacao%2F%3Ftela%3DLIBERACAO_S3',
                      wait_until='domcontentloaded')
            page.wait_for_function("!document.body.classList.contains('unificado-permissions-loading')",
                                   timeout=30000)
            page.wait_for_function('window.UnificadoSidebarModelA?.snapshot()?.allowedModuleIds?.length',
                                   timeout=30000)
            if environment != 'production-before':
                page.wait_for_function("document.body.classList.contains('nav-modern-ready')")
                if width<768:page.get_by_role('button',name='Abrir telas').click()
                elif width<1280:page.get_by_role('button',name='Abrir painel de telas').click()
            modules = page.evaluate('window.UnificadoSidebarModelA.snapshot().allowedModuleIds')
            report[size] = {}
            for module in modules:
                if environment == 'production-before':
                    page.evaluate('(module) => window.UnificadoSidebarModelA.selectModule(module)',module)
                    page.wait_for_timeout(200)
                elif width<768 or width>=1280:
                    if width>=1280:page.get_by_role('button',name='Selecionar módulo').click()
                    page.locator('.nav-module-chip').filter(has_text=page.evaluate(
                        '(module) => module === "ged" ? "GED" : MENU_CONFIG[module].label',module)
                    ).first.click()
                else:
                    page.locator(f'.nav-rail-item[aria-label="'+page.evaluate(
                        '(module) => module === "ged" ? "GED" : MENU_CONFIG[module].label',module)+'"]').click()
                page.wait_for_timeout(100)
                name = f'{size}-{environment}-{module}.png'
                page.screenshot(path=str(CAPTURES/name))
                metrics = page.evaluate('''() => ({documentWidth:document.documentElement.scrollWidth,
                    viewport:innerWidth,units:document.querySelectorAll('.nav-unit').length,
                    groups:document.querySelectorAll('.nav-group').length,
                    items:document.querySelectorAll('.nav-tree .nav-item').length,
                    update:document.querySelector('.nav-footer')?.innerText,
                    allowed:window.UnificadoSidebarModelA.snapshot().allowedItemIds.length})''')
                assert metrics['documentWidth']<=width+1,(environment,size,module,metrics)
                if environment != 'production-before':
                    assert (metrics['items']>0 or metrics['groups']>0 or metrics['units']>0), (
                        environment,size,module,metrics)
                    if module!='producao':assert metrics['units']==0,(size,module,metrics)
                report[size][module] = metrics
            context.close()
        browser.close()
    out = CAPTURES/f'matrix-{environment}.json'
    out.write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
    print(environment, sum(map(len,report.values())), 'captures',out)


if __name__=='__main__':main()
