"""Freeze gate: every existing role, PCP exclusion and production-mode catalogue."""
import json,os,subprocess,sys
from pathlib import Path
from playwright.sync_api import sync_playwright
from modulos_runtime import R,BASE,MODULES,actors,start,count
O=R/'docs/revisao-visual-unificado/producao-20261120';people=actors();rows=[]
with sync_playwright() as pw:
 b=pw.chromium.launch(channel='msedge',headless=True)
 for actor in people:
  ctx,p,errors=start(b,actor)
  for module in MODULES:
   p.goto(BASE+'/unificado/?module='+module,wait_until='networkidle');p.evaluate('async()=>await UnificadoBusca.ready()')
   result=p.evaluate('''module=>{const s=UnificadoSidebarModelA.snapshot(),p=document.querySelector('.module-page:not([hidden])'),items=p?[...p.querySelectorAll('.module-page-link')].map(e=>e.dataset.itemId):[];return {allowed:s.allowedModuleIds.includes(module),opened:p?.dataset.module===module,unauthorized:items.filter(id=>!s.allowedItemIds.includes(id)),testInCatalog:!!MENU_ITEMS.testeProgramacao,testInSearch:UnificadoBusca.entries().some(e=>e.id==='testeProgramacao'),environment:UnificadoCatalogEnvironment.name,indicatorInMenu:s.allowedItemIds.includes('indicadorGeralProducao'),indicatorInSearch:UnificadoBusca.search('indicador geral').results.some(e=>e.id==='indicadorGeralProducao'),indicatorVisible:!!p?.querySelector('[data-item-id=indicadorGeralProducao]')}}''',module)
   assert not result['unauthorized'] and not result['testInCatalog'] and not result['testInSearch'] and result['environment']=='producao';assert result['allowed']==result['opened'],(actor['role'],module,result)
   if actor['category']=='PCP' and actor['role']=='PCP':assert not any(result[k] for k in ['indicatorInMenu','indicatorInSearch','indicatorVisible']),result
   rows.append({'origin':actor['category'],'profile':actor['role'],'account':actor['id'],'module':module,**result,'connections':count(),'ok':True})
   (O/'phase0-matrix-progress.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2),encoding='utf-8')
  assert not errors,errors;ctx.close();print(actor['category']+' '+actor['role']+': 8 modules OK',flush=True)
 b.close()
env={**os.environ,'UNIFICADO_BASE_URL':BASE,'PCP_ANON_EXPECTED':'401','PYTHONIOENCODING':'utf-8'};r=subprocess.run([sys.executable,'tests/unificado/modelo_a_gate.py'],cwd=R,env=env,capture_output=True,check=True);assert 'Gate Modelo A: 7/7' in r.stdout.decode('utf-8');(O/'phase0-gate.txt').write_bytes(r.stdout)
(O/'phase0-validation.json').write_text(json.dumps({'version':'1.4.30','profiles':len(people),'module_cases':len(rows),'gate':'7/7','production_catalogue_tested_on_18446':True,'pcp_indicator_hidden':True,'test_screen_omitted':True,'unauthorized_entries':0,'rows':rows,'ok':True},ensure_ascii=False,indent=2),encoding='utf-8');print('Phase 0: gate 7/7, 9 profiles, 72 module cases')
