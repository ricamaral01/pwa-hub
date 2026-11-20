"""Keep the genuine 1.4.6 worker alive through the production switch to 1.4.31."""
import json,time
from pathlib import Path
from playwright.sync_api import sync_playwright
R=Path(__file__).resolve().parents[2];O=R/'docs/revisao-visual-unificado/producao-20261120/retomada-2';profile=R/'.codex-tmp/producao-20261120/production-installed-app-profile';BASE='https://concrefer.concretrack.com.br'
with sync_playwright() as pw:
 ctx=pw.chromium.launch_persistent_context(str(profile),channel='chrome',headless=True,viewport={'width':1440,'height':1000});page=ctx.pages[0] if ctx.pages else ctx.new_page()
 ctx.route('**/*',lambda r:r.continue_() if r.request.method in ['GET','HEAD','OPTIONS'] and '/api/' not in r.request.url else r.abort());page.goto(BASE+'/unificado/login.html',wait_until='domcontentloaded')
 assert page.evaluate("async()=> (await (await fetch('/unificado/VERSION',{cache:'no-store'})).text()).trim()")=='1.4.6'
 page.evaluate("async()=>await navigator.serviceWorker.register('/unificado/sw.js',{scope:'/unificado/',updateViaCache:'none'})")
 def state():return page.evaluate("async()=>{const r=await navigator.serviceWorker.getRegistration('/unificado/');return {keys:await caches.keys(),active:r?.active?.state,installing:!!r?.installing,waiting:!!r?.waiting,controller:!!navigator.serviceWorker.controller}}")
 deadline=time.monotonic()+90
 while True:
  old=state()
  if old.get('active')=='activated' and not old['installing'] and not old['waiting'] and 'concrefer-unificado-shell-v1.4.6' in old['keys']:break
  assert time.monotonic()<deadline,old;page.wait_for_timeout(500)
 (O/'service-worker-ready.json').write_text(json.dumps({'version':'1.4.6','state':old,'browser_kept_running':True},indent=2),encoding='utf-8');print('Real 1.4.6 worker active; browser remains open for deployment',flush=True)
 deadline=time.monotonic()+480
 while not (O/'release-published.json').exists():
  if (O/'release-aborted.json').exists():ctx.close();raise SystemExit('Release aborted; existing worker preserved')
  assert time.monotonic()<deadline,'Timed out waiting for release';page.wait_for_timeout(500)
 page.evaluate("async()=>{const r=await navigator.serviceWorker.getRegistration('/unificado/');await r.update()}");deadline=time.monotonic()+120
 while True:
  new=state()
  if new.get('active')=='activated' and not new['installing'] and not new['waiting'] and 'concrefer-unificado-shell-v1.4.31' in new['keys'] and 'concrefer-unificado-shell-v1.4.6' not in new['keys']:break
  assert time.monotonic()<deadline,new;page.wait_for_timeout(500)
 page.reload(wait_until='domcontentloaded');page.screenshot(path=str(O/'production-service-worker-upgraded.png'));html=page.evaluate("async()=>{const c=await caches.open('concrefer-unificado-shell-v1.4.31');return await (await c.match('/unificado/index.html')).text()}");assert '1.4.31' in html
 ctx.close();result={'before':old,'after':new,'version_before':'1.4.6','version_after':'1.4.31','same_running_browser':True,'cache_cleared':False,'app_reinstalled':False,'manual_cache_contents':False,'physical_os_installation_ui_tested':False,'ok':True};(O/'service-worker-upgrade.json').write_text(json.dumps(result,indent=2),encoding='utf-8');print(json.dumps(result))
