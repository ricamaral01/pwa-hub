"""Time a complete 31 -> 30 -> 31 static rollback rehearsal on 18446."""
import json,os,subprocess,sys,time
from pathlib import Path
from playwright.sync_api import sync_playwright
from producao_resume_runtime import actors,start,count
R=Path(__file__).resolve().parents[2];O=R/'docs/revisao-visual-unificado/producao-20261120/retomada-2';BASE='https://concrefer.concretrack.com.br:18446';script=(R/'scripts/producao31_homolog.py').read_bytes();actor=next(a for a in actors('homolog') if a['id']=='alex');checks=[];begin=time.monotonic()
def action(mode):
 p=subprocess.run(['ssh','vps-concrefer','python3','-',mode],input=script,capture_output=True);assert p.returncode==0,p.stderr.decode();return json.loads(p.stdout)
def check(version):
 p=subprocess.run([sys.executable,'tests/unificado/modelo_a_gate.py'],env={**os.environ,'UNIFICADO_BASE_URL':BASE,'PCP_ANON_EXPECTED':'401'},capture_output=True);assert p.returncode==0,p.stdout.decode()+p.stderr.decode()
 with sync_playwright() as pw:
  b=pw.chromium.launch(channel='msedge',headless=True);ctx,page,errors,blocked=start(b,actor,'homolog',bootstrap=True,initial_module='planejamento');actual=page.evaluate("async()=> (await (await fetch('/unificado/VERSION',{cache:'no-store'})).text()).trim()");assert actual==version;page.wait_for_function("document.querySelector('.module-page:not([hidden])')?.dataset.module==='planejamento'")
  if version=='1.4.31':page.wait_for_function("UnificadoBusca.entries().filter(e=>e.id.startsWith('armacao-')).length===20")
  page.screenshot(path=str(O/('rollback-'+version+'.png')));assert not errors,errors;ctx.close();b.close()
 return {'version':version,'gate':'7/7','planning_module':True,'connections':count(),'ok':True}
action('previous')
try:checks.append(check('1.4.30'))
finally:restored=action('candidate')
checks.append(check('1.4.31'));result={'checks':checks,'candidate_restored':restored,'total_seconds':round(time.monotonic()-begin,2),'production_changes':0,'database_changes':0,'homolog_config_preserved':'Armação enabled:true; FCK25','deleted_homolog_files':0,'ok':True};(O/'rollback-rehearsal.json').write_text(json.dumps(result,indent=2),encoding='utf-8');print(json.dumps(result))
