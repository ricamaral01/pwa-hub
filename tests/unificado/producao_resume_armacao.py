"""Read-only production baseline and enabled-homolog Armação visibility."""
import json,sys
from playwright.sync_api import sync_playwright
from producao_resume_runtime import O,actors,start,count
environment=sys.argv[1];assert environment in ['production','homolog'];progress=O/('armacao-'+environment+'-progress.json');rows=json.loads(progress.read_bytes()) if progress.exists() else []
extract=r'''selector=>[...document.querySelectorAll(selector)].map(a=>{try{let u=new URL(a.href,location.origin);if(u.searchParams.has('view'))u=new URL('/unificado/'+u.searchParams.get('view'),location.origin);if(!u.pathname.includes('/armacao/'))return null;return {key:(u.searchParams.get('unidade')||'')+'|'+(u.searchParams.get('tela')||''),label:a.textContent.trim(),href:u.pathname+u.search}}catch{return null}}).filter(Boolean)'''
with sync_playwright() as pw:
 browser=pw.chromium.launch(channel='msedge',headless=True)
 for actor in actors(environment):
  previous=next((r for r in rows if r['origin']==actor['category'] and r['profile']==actor['role']),None)
  if previous and not any(u['enabled'] for u in previous['api']['units']):continue
  count();ctx,page,errors,blocked=start(browser,actor,environment,bootstrap=environment=='homolog')
  api=page.evaluate("async()=>{const r=await fetch('/unificado/armacao/api/armacao/unidades',{credentials:'same-origin',cache:'no-store'});return {status:r.status,units:r.ok?await r.json():[]}}")
  if actor['id']=='alex':assert api['status']==200 and any(u['enabled'] for u in api['units']),('Alex authorization unavailable',api)
  expand=page.locator('#nav-modern button.nav-text-action').filter(has_text='Expandir tudo')
  if expand.count():expand.first.click()
  page.wait_for_timeout(350);menu=page.evaluate(extract,'#nav-modern .nav-tree a[href]');module=page.evaluate(extract,'.module-page:not([hidden]) a[href]');name=environment+'-'+actor['category']+'-'+actor['role'];page.screenshot(path=str(O/('armacao-'+name+'-module.png')),full_page=True)
  modern=page.evaluate('!!window.UnificadoBusca')
  if modern:
   page.evaluate("async()=>{await UnificadoBusca.ready();UnificadoBusca.open()}");page.locator('#uni-search-input').fill('armação');page.wait_for_timeout(450)
   search=page.evaluate("()=>UnificadoBusca.search('armação').results.filter(e=>e.url?.includes('armacao')).map(e=>({id:e.id,url:e.url,name:e.name}))");visible_search=page.locator('.uni-search-list').inner_text()
  else:
   page.locator('#nav-modern input.nav-search').fill('armação');page.wait_for_timeout(250);search=page.evaluate(extract,'#nav-modern .nav-search-result a[href]');visible_search=page.locator('#nav-modern .nav-tree').inner_text()
  page.screenshot(path=str(O/('armacao-'+name+'-search.png')),full_page=True)
  row={'environment':environment,'version':'1.4.6' if environment=='production' else '1.4.30','origin':actor['category'],'profile':actor['role'],'account':actor['id'],'api':api,'menu':menu,'module':module,'search':search,'visible_search_text':visible_search,'page_errors':errors,'blocked_writes':blocked,'connections':count()};rows=[r for r in rows if not(r['origin']==actor['category'] and r['profile']==actor['role'])];rows.append(row);progress.write_text(json.dumps(rows,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps({'environment':environment,'profile':actor['category']+'/'+actor['role'],'account':actor['id'],'api':api['status'],'enabled_units':sum(u['enabled'] for u in api['units']),'menu':len(menu),'module':len(module),'search':len(search)}),flush=True);ctx.close()
 browser.close()
(O/('armacao-'+environment+'.json')).write_text(json.dumps(rows,ensure_ascii=False,indent=2),encoding='utf-8')
