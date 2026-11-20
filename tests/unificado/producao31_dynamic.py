"""Late dynamic menus update an open search without reload or another request."""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright
from producao_resume_runtime import actors,start,count
R=Path(__file__).resolve().parents[2];O=R/'docs/revisao-visual-unificado/producao-20261120/retomada-2';actor=next(a for a in actors('homolog') if a['id']=='alex');held=[];requests=[]
with sync_playwright() as pw:
 b=pw.chromium.launch(channel='msedge',headless=True)
 def setup(ctx):
  ctx.on('request',lambda req:requests.append(req.url) if '/armacao/api/armacao/unidades' in req.url else None)
  def pause(route):held.append((route,route.fetch()))
  ctx.route('**/armacao/api/armacao/unidades',pause)
 ctx,page,errors,blocked=start(b,actor,'homolog',bootstrap=True,initial_module='planejamento',before_navigation=setup)
 page.keyboard.press('Control+k');page.locator('#uni-search-input').fill('armação');page.wait_for_timeout(100)
 assert held and len(requests)==1,(len(held),requests)
 before=page.evaluate("()=>({entries:UnificadoBusca.entries().filter(e=>e.id.startsWith('armacao-')).length,dialog:document.querySelector('.uni-search').open,navigations:performance.getEntriesByType('navigation').length})");assert before['entries']==0 and before['dialog']
 page.screenshot(path=str(O/'dynamic-before-response.png'))
 for route,response in held:route.fulfill(response=response)
 page.wait_for_function("UnificadoBusca.entries().filter(e=>e.id.startsWith('armacao-')).length===20");page.wait_for_function("document.querySelector('#uni-search-results [role=option]')?.getAttribute('aria-setsize')==='20'")
 after=page.evaluate("()=>({entries:UnificadoBusca.entries().filter(e=>e.id.startsWith('armacao-')).length,dialog:document.querySelector('.uni-search').open,query:document.querySelector('#uni-search-input').value,navigations:performance.getEntriesByType('navigation').length,urls:UnificadoBusca.entries().filter(e=>e.id.startsWith('armacao-')).map(e=>e.url)})");assert after['dialog'] and after['query']=='armação' and after['navigations']==before['navigations'] and len(requests)==1
 assert len(set(after['urls']))==20;page.screenshot(path=str(O/'dynamic-after-response.png'));page.keyboard.press('Escape');ctx.unroute('**/armacao/api/armacao/unidades')
 opened=[]
 for query,unit,tab in [('armação campinas corte','campinas','corte'),('armacao pederneiras banca','pederneiras','banca'),('armacoa ribeirao corte','ribeirao','corte'),('corte noroeste armacao','noroeste','corte'),('fechamento dia campinas armacao','campinas','banca')]:
  page.keyboard.press('Control+k');page.locator('#uni-search-input').fill(query);page.wait_for_timeout(150);page.keyboard.press('Enter')
  page.wait_for_function("([u,t])=>{const v=new URLSearchParams(location.search).get('view');if(!v)return false;const x=new URL('/unificado/'+v,location.origin);return x.pathname==='/unificado/armacao/'&&x.searchParams.get('unidade')===u&&x.searchParams.get('tela')===t}",arg=[unit,tab])
  page.wait_for_timeout(150);frames=[f.get_attribute('src') for f in page.locator('#module-host iframe').all() if f.is_visible()];assert any('unidade='+unit in src and 'tela='+tab in src for src in frames),(unit,tab,frames);opened.append({'query':query,'unit':unit,'tab':tab,'frames':frames,'ok':True})
 assert not errors,errors;ctx.close();b.close()
result={'before':before,'after':after,'native_requests_before_and_after_late_response':1,'additional_search_requests':0,'reloads':0,'deduplicated_armacao_screens':20,'opened_results':opened,'connections':count(),'ok':True};(O/'dynamic-validation.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps(result))
