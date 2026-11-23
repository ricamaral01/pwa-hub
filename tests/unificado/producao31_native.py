"""Low-concurrency native screens. Blocks operational writes and records refusals."""
import asyncio,hashlib,json,sys
from pathlib import Path
from urllib.parse import urlsplit
from playwright.async_api import async_playwright
from producao_resume_runtime import actors,count,MODULES
R=Path(__file__).resolve().parents[2];O=R/'docs/revisao-visual-unificado/producao-20261120/retomada-2';BASE='https://concrefer.concretrack.com.br';mode=sys.argv[1];assert mode in ['before','after','after-master'];progress=O/('native-'+mode+'.json')
async def main():
 people=actors('production');people=[p for p in people if p['id']=='alex'] if mode in ['before','after-master'] else people;rows=json.loads(progress.read_bytes())['rows'] if progress.exists() else []
 async with async_playwright() as pw:
  browser=await pw.chromium.launch(channel='msedge',headless=True)
  for actor in people:
   completed={r['module'] for r in rows if r['origin']==actor['category'] and r['profile']==actor['role']}
   if completed==set(MODULES):continue
   count();ctx=await browser.new_context(viewport={'width':1440,'height':1000},service_workers='block');lock=asyncio.Lock();responses=[];blocked=[];errors=[];pending=[0]
   auth_paths={'/unificado/mapa/api/unified/'+k+'-bootstrap' for k in ['laboratorio','qualidade','suprimentos']}|{'/unificado/ged/api/auth/unified-session'}
   async def protect(route):
    req=route.request;u=urlsplit(req.url)
    if req.method not in ['GET','HEAD','OPTIONS'] and not (req.method=='POST' and u.path in auth_paths):blocked.append({'method':req.method,'path':u.path});await route.abort();return
    if u.netloc==urlsplit(BASE).netloc and '/api/' in u.path and not any(x in u.path for x in ['/stream','/events','/realtime']):
     pending[0]+=1
     try:
      async with lock:
       try:
        response=await route.fetch(timeout=30000);responses.append({'method':req.method,'path':u.path,'status':response.status});await route.fulfill(response=response)
       except Exception as error:responses.append({'method':req.method,'path':u.path,'status':None,'error':type(error).__name__});await route.abort()
     finally:pending[0]-=1
    else:await route.continue_()
   await ctx.route('**/*',protect)
   cookies=[]
   if actor.get('cookie'):cookies.append({'name':'mapa_unificado_session','value':actor['cookie'],'domain':'concrefer.concretrack.com.br','path':'/unificado/','secure':True,'httpOnly':True})
   if actor.get('token'):cookies.append({'name':'unificado_pcp_screen','value':actor['token'],'domain':'concrefer.concretrack.com.br','path':'/unificado/pcp/','secure':True,'httpOnly':True})
   await ctx.add_cookies(cookies);page=await ctx.new_page();page.on('pageerror',lambda e:errors.append(str(e)));await page.goto(BASE+'/unificado/login.html',wait_until='domcontentloaded');await page.evaluate("a=>{if(a.token){localStorage.setItem('pcp_token',a.token);localStorage.setItem('pcp_user',JSON.stringify(a.user))}if(a.mapa)localStorage.setItem('pwa_mapa_auth_session_v1',JSON.stringify({id:a.mapa.id,role:a.mapa.perfil,name:a.mapa.nome}))}",actor)
   for module in MODULES:
    if module in completed:continue
    connections=count();responses.clear();errors.clear();await page.goto(BASE+'/unificado/?module='+module,wait_until='domcontentloaded');await page.wait_for_function('window.UnificadoSidebarModelA');await page.evaluate('async()=>await UnificadoScreenAccess.ready');await page.wait_for_timeout(600)
    selection=await page.evaluate("""m=>{const s=UnificadoSidebarModelA.snapshot();if(!s.allowedModuleIds.includes(m))return null;if(m==='ged')return {id:'ged-dashboard',url:'/unificado/ged/dashboard'};const items=MENU_CONFIG[m].groups.flatMap(g=>g.items).filter(i=>s.allowedItemIds.includes(i.id));const i=items[0];return i?{id:i.id,url:String(MENU_ITEMS[i.id].url)}:null}""",module)
    if selection:
     if module=='ged':await page.evaluate("()=>UnificadoRouter.openGed('dashboard')")
     else:await page.evaluate('e=>UnificadoRouter.open(e.url,e.id)',selection)
     await page.wait_for_timeout(1800)
     try:await page.wait_for_function("()=>{const h=document.querySelector('#module-host');return h&&!h.hidden&&h.getAttribute('aria-busy')!=='true'}",timeout=25000)
     except Exception:pass
    if mode=='after-master':
     for native_frame in page.frames:
      if native_frame!=page.main_frame:
       try:await native_frame.wait_for_load_state('load',timeout=15000)
       except Exception:pass
     stable=0
     for attempt in range(225):
      await page.wait_for_timeout(200);stable=stable+1 if not pending[0] else 0
      if stable>=5:break
     assert stable>=5,('CAPACITY_TIMEOUT',module,pending[0])
     if module=='usinas':
      await page.wait_for_function("()=>[...document.querySelectorAll('iframe')].some(f=>f.contentDocument?.querySelector('#aviso')&&!f.contentDocument.querySelector('#aviso').textContent.includes('Carregando'))",timeout=30000)
      assert any(r['path']=='/unificado/mapa/api/usina/receitas' and r['status']==200 for r in responses),responses
    await page.wait_for_timeout(300);fatal=[r for r in responses if r['status'] in [500,502,504]];refusals=[r for r in responses if r['status'] in [401,403]]
    displayed=await page.evaluate("()=>{const nodes=[...document.querySelectorAll('#module-host,#logistica-native-host')];return nodes.some(n=>!n.hidden&&n.getBoundingClientRect().height>40)}")
    row={'origin':actor['category'],'profile':actor['role'],'account':actor['id'],'module':module,'selected':selection,'native_displayed':displayed,'api_responses':list(responses),'refusals':refusals,'fatal_http':fatal,'page_errors':list(errors),'blocked_operational_writes':list(blocked),'connections':connections,'ok':not fatal and (not selection or displayed or bool(refusals))};rows.append(row);progress.write_text(json.dumps({'mode':mode,'rows':rows,'ok':all(r['ok'] for r in rows)},ensure_ascii=False,indent=2),encoding='utf-8')
    if actor['id']=='alex':await page.screenshot(path=str(O/('native-'+mode+'-'+module+'.png')))
    assert row['ok'],(module,actor['role'],fatal,displayed,refusals);print(json.dumps({'mode':mode,'profile':actor['role'],'module':module,'selected':selection['id'] if selection else None,'responses':len(responses),'refusals':len(refusals),'fatal_http':len(fatal),'connections':connections}),flush=True)
   await ctx.close()
  await browser.close()
 print(json.dumps({'mode':mode,'profiles':len(people),'cases':len(rows),'ok':True}))
asyncio.run(main())
