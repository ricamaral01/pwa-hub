"""Repeat nine-role, 72-module staging matrix with dynamic Armação validation."""
import json,os,subprocess,sys
from urllib.parse import urlsplit,parse_qs
from playwright.sync_api import sync_playwright
from modulos_runtime import actors,start,count,BASE,MODULES,R
from producao_resume_runtime import O
progress=O/'matrix-72-progress.json';rows=json.loads(progress.read_bytes()) if progress.exists() else [];people=actors();assert len(people)==9
with sync_playwright() as pw:
 b=pw.chromium.launch(channel='msedge',headless=True)
 for actor in people:
  completed={r['module'] for r in rows if r['origin']==actor['category'] and r['profile']==actor['role'] and r['ok']}
  if completed==set(MODULES):continue
  ctx,page,errors=start(b,actor)
  api=page.evaluate("async()=>{let r=await fetch('/unificado/armacao/api/armacao/unidades',{credentials:'same-origin',cache:'no-store'});return r.ok?await r.json():[]}")
  expected=set()
  for u in api:
   if not u['enabled']:continue
   for tab,action in [('corte','armacao.corte'),('banca','armacao.banca'),('rastreabilidade','armacao.consulta'),('supervisor','armacao.supervisor'),('cadastros','armacao.cadastros')]:
    if action in u['actions'] or 'armacao.supervisor' in u['actions'] and tab in ['corte','banca']:expected.add(u['codigo']+'|'+tab)
  for module in MODULES:
   if module in completed:continue
   count();page.goto(BASE+'/unificado/?module='+module,wait_until='domcontentloaded');page.evaluate('async()=>{await UnificadoScreenAccess.ready;await UnificadoBusca.ready()}');page.wait_for_timeout(350)
   result=page.evaluate("""module=>{const s=UnificadoSidebarModelA.snapshot(),p=document.querySelector('.module-page:not([hidden])');return {allowed:s.allowedModuleIds.includes(module),opened:p?.dataset.module===module,unauthorized:p?[...p.querySelectorAll('.module-page-link[data-item-id]')].map(a=>a.dataset.itemId).filter(Boolean).filter(id=>!s.allowedItemIds.includes(id)):[],dynamic:p?[...p.querySelectorAll('a[href]')].map(a=>{let u=new URL(a.href,location.origin);return u.pathname.includes('/armacao/')?(u.searchParams.get('unidade')+'|'+u.searchParams.get('tela')):null}).filter(Boolean):[],testInCatalog:!!MENU_ITEMS.testeProgramacao,indicatorInMenu:s.allowedItemIds.includes('indicadorGeralProducao'),indicatorInSearch:UnificadoBusca.search('indicador geral').results.some(e=>e.id==='indicadorGeralProducao'),indicatorVisible:!!p?.querySelector('[data-item-id=indicadorGeralProducao]')}}""",module)
   assert result['allowed']==result['opened'] and not result['unauthorized'] and not result['testInCatalog'],(actor['role'],module,result)
   if module=='producao' and result['allowed']:
    # The dynamic groups arrive after a separate native authorization request.
    # Wait for that render instead of treating an arbitrary 350 ms as completion.
    if expected:page.wait_for_function("n=>[...document.querySelectorAll('.module-page:not([hidden]) a[href]')].filter(a=>new URL(a.href,location.origin).pathname.includes('/armacao/')).length===n",arg=len(expected),timeout=20000)
    result['dynamic']=page.evaluate("()=>[...document.querySelectorAll('.module-page:not([hidden]) a[href]')].map(a=>{let u=new URL(a.href,location.origin);return u.pathname.includes('/armacao/')?(u.searchParams.get('unidade')+'|'+u.searchParams.get('tela')):null}).filter(Boolean)")
    assert set(result['dynamic'])==expected,(actor['role'],result['dynamic'],sorted(expected))
   if actor['category']=='PCP' and actor['role']=='PCP':assert not any(result[k] for k in ['indicatorInMenu','indicatorInSearch','indicatorVisible'])
   rows.append({'origin':actor['category'],'profile':actor['role'],'account':actor['id'],'module':module,**result,'connections':count(),'ok':True});(O/'matrix-72-progress.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2),encoding='utf-8')
  assert not errors,errors;ctx.close();print(actor['category']+'/'+actor['role']+': 8 modules OK',flush=True)
 b.close()
env={**os.environ,'UNIFICADO_BASE_URL':BASE,'PCP_ANON_EXPECTED':'401','PYTHONIOENCODING':'utf-8'};p=subprocess.run([sys.executable,'tests/unificado/modelo_a_gate.py'],env=env,capture_output=True);assert p.returncode==0,p.stdout.decode()+p.stderr.decode();(O/'gate.txt').write_bytes(p.stdout)
(O/'matrix-72.json').write_text(json.dumps({'profiles':9,'cases':len(rows),'gate':'7/7','armacao_enabled':True,'fck':25,'rows':rows,'ok':True},ensure_ascii=False,indent=2),encoding='utf-8');print('9 profiles, 72 cases, gate 7/7 OK')
