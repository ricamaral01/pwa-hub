"""Read-only production captures, keyboard search and actual computed columns."""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright
from producao_resume_runtime import actors,start,count,MODULES
R=Path(__file__).resolve().parents[2];O=R/'docs/revisao-visual-unificado/producao-20261120/retomada-2';BASE='https://concrefer.concretrack.com.br';actor=next(a for a in actors('production') if a['id']=='alex');rows=[];columns=[]
with sync_playwright() as pw:
 b=pw.chromium.launch(channel='msedge',headless=True)
 for width,height in [(1440,1000),(390,844)]:
  count();ctx,page,errors,blocked=start(b,actor,'production',initial_module=None);page.set_viewport_size({'width':width,'height':height});page.wait_for_timeout(500);page.screenshot(path=str(O/f'production-home-{width}.png'),full_page=True)
  page.goto(BASE+'/unificado/?module=planejamento',wait_until='domcontentloaded');page.wait_for_function("document.querySelector('.module-page:not([hidden])')?.dataset.module==='planejamento'");page.screenshot(path=str(O/f'production-module-{width}.png'),full_page=True)
  page.keyboard.press('Control+k');page.locator('#uni-search-input').wait_for(state='visible');checks=[]
  for query,expected in [('etiqeta','etiquetas'),('rotulo setor 3','etiquetasSc'),('armacoa ribeirao','armacao-ribeirao-corte')]:
   page.locator('#uni-search-input').fill(query);page.wait_for_timeout(150);result=page.evaluate('q=>UnificadoBusca.search(q).results.slice(0,5).map(e=>({id:e.id,title:e.title,url:e.url}))',query);assert result,(query,result);checks.append({'query':query,'results':result})
  page.screenshot(path=str(O/f'production-search-{width}.png'));page.keyboard.press('Escape');assert not page.locator('#uni-search-input').is_visible()
  overflow=page.evaluate('document.documentElement.scrollWidth>innerWidth+1');assert not overflow;rows.append({'width':width,'ctrl_k':True,'escape':True,'overflow':overflow,'search':checks})
  if width==1440:
   for module in MODULES:
    count();page.goto(BASE+'/unificado/?module='+module,wait_until='domcontentloaded');page.wait_for_function("m=>document.querySelector('.module-page:not([hidden])')?.dataset.module===m",arg=module);page.wait_for_timeout(500)
    data=page.evaluate("""()=>{const p=document.querySelector('.module-page:not([hidden])'),c=p.querySelector('.module-page-columns'),groups=[...p.querySelectorAll('.module-page-group')];return {module:p.dataset.module,columns:c?getComputedStyle(c).columnCount:null,groups:groups.map(g=>({title:g.querySelector('h2')?.textContent,links:g.querySelectorAll('a').length,breakInside:getComputedStyle(g).breakInside,rects:g.getClientRects().length})),empty:groups.filter(g=>!g.querySelector('a')).length}}""")
    assert data['empty']==0,data
    if data['groups'] and data['columns'] is not None:assert all(g['breakInside']=='avoid' for g in data['groups']),data
    columns.append(data);page.screenshot(path=str(O/f'production-module-{module}-1440.png'),full_page=True)
  ctx.close()
 b.close()
(O/'views-production.json').write_text(json.dumps({'views':rows,'module_columns':columns,'ok':True},ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps({'views':len(rows),'modules':len(columns),'ok':True}))
