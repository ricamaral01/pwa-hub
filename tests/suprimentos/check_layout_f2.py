"""Matriz F2 pela casca autenticada; recursos estáticos espelham :18446."""
import json,os
from pathlib import Path
from urllib.parse import quote
from playwright.sync_api import sync_playwright
from check_layout_shell import ROOT,SIZES,AUDIT_JS,context_for,active_frame,menu_state
from check_layout_f1_detail import static_snapshot

OUT=Path('docs/porting/suprimentos/capturas/f2')
ROUTES={'e2e-suprimentos-almox':['almoxarifado','inventario'],
        'e2e-suprimentos-compras':['almoxarifado']}

def main():
    OUT.mkdir(parents=True,exist_ok=True)
    tokens=json.loads(Path(os.environ['TEMP'],'sup-f2-smoke-sessions.json').read_text(encoding='utf-8'))
    results=[]
    with sync_playwright() as pw:
        browser=pw.chromium.launch(headless=True)
        for actor,routes in ROUTES.items():
            for width,height in SIZES:
                for zoom in (100,125):
                    ctx=context_for(browser,actor,width,height,zoom,{},tokens[actor])
                    ctx.route('https://fonts.googleapis.com/**',lambda r:r.fulfill(status=200,content_type='text/css',body=''))
                    ctx.route('https://fonts.gstatic.com/**',lambda r:r.fulfill(status=200,content_type='font/woff2',body=''))
                    ctx.route('**/unificado/**',static_snapshot)
                    page=ctx.new_page();errors=[];missing=[];forbidden=[]
                    page.on('pageerror',lambda e:errors.append(str(e)))
                    page.on('console',lambda m:errors.append(m.text) if m.type=='error' else None)
                    page.on('response',lambda r:missing.append(r.url) if r.status==404 and any(x in r.url for x in ('.js','.css','.woff','.png')) else None)
                    page.on('response',lambda r:forbidden.append(r.url.split('?',1)[0]) if r.status>=400 else None)
                    for route in routes:
                        errors.clear();missing.clear();forbidden.clear()
                        target=ROOT+'/unificado/?view='+quote('suprimentos/'+route+'/',safe='')
                        page.goto(target,wait_until='commit',timeout=60000)
                        frame=active_frame(page)
                        frame.locator('h1').wait_for(timeout=120000)
                        for menu in ('aberto','recolhido'):
                            menu_state(page,menu)
                            shell=page.evaluate(AUDIT_JS)
                            inner=next(f for f in page.frames if '/unificado/suprimentos/' in f.url).evaluate(AUDIT_JS)
                            intentional=lambda x:x['scroll'] and not x['outside'] and x['element'].startswith(('div.table-scroll','div.sup-stock-tabs'))
                            bad=[x for x in shell['entries']+inner['entries'] if not x['contained'] and not intentional(x)]
                            name=f'{actor}-{route}-{width}x{height}-z{zoom}-{menu}'
                            page.screenshot(path=str(OUT/(name+'.png')),full_page=True,timeout=20000)
                            results.append({'actor':actor,'route':route,'size':f'{width}x{height}',
                                'zoom':zoom,'menu':menu,'shellHorizontal':shell['horizontal'],
                                'iframeHorizontal':inner['horizontal'],'uncontained':bad,
                                'errors':list(errors),'missing':list(missing),
                                'forbidden':list(forbidden),'screenshot':name+'.png'})
                        print(actor,route,width,height,zoom,flush=True)
                    ctx.close()
        browser.close()
    (OUT/'diagnostico.json').write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf-8')
    mapa='/unificado/mapa/api/rest/v1/rpc/rpc_dashboard_produtividade_resumo_v1'
    bad=[]
    for r in results:
        expected=all(path.endswith(mapa) for path in r['forbidden'])
        module_errors=[e for e in r['errors'] if not (expected and e.startswith('Failed to load resource: the server responded with a status of 403'))]
        if r['shellHorizontal'] or r['iframeHorizontal'] or r['uncontained'] or r['missing'] or module_errors or not expected:bad.append(r)
    print('F2_LAYOUT',len(results),'FALHAS',len(bad))
    if bad:raise SystemExit(1)

if __name__=='__main__':main()
