"""Convite por categoria e situação, pela casca e API de :18446."""
from __future__ import annotations
import json
import os
from pathlib import Path
from playwright.sync_api import sync_playwright
from check_layout_shell import AUDIT_JS,context_for,active_frame,menu_state
from check_layout_f1_detail import destination,static_snapshot

OUT=Path('docs/porting/suprimentos/capturas/f1-convite')

def main():
    OUT.mkdir(parents=True,exist_ok=True)
    ids=json.loads(Path(os.environ['TEMP'],'sup-f1-category-demo-ids.json').read_text(encoding='utf-8'))
    tokens=json.loads(Path(os.environ['TEMP'],'sup-f1-smoke-sessions.json').read_text(encoding='utf-8'))
    sizes=((1440,900),(820,1180),(390,844),(360,780))
    results=[]
    with sync_playwright() as pw:
        browser=pw.chromium.launch(headless=True)
        for width,height in sizes:
            for zoom in (100,125):
                ctx=context_for(browser,'e2e-suprimentos-compras',width,height,zoom,{},tokens['e2e-suprimentos-compras'])
                ctx.route('https://fonts.googleapis.com/**',lambda route:route.fulfill(status=200,content_type='text/css',body=''))
                ctx.route('https://fonts.gstatic.com/**',lambda route:route.fulfill(status=200,content_type='font/woff2',body=''))
                ctx.route('**/unificado/**',static_snapshot)
                page=ctx.new_page();errors=[];missing=[];forbidden=[]
                page.on('pageerror',lambda e:errors.append(str(e)))
                page.on('console',lambda m:errors.append(m.text) if m.type=='error' else None)
                page.on('response',lambda r:missing.append(r.url) if r.status==404 and any(ext in r.url for ext in ('.js','.css','.woff','.png')) else None)
                page.on('response',lambda r:forbidden.append({'status':r.status,'path':r.url.split('?',1)[0]}) if r.status>=400 else None)
                page.goto(destination('cotacao',ids['cotacao']),wait_until='commit',timeout=60000)
                frame=active_frame(page)
                select=frame.locator('#invite-supplier'); select.wait_for(timeout=120000)
                options=select.locator('option').evaluate_all('(nodes)=>nodes.map(n=>n.value)')
                assert len(options)>=3 and ids['fornecedor_epi'] not in options,(len(options),options)
                status=frame.locator('#invite-status')
                status.select_option('EM_QUALIFICACAO')
                assert select.locator('option').count()==0
                assert frame.locator('[data-do="invite"]').is_disabled()
                status.select_option('HOMOLOGADO')
                assert select.locator('option').count()>=3
                assert frame.locator('[data-do="invite"]').is_enabled()
                status.select_option('')
                for menu in ('aberto','recolhido'):
                    menu_state(page,menu)
                    shell=page.evaluate(AUDIT_JS)
                    inner=next(f for f in page.frames if '/unificado/suprimentos/' in f.url).evaluate(AUDIT_JS)
                    intentional=lambda x:x['scroll'] and not x['outside'] and x['element'].startswith(('div.table-scroll','div.tabs','nav.tabs'))
                    bad=[x for x in shell['entries']+inner['entries'] if not x['contained'] and not intentional(x)]
                    name=f'convite-{width}x{height}-z{zoom}-{menu}'
                    page.screenshot(path=str(OUT/(name+'.png')),full_page=True,timeout=20000)
                    results.append({'size':f'{width}x{height}','zoom':zoom,'menu':menu,
                        'opcoes_categorias':len(options),'epi_excluido':ids['fornecedor_epi'] not in options,
                        'filtro_situacao':True,'shellHorizontal':shell['horizontal'],
                        'iframeHorizontal':inner['horizontal'],'uncontained':bad,
                        'errors':list(errors),'missing':list(missing),'forbidden':list(forbidden),'screenshot':name+'.png'})
                print(width,height,zoom,flush=True)
                ctx.close()
        browser.close()
    (OUT/'diagnostico.json').write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf-8')
    # A casca consulta o painel do Mapa mesmo quando a conta só possui Suprimentos.
    # O 403 dessa rota externa é esperado; erros do módulo continuam reprovando.
    shell_mapa='/unificado/mapa/api/rest/v1/rpc/rpc_dashboard_produtividade_resumo_v1'
    bad=[]
    for r in results:
        expected_shell_403=(len(r['forbidden'])==1 and r['forbidden'][0]['status']==403
                            and r['forbidden'][0]['path'].endswith(shell_mapa))
        module_errors=r['errors']
        if expected_shell_403:
            module_errors=[e for e in module_errors if not e.startswith('Failed to load resource: the server responded with a status of 403')]
        if (r['shellHorizontal'] or r['iframeHorizontal'] or r['uncontained'] or module_errors
                or r['missing'] or (r['forbidden'] and not expected_shell_403)):
            bad.append(r)
    print('F1_INVITE_UI',len(results),'FALHAS',len(bad))
    if bad:raise SystemExit(1)

if __name__=='__main__':main()
