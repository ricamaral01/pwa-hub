"""All existing role/module pairs; production configuration simulated on 18446."""
import argparse,json
from playwright.sync_api import sync_playwright
from modulos_runtime import R,O,BASE,MODULES,actors,start,count
parser=argparse.ArgumentParser();parser.add_argument('--published',action='store_true');args=parser.parse_args()
people=actors();rows=[]
with sync_playwright() as pw:
 browser=pw.chromium.launch(channel='msedge',headless=True)
 for actor in people:
  ctx,p,errors=start(browser,actor,candidate=not args.published)
  for module in MODULES:
   p.goto(BASE+'/unificado/?module='+module,wait_until='networkidle');p.evaluate('async()=>await UnificadoBusca.ready()')
   result=p.evaluate('''module=>{const snap=UnificadoSidebarModelA.snapshot(),page=document.querySelector('.module-page:not([hidden])'),allowed=snap.allowedModuleIds.includes(module);const items=page?[...page.querySelectorAll('.module-page-link')].map(e=>e.dataset.itemId):[];const searchEntries=UnificadoBusca.entries();return {allowed,opened:page?.dataset.module===module,items,unauthorized:items.filter(id=>!snap.allowedItemIds.includes(id)),searchUnauthorized:searchEntries.filter(e=>!snap.allowedItemIds.includes(e.id)).map(e=>e.id),environment:UnificadoCatalogEnvironment.name}}''',module)
   assert not result['unauthorized'],(actor['role'],module,result)
   assert not result['searchUnauthorized'],(actor['role'],module,result)
   assert result['opened']==result['allowed'],(actor['role'],module,result)
   if result['allowed']:assert result['items'],(actor['role'],module,'empty module')
   rows.append({'origin':actor['category'],'role':actor['role'],'account':actor['id'],'module':module,**result,'connections':count(),'ok':True})
  assert not errors,errors;ctx.close()
 admin=next(a for a in people if a['category']=='central' and a['role']=='GERENCIA')
 ctx,p,errors=start(browser,admin,candidate=not args.published)
 p.goto(BASE+'/unificado/?module=planejamento',wait_until='networkidle');assert p.locator('.module-page-link[data-item-id="testeProgramacao"]').count()==1
 homolog=p.evaluate("({catalog:!!MENU_ITEMS.testeProgramacao,search:UnificadoBusca.entries().some(e=>e.id==='testeProgramacao'),environment:UnificadoCatalogEnvironment.name})");assert homolog['catalog'] and homolog['search'];ctx.close()
 ctx,p,errors=start(browser,admin,candidate=not args.published,environment='producao')
 # Add an old saved navigation ID and a server-authorized quick-access fixture;
 # production environment filtering must suppress the homolog-only destination.
 p.evaluate("localStorage.setItem('unificado.navigation.recent.alex',JSON.stringify([{id:'testeProgramacao',module:'planejamento'}]))")
 ctx.route('**/mapa/api/unified/quick-access/me',lambda route:route.fulfill(json={'enabled':True,'home':False,'user':{'name':'Prova de ambiente'},'items':[{'id':'homolog-only','module':'planejamento','label':'Teste Programação','detail':'Homologação','destinations':[{'screen':'testeProgramacao','path':'/unificado/pcp/teste-programacao/','label':'Teste Programação'}]},{'id':'real','module':'planejamento','label':'Dashboard','detail':'Produção','destinations':[{'screen':'dashboard','path':'/unificado/pcp/dashboard/','label':'Dashboard'}]}]}))
 p.goto(BASE+'/unificado/?module=planejamento',wait_until='networkidle');p.evaluate('async()=>await UnificadoBusca.ready()');p.wait_for_timeout(100)
 production=p.evaluate("({environment:UnificadoCatalogEnvironment.name,catalog:!!MENU_ITEMS.testeProgramacao,config:MENU_CONFIG.planejamento.groups.some(g=>g.items.some(i=>i.id==='testeProgramacao')),snapshot:UnificadoSidebarModelA.snapshot().allowedItemIds.includes('testeProgramacao'),search:UnificadoBusca.entries().some(e=>e.id==='testeProgramacao'),module:!!document.querySelector('.module-page [data-item-id=testeProgramacao]'),favorite:!!document.querySelector('#uqa-home [data-screen=testeProgramacao]'),quickFixture:!!document.querySelector('#uqa-home [data-screen=dashboard]'),recentRows:[...document.querySelectorAll('.nav-recent [data-item-id]')].map(e=>e.dataset.itemId)})")
 assert production['environment']=='producao' and production['quickFixture'];assert not any(production[k] for k in ['catalog','config','snapshot','search','module','favorite']),production
 p.screenshot(path=str(O/'production-config-simulation.png'),full_page=True)
 # Navigation history resolves only entries in the filtered catalogue.
 p.locator('.nav-mobile-bottom [data-mode=recentes]').evaluate('e=>e.click()');p.wait_for_timeout(50)
 assert not p.locator('.nav-tree a[href*="teste-programacao"]').count()
 production['recent_hidden']=True
 assert not errors,errors;ctx.close();browser.close()
result={'published':args.published,'profiles':len(people),'module_cases':len(rows),'concurrency':1,'permission_leaks':0,'rows':rows,'homolog':homolog,'production_simulation':production,'production_requests':0,'ok':True}
(O/('published-permissions.json' if args.published else 'candidate-permissions.json')).write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps({'profiles':len(people),'module_cases':len(rows),'ok':True}))
