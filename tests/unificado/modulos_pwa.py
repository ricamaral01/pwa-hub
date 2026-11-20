"""Upgrade the existing dedicated test browser profile; preserve its storage."""
import argparse,json
from pathlib import Path
from playwright.sync_api import sync_playwright
from modulos_runtime import R,O,BASE,count
parser=argparse.ArgumentParser();parser.add_argument('mode',choices=['before','after']);args=parser.parse_args();count()
profile=R/'.codex-tmp/login-uni-pwa-profile';assert profile.exists(),'Use an actual existing profile, never a fabricated old worker'
with sync_playwright() as pw:
 ctx=pw.chromium.launch_persistent_context(str(profile),channel='chrome',headless=True,viewport={'width':1440,'height':1000})
 if args.mode=='before':ctx.set_offline(True)
 p=ctx.pages[0] if ctx.pages else ctx.new_page()
 if args.mode=='before':
  p.goto(BASE+'/unificado/shell/quick-access.js?v=1.4.27',wait_until='domcontentloaded')
  keys=p.evaluate('caches.keys()');assert 'concrefer-unificado-shell-v1.4.27' in keys,keys
  p.evaluate("localStorage.setItem('modulos-colunas-upgrade','preservar')")
  result={'cache_keys':keys,'actual_old_worker':True,'manually_cleared':False,'offline_observation':True,'profile':str(profile)}
 else:
  p.goto(BASE+'/unificado/login.html',wait_until='networkidle');p.evaluate("async()=>{const r=await navigator.serviceWorker.getRegistration('/unificado/');if(r)await r.update();else await navigator.serviceWorker.register('/unificado/sw.js',{scope:'/unificado/'})}")
  p.wait_for_function("async()=>(await caches.keys()).includes('concrefer-unificado-shell-v1.4.30')",timeout=90000)
  p.reload(wait_until='networkidle');assert 'Uni 1.4.30' in p.locator('body').inner_text();assert p.evaluate("localStorage.getItem('modulos-colunas-upgrade')")=='preservar'
  keys=p.evaluate('caches.keys()');assert 'concrefer-unificado-shell-v1.4.27' not in keys
  assets=p.evaluate("async()=>{const c=await caches.open('concrefer-unificado-shell-v1.4.30');return (await c.keys()).map(r=>new URL(r.url).pathname)}")
  assert all('/unificado/'+r in assets for r in ['shell/busca.js','shell/busca.css','shell/busca-sinonimos.json','shell/module-columns.css','shell/module-pages.js','shell/icons.js'])
  p.screenshot(path=str(O/'pwa-after.png'));result={'cache_keys':keys,'storage_preserved':True,'new_version_visible':True,'combined_assets_cached':True,'manual_cache_clear':False,'reinstall':False}
 (O/('pwa-'+args.mode+'.json')).write_text(json.dumps(result,indent=2),encoding='utf-8');ctx.close();print(json.dumps(result))
