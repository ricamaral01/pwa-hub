"""Keep a real 1.4.7 browser open through the homolog-only 1.4.8 deploy."""
import json,time
from pathlib import Path
from playwright.sync_api import sync_playwright
from homolog_session import test_cookie_for
BASE='https://concrefer.concretrack.com.br:18446';ROOT=Path(__file__).resolve().parents[2]
out=ROOT/'docs/revisao-visual-unificado/homolog/fase-2';out.mkdir(parents=True,exist_ok=True)
with sync_playwright() as p:
 browser=p.chromium.launch(channel='msedge',headless=True)
 ctx=browser.new_context();ctx.add_cookies([{'name':'mapa_unificado_homolog_session','value':test_cookie_for('user-ricardo'),'domain':'concrefer.concretrack.com.br','path':'/unificado/','secure':True,'httpOnly':True,'sameSite':'Lax'}])
 page=ctx.new_page();page.goto(BASE+'/unificado/login.html')
 page.evaluate("localStorage.setItem('pwa_mapa_auth_session_v1',JSON.stringify({id:'user-ricardo',role:'GERENCIA',name:'Ricardo'}))")
 page.goto(BASE+'/unificado/',wait_until='networkidle')
 page.wait_for_function("navigator.serviceWorker.controller",timeout=30000)
 before=page.evaluate('caches.keys()');assert 'concrefer-unificado-shell-v1.4.7' in before,before
 print('1.4.7 worker active; awaiting homolog deploy',flush=True)
 end=time.time()+1200
 while time.time()<end:
  if page.request.get(BASE+'/unificado/VERSION').text().strip()=='1.4.8':break
  page.wait_for_timeout(2000)
 else:raise AssertionError('Deploy timeout')
 page.evaluate('async()=>{const r=await navigator.serviceWorker.getRegistration();await r.update()}')
 page.wait_for_function("async()=>{const keys=await caches.keys();return keys.includes('concrefer-unificado-shell-v1.4.8')&&!keys.includes('concrefer-unificado-shell-v1.4.7')}",timeout=60000)
 page.wait_for_load_state('networkidle');page.reload(wait_until='networkidle')
 after=page.evaluate('caches.keys()')
 assert page.locator('.home-heading h1').inner_text()=='Início'
 (out/'service-worker.json').write_text(json.dumps({'before':before,'after':after,'manual_cache_clear':False,'status':'ok'},indent=2))
 print('SW 1.4.7 -> 1.4.8 passed without manual cache clearing',flush=True);browser.close()
