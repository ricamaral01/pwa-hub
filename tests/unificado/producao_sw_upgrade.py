"""Real production worker in persistent Chrome; never fabricate cache contents."""
import json,sys,time
from pathlib import Path
from playwright.sync_api import sync_playwright
R=Path(__file__).resolve().parents[2];O=R/'docs/revisao-visual-unificado/producao-20261120';B=R/'.codex-tmp/producao-20261120';BASE='https://concrefer.concretrack.com.br';mode=sys.argv[1];assert mode in ['before','after'];version='1.4.6' if mode=='before' else '1.4.30'
with sync_playwright() as pw:
 ctx=pw.chromium.launch_persistent_context(str(B/'production-installed-app-profile'),channel='chrome',headless=True,viewport={'width':1440,'height':1000});page=ctx.pages[0] if ctx.pages else ctx.new_page()
 def protect(route):
  req=route.request
  if req.method not in ['GET','HEAD','OPTIONS'] or '/api/' in req.url:return route.abort()
  route.continue_()
 ctx.route('**/*',protect)
 page.goto(BASE+'/unificado/login.html',wait_until='domcontentloaded')
 actual=page.evaluate("async()=> (await (await fetch('/unificado/VERSION',{cache:'no-store'})).text()).trim()");assert actual==version,actual
 before=page.evaluate("async()=>({keys:await caches.keys(),registrations:(await navigator.serviceWorker.getRegistrations()).map(r=>({scope:r.scope,active:r.active?.state}))})")
 if mode=='after':
  original=json.loads((O/'production-sw-before.json').read_bytes());assert original['version']=='1.4.6';assert 'concrefer-unificado-shell-v1.4.6' in before['keys'],before
  page.evaluate("async()=>{const r=await navigator.serviceWorker.getRegistration('/unificado/');if(!r)throw Error('Existing registration missing');await r.update()}")
 else:page.evaluate("async()=>await navigator.serviceWorker.register('/unificado/sw.js',{scope:'/unificado/',updateViaCache:'none'})")
 if mode=='after':page.reload(wait_until='networkidle')
 deadline=time.monotonic()+100
 while True:
  state=page.evaluate("""async v=>{const c=await caches.open('concrefer-unificado-shell-v'+v),response=await c.match('/unificado/index.html'),entries=await c.keys(),keys=await caches.keys(),r=await navigator.serviceWorker.getRegistration('/unificado/');return {cache_keys:keys,scope:r?.scope,active:r?.active?.state,installing:!!r?.installing,waiting:!!r?.waiting,controller:!!navigator.serviceWorker.controller,cache_entries:entries.length,cached_index:!!response,cached_index_length:response?(await response.text()).length:0}}""",version)
  if state.get('active')=='activated' and not state['installing'] and not state['waiting'] and state['cached_index'] and state['cache_entries']>10 and not any(k.startswith('concrefer-unificado-shell-v') and k!='concrefer-unificado-shell-v'+version for k in state['cache_keys']):break
  assert time.monotonic()<deadline,state
  page.wait_for_timeout(750)
 assert state['cached_index'] and state['active']=='activated' and not state['waiting'] and not state['installing'],state
 page.screenshot(path=str(O/('production-sw-'+mode+'.png')),full_page=True);ctx.close()
 result={'version':version,'origin':BASE,'persistent_profile':str(B/'production-installed-app-profile'),'before':before,'after':state,'cache_cleared':False,'app_reinstalled':False,'cache_contents_manually_created':False,'physical_installed_app_ui_verified':False,'limitation':'Persistent Chrome worker upgrade; operating system installation UI and a physical mobile device were not available.','ok':True}
 (O/('production-sw-'+mode+'.json')).write_text(json.dumps(result,indent=2),encoding='utf-8');print(json.dumps(result))
