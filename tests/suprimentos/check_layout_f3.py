"""F3 na casca real, com login e matriz PC/tablet/celular/zoom/menu."""
import json,os,time
from pathlib import Path
from urllib.parse import quote
from playwright.sync_api import sync_playwright
from check_layout_shell import ROOT,SIZES,AUDIT_JS,context_for,active_frame,menu_state

OUT=Path('docs/porting/suprimentos/capturas/f3')
ACTORS=('e2e-suprimentos-almox','e2e-suprimentos-compras',
        'e2e-suprimentos-qualidade','ricardo.teste')
def main():
    OUT.mkdir(parents=True,exist_ok=True)
    receipt_id=json.loads((OUT/'demo-id.json').read_text())['id']
    passwords=json.loads(Path('C:/Users/Admin/Downloads/suprimentos-homolog-logins-20261025.json').read_text(encoding='utf-8'))
    actors=os.getenv('SUP_F3_ACTORS',','.join(ACTORS)).split(',')
    token=(Path(os.environ['TEMP'],'suprimentos-layout-ricardo-token').read_text().strip()
           if 'ricardo.teste' in actors else '')
    sizes=[tuple(map(int,s.split('x'))) for s in os.getenv('SUP_F3_SIZES',','.join(f'{w}x{h}' for w,h in SIZES)).split(',')]
    result=[]
    with sync_playwright() as p:
        browser=p.chromium.launch(headless=True)
        for actor in actors:
            for width,height in sizes:
                for zoom in (100,125):
                    for attempt in range(4):
                        try:
                            ctx=context_for(browser,actor,width,height,zoom,passwords,token if actor=='ricardo.teste' else '')
                            break
                        except RuntimeError as e:
                            if attempt==3:raise
                            time.sleep(2*(attempt+1))
                    page=ctx.new_page();errors=[];missing=[]
                    page.on('pageerror',lambda e:errors.append(str(e)))
                    page.on('console',lambda m:errors.append(m.text) if m.type=='error' and not ('403' in m.text and 'produtividade' in m.text) else None)
                    page.on('response',lambda r:missing.append(r.url) if r.status==404 and any(ext in r.url for ext in ('.js','.css','.woff','.png')) else None)
                    routes=[('lista','recebimento/'),('detalhe','recebimento/?id='+receipt_id)]
                    if actor=='e2e-suprimentos-almox':routes.append(('novo','recebimento/'))
                    for kind,path in routes:
                        errors.clear();missing.clear()
                        url=ROOT+'/unificado/?view='+quote('suprimentos/'+path,safe='')
                        page.goto(url,wait_until='domcontentloaded',timeout=60000)
                        frame=active_frame(page)
                        frame.locator('.loading-state').wait_for(state='detached',timeout=15000) if frame.locator('.loading-state').count() else None
                        if kind=='novo':
                            frame.locator('[data-action=new]').click()
                            frame.locator('#new-rec').wait_for(timeout=15000)
                        for menu in ('aberto','recolhido'):
                            menu_state(page,menu)
                            shell=page.evaluate(AUDIT_JS)
                            inner=next(f for f in page.frames if '/unificado/suprimentos/recebimento/' in f.url).evaluate(AUDIT_JS)
                            bad=[e for e in shell['entries']+inner['entries'] if not e['contained'] and not(e['scroll'] and e['element'].startswith('div.table-scroll'))]
                            name=f'{actor}-{kind}-{width}x{height}-z{zoom}-{menu}'
                            page.screenshot(path=str(OUT/(name+'.png')),timeout=12000)
                            result.append(dict(actor=actor,kind=kind,size=f'{width}x{height}',zoom=zoom,menu=menu,
                                shellHorizontal=shell['horizontal'],iframeHorizontal=inner['horizontal'],
                                bad=bad,errors=list(errors),missing=list(missing),
                                text=frame.locator('main#app').inner_text()[:150],screenshot=name+'.png'))
                        print(actor,kind,f'{width}x{height}',zoom,flush=True)
                    ctx.close()
                    (OUT/'diagnostico-partial.json').write_text(json.dumps(result,ensure_ascii=False),encoding='utf-8')
        browser.close()
    (OUT/'diagnostico.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
    failed=[x for x in result if x['shellHorizontal'] or x['iframeHorizontal'] or x['bad'] or x['missing'] or
      any('recebimento' in e.lower() for e in x['errors']) or 'Não foi possível carregar' in x['text']]
    print('F3_LAYOUT',len(result),'FALHAS',len(failed))
    for x in failed[:5]:print(x['actor'],x['kind'],x['size'],x['zoom'],x['menu'],x['bad'][:2],x['errors'][:2],x['text'][:100])
    if failed:raise SystemExit(1)
if __name__=='__main__':main()
