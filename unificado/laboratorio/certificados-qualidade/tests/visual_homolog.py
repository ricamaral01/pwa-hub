"""Authenticated layout captures from the isolated homolog gateway."""
import subprocess
from pathlib import Path
from playwright.sync_api import sync_playwright
from homolog_flow import BASE, REMOTE


def main():
    token=subprocess.run(['ssh','vps-concrefer','/opt/concrefer-unificado/homolog-next/mapa-api/.venv/bin/python','-'],
                         input=REMOTE,text=True,capture_output=True,check=True).stdout.strip()
    out=Path(__file__).resolve().parents[4]/'docs'/'certificado-qualidade'/'evidencias'
    out.mkdir(parents=True,exist_ok=True)
    with sync_playwright() as p:
        browser=p.chromium.launch(headless=True,executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe')
        for width,height,label in [(1440,1000,'desktop'),(390,844,'mobile')]:
            ctx=browser.new_context(viewport={'width':width,'height':height},service_workers='block')
            ctx.add_cookies([{'name':'unificado_homolog_laboratorio_session','value':token,
                              'domain':'concrefer.concretrack.com.br','path':'/unificado/laboratorio/','secure':True},
                             {'name':'mapa_unificado_homolog_session','value':token,
                              'domain':'concrefer.concretrack.com.br','path':'/unificado/','secure':True}])
            page=ctx.new_page();page.goto(BASE+'/unificado/laboratorio/certificados-qualidade/',wait_until='networkidle')
            assert page.locator('h1').inner_text()=='Emitir certificado'
            assert page.locator('#items tr').count()==1
            page.screenshot(path=str(out/f'emitir-{label}.png'),full_page=True)
            page.get_by_role('button',name='Histórico').first.click()
            page.locator('#history').wait_for()
            page.screenshot(path=str(out/f'historico-{label}.png'),full_page=True)
            print(label,'home/history okay')
            if label=='desktop':
                page.evaluate("localStorage.setItem('pwa_mapa_auth_session_v1',JSON.stringify({id:'user-ricardo',role:'GERENCIA',name:'Ricardo'}))")
                page.goto(BASE+'/unificado/',wait_until='domcontentloaded')
                page.locator('#sidebar-model-a .sb-switcher-btn').click()
                page.get_by_role('menuitemradio',name='Laboratório').click()
                page.wait_for_function("document.querySelector('#sidebar-model-a')?.textContent?.includes('Ensaio de postes')",timeout=15000)
                page.get_by_role('link',name='Certificados de qualidade').first.wait_for(timeout=5000)
                page.get_by_role('link',name='Certificados de qualidade').first.click()
                page.frame_locator('#module-host iframe.is-active').get_by_role('heading',name='Emitir certificado').wait_for(timeout=5000)
                page.screenshot(path=str(out/'navegacao-unificado-desktop.png'),full_page=True)
                print('unificado menu/iframe: OK')
            ctx.close()
        browser.close()


if __name__=='__main__':main()
