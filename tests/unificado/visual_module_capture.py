"""Capture real module screens and check layout/API errors on test origin only."""
import argparse,json
from pathlib import Path
from urllib.parse import quote,urlsplit
from playwright.sync_api import sync_playwright
from homolog_session import test_cookie_for
ROOT=Path(__file__).resolve().parents[2];BASE='https://concrefer.concretrack.com.br:18446'
parser=argparse.ArgumentParser();parser.add_argument('phase');parser.add_argument('views',nargs='+');a=parser.parse_args()
OUT=ROOT/'docs/revisao-visual-unificado/homolog'/a.phase/'depois';OUT.mkdir(parents=True,exist_ok=True)
results=[]
with sync_playwright() as p:
 browser=p.chromium.launch(channel='msedge',headless=True)
 ctx=browser.new_context(service_workers='block')
 ctx.add_cookies([{'name':'mapa_unificado_homolog_session','value':test_cookie_for('user-ricardo'),'domain':'concrefer.concretrack.com.br','path':'/unificado/','secure':True,'httpOnly':True,'sameSite':'Lax'}])
 page=ctx.new_page();errors=[];bad=[];external=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.on('response',lambda r:bad.append({'url':r.url,'status':r.status}) if r.status>=400 else None)
 def restrict(route):
  u=urlsplit(route.request.url)
  if u.scheme in ('https','http') and u.netloc!=urlsplit(BASE).netloc:external.append(route.request.url);route.abort()
  else:route.continue_()
 page.route('**/*',restrict)
 page.goto(BASE+'/unificado/login.html')
 page.evaluate("localStorage.setItem('pwa_mapa_auth_session_v1',JSON.stringify({id:'user-ricardo',role:'GERENCIA',name:'Ricardo'}))")
 assert page.evaluate("""async()=>{const r=await fetch('/unificado/mapa/api/unified/pcp-session');const d=await r.json();localStorage.setItem('pcp_token',d.access_token);localStorage.setItem('pcp_user',JSON.stringify(d.usuario));return r.status}""")==200
 for view in a.views:
  for width,height in [(1440,900),(1024,768),(820,1180),(390,844)]:
   start=len(errors);bstart=len(bad);estart=len(external)
   page.set_viewport_size({'width':width,'height':height})
   page.goto(BASE+'/unificado/?view='+quote(view,safe=''),wait_until='domcontentloaded')
   try:page.wait_for_load_state('networkidle',timeout=5000)
   except Exception:pass
   metrics=[]
   for frame in page.frames:
    if not frame.url.startswith(BASE):continue
    frame.evaluate('document.fonts.ready')
    metrics.append({'url':frame.url,'overflow':frame.evaluate('document.documentElement.scrollWidth>innerWidth+1'),'font':frame.locator('body').evaluate('(e)=>getComputedStyle(e).fontFamily'),'text':frame.locator('body').inner_text()[:200]})
   name=view.strip('/').replace('/','-').replace('.html','').replace('?','-')
   page.screenshot(path=str(OUT/f'{name}-{width}.png'))
   row={'view':view,'width':width,'frames':metrics,'js_errors':errors[start:],'http_errors':bad[bstart:],'external_attempts':external[estart:]};results.append(row)
   (OUT.parent/'module-results.json').write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf-8')
   print(view,width,'overflow',any(m['overflow'] for m in metrics),'http',len(row['http_errors']),'js',len(row['js_errors']),flush=True)
 browser.close()
assert all(not r['js_errors'] and not r['http_errors'] and not any(f['overflow'] for f in r['frames']) for r in results),'See module-results.json'
