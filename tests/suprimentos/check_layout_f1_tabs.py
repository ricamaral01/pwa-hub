"""Audita todas as abas da ficha do fornecedor pela casca autenticada."""
from __future__ import annotations
import json
import os
import time
from pathlib import Path
from playwright.sync_api import sync_playwright
from check_layout_shell import SIZES, AUDIT_JS, context_for, active_frame, menu_state
from check_layout_f1_detail import STATE, STATIC, destination, static_snapshot

OUT=Path('docs/porting/suprimentos/capturas/f1-abas')
TABS=('documentos','homologacao','avaliacao','compras')

def main():
    OUT.mkdir(parents=True,exist_ok=True)
    passwords=json.loads(Path('C:/Users/Admin/Downloads/suprimentos-homolog-logins-20261025.json').read_text(encoding='utf-8'))
    results=[]
    with sync_playwright() as pw:
        browser=pw.chromium.launch(headless=True)
        for width,height in SIZES:
            for zoom in (100,125):
                for attempt in range(5):
                    try:
                        ctx=context_for(browser,'e2e-suprimentos-compras',width,height,zoom,passwords,'')
                        break
                    except RuntimeError as exc:
                        if 'HTTP 503' not in str(exc) or attempt==4:raise
                        time.sleep(2*(attempt+1))
                ctx.route('https://fonts.googleapis.com/**',lambda route:route.fulfill(status=200,content_type='text/css',body=''))
                ctx.route('https://fonts.gstatic.com/**',lambda route:route.fulfill(status=200,content_type='font/woff2',body=''))
                ctx.route('**/unificado/**',static_snapshot)
                page=ctx.new_page(); errors=[]; missing=[]
                page.on('pageerror',lambda e:errors.append(str(e)))
                page.on('console',lambda m:errors.append(m.text) if m.type=='error' else None)
                page.on('response',lambda r:missing.append(r.url) if r.status==404 and any(ext in r.url for ext in ('.js','.css','.woff','.png')) else None)
                page.goto(destination('fornecedor',STATE['fornecedores'][0]),wait_until='commit',timeout=60000)
                frame=active_frame(page)
                frame.locator('.tab[data-tab="cadastro"].active').wait_for(timeout=120000)
                for tab in TABS:
                    errors.clear();missing.clear()
                    frame.locator(f'.tab[data-tab="{tab}"]').click()
                    frame.locator(f'.tab[data-tab="{tab}"].active').wait_for(timeout=120000)
                    frame.locator('#supplier-tab').wait_for(state='visible')
                    page.wait_for_function("!document.querySelector('#module-host')?.classList.contains('is-loading')",timeout=30000)
                    for menu in ('aberto','recolhido'):
                        menu_state(page,menu)
                        shell=page.evaluate(AUDIT_JS)
                        inner=next(f for f in page.frames if '/unificado/suprimentos/' in f.url).evaluate(AUDIT_JS)
                        intentional=lambda x:x['scroll'] and not x['outside'] and x['element'].startswith(('div.table-scroll','div.tabs','nav.tabs'))
                        bad=[x for x in shell['entries']+inner['entries'] if not x['contained'] and not intentional(x)]
                        name=f'{tab}-{width}x{height}-z{zoom}-{menu}'
                        page.screenshot(path=str(OUT/(name+'.png')),timeout=10000)
                        results.append({'tab':tab,'size':f'{width}x{height}','zoom':zoom,'menu':menu,
                                        'shellHorizontal':shell['horizontal'],'iframeHorizontal':inner['horizontal'],
                                        'uncontained':bad,'errors':list(errors),'missing':list(missing),'screenshot':name+'.png'})
                    print(tab,f'{width}x{height}',zoom,flush=True)
                    (OUT/'diagnostico-partial.json').write_text(json.dumps(results,ensure_ascii=False),encoding='utf-8')
                ctx.close()
        browser.close()
    (OUT/'diagnostico.json').write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf-8')
    bad=[r for r in results if r['shellHorizontal'] or r['iframeHorizontal'] or r['uncontained'] or r['errors'] or r['missing']]
    print('F1_TABS_LAYOUT',len(results),'FALHAS',len(bad))
    if bad:
        for r in bad[:6]:print(r['tab'],r['size'],r['zoom'],r['menu'],r['uncontained'][:2],r['errors'][:1])
        raise SystemExit(1)

if __name__=='__main__':main()
