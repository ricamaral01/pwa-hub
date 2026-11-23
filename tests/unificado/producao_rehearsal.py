"""Exercise the previous version and the frozen candidate, restoring on failure."""
import json,os,subprocess,sys,time
from pathlib import Path
from playwright.sync_api import sync_playwright
from modulos_runtime import R,BASE,actors,start,count
O=R/'docs/revisao-visual-unificado/producao-20261120';script=(R/'scripts/producao_rollback_rehearsal.py').read_bytes();rows=[]
def action(mode):
 p=subprocess.run(['ssh','vps-concrefer','python3','-',mode],input=script,capture_output=True);assert p.returncode==0,p.stderr.decode();return json.loads(p.stdout)
def check(version):
 count();env={**os.environ,'UNIFICADO_BASE_URL':BASE,'PCP_ANON_EXPECTED':'401','PYTHONIOENCODING':'utf-8'}
 gate=subprocess.run([sys.executable,'tests/unificado/modelo_a_gate.py'],cwd=R,env=env,capture_output=True);assert gate.returncode==0,gate.stdout.decode()+gate.stderr.decode();assert b'7/7' in gate.stdout
 actor=next(a for a in actors() if a['id']=='alex')
 with sync_playwright() as pw:
  browser=pw.chromium.launch(channel='msedge',headless=True);ctx,page,errors=start(browser,actor)
  current=page.evaluate("async()=> (await (await fetch('/unificado/VERSION',{cache:'no-store'})).text()).trim()");assert current==version,current
  page.goto(BASE+'/unificado/?module=planejamento',wait_until='networkidle');assert page.locator('.module-page:not([hidden])').get_attribute('data-module')=='planejamento';assert page.locator('.module-page:not([hidden]) .module-page-link').count()>0;assert not errors,errors
  page.screenshot(path=str(O/('rollback-'+version+'.png')),full_page=True);ctx.close();browser.close()
 return {'version':version,'gate':'7/7','alex_session':True,'planning_module':True,'screenshot':'rollback-'+version+'.png','connections':count(),'ok':True}
action('previous')
try:rows.append(check('1.4.29'))
finally:receipt=action('candidate')
rows.append(check('1.4.30'));receipt.update(checks=rows,ok=True);(O/'rollback-rehearsal.json').write_text(json.dumps(receipt,indent=2),encoding='utf-8');print(json.dumps(receipt))
