"""Usinas access matrix: existing nine profiles, identical grants before/after."""
import json,sys
from pathlib import Path
from playwright.sync_api import sync_playwright
from producao_resume_runtime import actors,start,count
R=Path(__file__).resolve().parents[2];O=R/'docs/revisao-visual-unificado/homolog/usinas-sobreposicao-20261120';BASE='https://concrefer.concretrack.com.br:18446';mode=sys.argv[1];assert mode in ['before','after'];rows=[]
with sync_playwright() as pw:
 b=pw.chromium.launch(channel='msedge',headless=True)
 for actor in actors('homolog'):
  connections=count();ctx,page,errors,blocked=start(b,actor,'homolog',bootstrap=True,initial_module='usinas');data=page.evaluate("()=>{const s=UnificadoSidebarModelA.snapshot();return {allowed:s.allowedModuleIds.includes('usinas'),opened:document.querySelector('.module-page:not([hidden])')?.dataset.module,items:s.allowedItemIds.filter(id=>MENU_ITEMS[id]?.module==='usinas'||MENU_ITEMS[id]?.moduleId==='usinas').sort()}}")
  assert (data.get('opened')=='usinas')==data['allowed'];native=False
  if data['allowed']:
   page.evaluate("()=>UnificadoRouter.open('/unificado/usinas/','usinasInicio')");frame=page.frame_locator('iframe[src*="/usinas/"]').first;frame.locator('#linhas tr').first.wait_for(timeout=45000);native=True
  rows.append({'origin':actor['category'],'profile':actor['role'],'account':actor['id'],'allowed':data['allowed'],'allowed_items':data['items'],'native_opened':native,'connections':connections,'js_errors':errors,'ok':not errors});assert not errors,errors;ctx.close();print(json.dumps({'profile':actor['role'],'allowed':data['allowed'],'items':len(data['items']),'ok':True}),flush=True)
 b.close()
result={'mode':mode,'profiles':len(rows),'rows':rows,'ok':all(r['ok'] for r in rows)}
if mode=='after':
 before=json.loads((O/'profiles-before.json').read_bytes());project=lambda r:[{k:v for k,v in row.items() if k in ['origin','profile','account','allowed','allowed_items','native_opened']} for row in r['rows']];assert project(before)==project(result);result['permissions_unchanged']=True
(O/f'profiles-{mode}.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
