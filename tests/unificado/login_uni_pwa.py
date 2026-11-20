"""Keep a real browser profile across publication; no clearing storage/cache."""
import argparse,json,time,os
from pathlib import Path
from playwright.sync_api import sync_playwright
from homolog_session import test_cookie_for
R=Path(__file__).resolve().parents[2];O=R/'docs/revisao-visual-unificado/homolog/login-uni-20261120';BASE='https://concrefer.concretrack.com.br:18446';PROFILE=R/'.codex-tmp/login-uni-pwa-profile'
parser=argparse.ArgumentParser();parser.add_argument('mode',choices=['before','after','rename']);args=parser.parse_args()
def installed_metadata(context):
 tab=context.new_page();tab.goto('chrome://apps/');names=[]
 try:
  tab.locator('app-item').first.wait_for(timeout=10000)
  names=tab.locator('app-item').evaluate_all("es=>es.map(e=>({id:e.appInfo?.id,title:e.appInfo?.title,name:e.appInfo?.name,text:e.shadowRoot?.textContent?.trim().slice(-300)}))")
 except Exception:pass
 tab.close()
 folder=Path(os.environ['APPDATA'])/'Microsoft/Windows/Start Menu/Programs'
 shortcuts=[str(p) for p in folder.rglob('*.lnk') if 'concrefer' in p.name.lower() or p.stem.lower()=='uni']
 return {'chrome_apps':names,'windows_shortcut_paths':shortcuts}
with sync_playwright() as pw:
 ctx=pw.chromium.launch_persistent_context(str(PROFILE),channel='chrome',headless=False,args=['--window-position=-32000,-32000'],viewport={'width':1440,'height':900})
 page=ctx.pages[0] if ctx.pages else ctx.new_page();page.goto(BASE+'/unificado/login.html',wait_until='networkidle')
 if args.mode=='before':
  page.evaluate("async()=>{await navigator.serviceWorker.register('/unificado/sw.js',{scope:'/unificado/'});await navigator.serviceWorker.ready}")
  page.wait_for_function('navigator.serviceWorker.controller!==null')
  keys=page.evaluate('caches.keys()');assert 'concrefer-unificado-shell-v1.4.26' in keys,keys
  page.evaluate("localStorage.setItem('login-uni-upgrade-sentinel','preservar')")
  cdp=ctx.browser.new_browser_cdp_session();install={}
  try:
   ctx.add_cookies([{'name':'mapa_unificado_homolog_session','value':test_cookie_for('user-ricardo'),'url':BASE+'/unificado/','httpOnly':True,'secure':True,'sameSite':'Lax'}])
   page.goto(BASE+'/unificado/',wait_until='networkidle')
   target=ctx.new_cdp_session(page)
   installability={'manifest':target.send('Page.getAppManifest'),'errors':target.send('Page.getInstallabilityErrors')}
   (O/'pwa-installability-before.json').write_text(json.dumps(installability,ensure_ascii=False,indent=2),encoding='utf-8')
   attempts=[]
   for install_url in [BASE+'/unificado/',BASE+'/unificado/',BASE+'/unificado/login.html']:
    try:
     cdp.send('PWA.install',{'manifestId':BASE+'/unificado/mapa/operacao/index.html','installUrlOrBundleUrl':install_url});break
    except Exception as e:attempts.append(str(e))
   else:raise RuntimeError('; '.join(attempts))
   install={'installed':True,'method':'Chrome CDP PWA.install; persistent real browser profile'}
   cdp.send('PWA.changeAppUserSettings',{'manifestId':BASE+'/unificado/mapa/operacao/index.html','displayMode':'standalone'})
   install['installed_metadata']=installed_metadata(ctx)
   try:install['os_app_state']=cdp.send('PWA.getOsAppState',{'manifestId':BASE+'/unificado/mapa/operacao/index.html'})
   except Exception as e:install['state_query_error']=str(e)[:500]
  except Exception as e:install={'installed':False,'error':str(e)[:1200],'limitation':'Service-worker upgrade can be proven; installed OS application not yet proven'}
  result={'actual_version':'1.4.26','cache_keys':keys,'controlled':True,'synthetic_worker':False,'profile':str(PROFILE),'installation':install}
 elif args.mode=='after':
  before=json.loads((O/'pwa-before.json').read_text(encoding='utf-8'))
  page.evaluate("async()=>{const r=await navigator.serviceWorker.getRegistration('/unificado/');if(r)await r.update()}")
  page.wait_for_function("async()=>(await caches.keys()).includes('concrefer-unificado-shell-v1.4.27')",timeout=90000)
  page.reload(wait_until='networkidle');assert page.evaluate("localStorage.getItem('login-uni-upgrade-sentinel')")=='preservar'
  assert 'Uni 1.4.27' in page.locator('body').inner_text()
  cdp=ctx.browser.new_browser_cdp_session();os_state={}
  try:os_state=cdp.send('PWA.getOsAppState',{'manifestId':BASE+'/unificado/mapa/operacao/index.html'})
  except Exception as e:os_state={'error':str(e)[:500]}
  result={'before':before,'after_cache_keys':page.evaluate('caches.keys()'),'cache_cleared_manually':False,'storage_sentinel_preserved':True,'new_version_visible':True,'manifest':page.evaluate("async()=>(await fetch('/unificado/manifest.webmanifest',{cache:'no-store'})).json()"),'os_app_state':os_state,'installed_app_upgrade_proven':before['installation'].get('installed',False)}
  page.screenshot(path=str(O/'pwa-after.png'))
  if before['installation'].get('installed'):
   cdp.send('PWA.launch',{'manifestId':BASE+'/unificado/mapa/operacao/index.html'})
   deadline=time.monotonic()+15;app=None
   while time.monotonic()<deadline:
    for tab in ctx.pages:
     try:
      if tab.evaluate("matchMedia('(display-mode: standalone)').matches"):app=tab;break
     except Exception:pass
    if app:break
    page.wait_for_timeout(250)
   assert app is not None,'No standalone installed app window found'
   app.wait_for_load_state('domcontentloaded');app.screenshot(path=str(O/'pwa-installed-after.png'))
   result['standalone_app_opened']=True;result['installed_metadata_after']=installed_metadata(ctx)
 else:
  upgrade=json.loads((O/'pwa-after.json').read_text(encoding='utf-8'));assert upgrade['installed_app_upgrade_proven'] and upgrade['storage_sentinel_preserved']
  cdp=ctx.browser.new_browser_cdp_session();prior=installed_metadata(ctx)
  cdp.send('PWA.uninstall',{'manifestId':BASE+'/unificado/mapa/operacao/index.html'})
  attempts=[]
  for install_url in [BASE+'/unificado/login.html',BASE+'/unificado/login.html',BASE+'/unificado/']:
   try:cdp.send('PWA.install',{'manifestId':BASE+'/unificado/mapa/operacao/index.html','installUrlOrBundleUrl':install_url});break
   except Exception as e:attempts.append(str(e))
  else:raise RuntimeError('; '.join(attempts))
  current=installed_metadata(ctx);assert any(app.get('name')=='Uni' for app in current['chrome_apps']),current
  result={'after_upgrade_without_reinstall':prior,'after_separate_name_reinstall_test':current,'name_uni_proven_after_reinstall':True,'upgrade_evidence_saved_before_reinstall':True,'scope':'Only the 18446 test app in its dedicated Chrome profile; production app untouched'}
 (O/('pwa-'+args.mode+'.json')).write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps(result,ensure_ascii=True));ctx.close()
