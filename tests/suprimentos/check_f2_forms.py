"""Verifica ações visíveis e formulários reais da F2 via casca autenticada."""
import json,os
from pathlib import Path
from urllib.parse import quote
from playwright.sync_api import sync_playwright
from check_layout_shell import ROOT,context_for,active_frame
from check_layout_f1_detail import static_snapshot

OUT=Path('docs/porting/suprimentos/capturas/f2-formularios')
def run():
    OUT.mkdir(parents=True,exist_ok=True)
    tokens=json.loads(Path(os.environ['TEMP'],'sup-f2-smoke-sessions.json').read_text(encoding='utf-8'))
    results=[]
    with sync_playwright() as p:
        browser=p.chromium.launch(headless=True)
        for actor in ('e2e-suprimentos-almox','e2e-suprimentos-compras'):
            for width,height in ((1440,900),(390,844)):
                ctx=context_for(browser,actor,width,height,100,{},tokens[actor])
                ctx.route('https://fonts.googleapis.com/**',lambda r:r.fulfill(status=200,content_type='text/css',body=''))
                ctx.route('https://fonts.gstatic.com/**',lambda r:r.fulfill(status=200,content_type='font/woff2',body=''))
                ctx.route('**/unificado/**',static_snapshot)
                page=ctx.new_page();page.goto(ROOT+'/unificado/?view='+quote('suprimentos/almoxarifado/',safe=''),wait_until='commit')
                frame=active_frame(page);frame.locator('h1').wait_for()
                entry=frame.locator('[data-do="entrada"]')
                if actor.endswith('almox'):
                    if not entry.is_visible():print('F2_FORM_STATE',frame.locator('body').inner_text()[:500],flush=True)
                    assert entry.is_visible();entry.click();dialog=frame.locator('.sup-stock-dialog');dialog.wait_for()
                    assert dialog.locator('select[name="material_id"] option').count()>=3
                    assert dialog.locator('select[name="endereco_id"] option').count()>=1
                    assert dialog.locator('input[name="quantidade"]').is_visible()
                    page.screenshot(path=str(OUT/f'entrada-{width}x{height}.png'),full_page=True)
                    dialog.locator('[data-cancel]').click();assert not dialog.count()
                    frame.locator('[data-tab="epi"]').click()
                    frame.locator('[data-do="issue-epi"]').wait_for(timeout=12000)
                    assert frame.locator('[data-do="issue-epi"]').is_visible()
                else:
                    assert not entry.count()
                    assert not frame.locator('[data-tab="epi"]').count()
                    assert frame.locator('[data-tab="reposicao"]').is_visible()
                    page.screenshot(path=str(OUT/f'comprador-{width}x{height}.png'),full_page=True)
                results.append({'actor':actor,'size':f'{width}x{height}','ok':True})
                ctx.close()
        browser.close()
    (OUT/'resultado.json').write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf-8')
    print('F2_FORMS',len(results),'OK')
if __name__=='__main__':run()
