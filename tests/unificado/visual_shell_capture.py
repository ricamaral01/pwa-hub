"""Read-only responsive shell capture, only isolated port 18446."""
import argparse,json,sys
from pathlib import Path
from urllib.parse import urlsplit
from playwright.sync_api import sync_playwright,expect
from homolog_session import test_cookie_for
ROOT=Path(__file__).resolve().parents[2];BASE='https://concrefer.concretrack.com.br:18446'
args=argparse.ArgumentParser();args.add_argument('phase');args.add_argument('moment');a=args.parse_args()
OUT=ROOT/f'docs/revisao-visual-unificado/homolog/{a.phase}/{a.moment}';OUT.mkdir(parents=True,exist_ok=True)
sizes=[(1440,900),(1024,768),(820,1180),(390,844)];results=[];errors=[];bad=[];external=[]
with sync_playwright() as p:
 browser=p.chromium.launch(channel='msedge',headless=True)
 context=browser.new_context(service_workers='block')
 context.add_cookies([{'name':'mapa_unificado_homolog_session','value':test_cookie_for('user-ricardo'),'domain':'concrefer.concretrack.com.br','path':'/unificado/','secure':True,'httpOnly':True,'sameSite':'Lax'}])
 page=context.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
 page.on('response',lambda r:bad.append({'url':r.url,'status':r.status}) if r.status>=400 else None)
 def restrict(route):
  u=urlsplit(route.request.url)
  if u.scheme in ('http','https') and u.netloc!=urlsplit(BASE).netloc:
   external.append(route.request.url);route.abort()
  else:route.continue_()
 page.route('**/*',restrict)
 page.goto(BASE+'/unificado/login.html')
 page.evaluate("localStorage.setItem('pwa_mapa_auth_session_v1',JSON.stringify({id:'user-ricardo',role:'GERENCIA',name:'Ricardo'}))")
 status=page.evaluate("""async()=>{const r=await fetch('/unificado/mapa/api/unified/pcp-session');if(!r.ok)return r.status;const d=await r.json();localStorage.setItem('pcp_token',d.access_token);localStorage.setItem('pcp_user',JSON.stringify(d.usuario));return r.status}""");assert status==200,status
 for name,module in [('inicio',None),('planejamento','planejamento'),('laboratorio','laboratorio'),('suprimentos','suprimentos')]:
  for width,height in sizes:
   page.set_viewport_size({'width':width,'height':height})
   page.goto(BASE+'/unificado/',wait_until='domcontentloaded')
   page.wait_for_function('window.UnificadoScreenAccess?.ready && window.UnificadoSidebarModelA',timeout=20000)
   page.evaluate('async()=>{await window.UnificadoScreenAccess.ready}')
   if module:page.evaluate('(m)=>window.UnificadoSidebarModelA.selectModule(m)',module)
   try:page.wait_for_load_state('networkidle',timeout=5000)
   except Exception:pass
   page.evaluate('document.fonts.ready')
   page.screenshot(path=str(OUT/f'{name}-{width}.png'),full_page=False)
   overflow=page.evaluate('document.documentElement.scrollWidth>innerWidth')
   results.append({'screen':name,'width':width,'overflow':overflow,'font':page.locator('body').evaluate('(e)=>getComputedStyle(e).fontFamily'),'headings':page.locator('h1:visible').all_text_contents(),'logos':page.locator('#sidebar-model-a img').evaluate_all('(els)=>els.map(e=>({src:e.src,ok:e.complete&&e.naturalWidth>0}))')})
   assert not overflow,(name,width)
 for width,height in sizes:
  ctx=browser.new_context(viewport={'width':width,'height':height},service_workers='block')
  lp=ctx.new_page();lp.goto(BASE+'/unificado/login.html',wait_until='networkidle');lp.evaluate('document.fonts.ready');lp.screenshot(path=str(OUT/f'login-{width}.png'))
  metrics=lp.locator('.login-card').evaluate('(e)=>{const s=getComputedStyle(e),r=e.getBoundingClientRect();return {font:s.fontFamily,width:r.width,height:r.height,x:r.x,y:r.y,background:s.backgroundColor}}')
  results.append({'screen':'login','width':width,'metrics':metrics});ctx.close()
 browser.close()
data={'base':BASE,'results':results,'js_errors':errors,'http_errors':bad,'external_attempts':sorted(set(external))}
(OUT.parent/(a.moment+'-results.json')).write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps({'captures':len(results),'errors':errors,'http_errors':len(bad),'external':len(set(external))}))
assert not errors,errors
