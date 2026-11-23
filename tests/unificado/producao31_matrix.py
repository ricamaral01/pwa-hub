"""Nine-profile module matrix and generic DOM-menu to search coverage."""
import json,os,subprocess,sys
from pathlib import Path
from urllib.parse import urlsplit,parse_qs,parse_qsl,urlencode
from playwright.sync_api import sync_playwright
from producao_resume_runtime import actors,start,count,MODULES
R=Path(__file__).resolve().parents[2];O=R/'docs/revisao-visual-unificado/producao-20261120/retomada-2';env=sys.argv[1];assert env in ['homolog','production'];base='https://concrefer.concretrack.com.br'+(':18446' if env=='homolog' else '');baseline=json.loads((O.parent/'retomada/armacao-production.json').read_bytes());progress=O/('matrix-'+env+'-progress.json');rows=json.loads(progress.read_bytes()) if progress.exists() else [];profile_rows=[]
def canonical(value):
 u=urlsplit(value);query=parse_qs(u.query)
 if 'view' in query:u=urlsplit('/unificado/'+query['view'][0])
 return u.path+'?'+urlencode(sorted(parse_qsl(u.query)))+('#'+u.fragment if u.fragment else '')
with sync_playwright() as pw:
 b=pw.chromium.launch(channel='msedge',headless=True)
 people=actors(env);assert len(people)==9
 for actor in people:
  completed={r['module'] for r in rows if r['origin']==actor['category'] and r['profile']==actor['role']}
  if completed==set(MODULES):continue
  original=next(r for r in baseline if (r['origin'],r['profile'])==(actor['category'],actor['role']));expected={canonical(x['href']) for x in original['module']}
  ctx,page,errors,blocked=start(b,actor,env,bootstrap=env=='homolog',initial_module='planejamento')
  for module in MODULES:
   if module in completed:continue
   connections=count();page.goto(base+'/unificado/?module='+module,wait_until='domcontentloaded');page.evaluate('async()=>{await UnificadoScreenAccess.ready;await UnificadoBusca.ready()}');page.wait_for_timeout(500)
   if expected:page.wait_for_function("UnificadoBusca.entries().filter(e=>e.id.startsWith('armacao-')).length===20")
   snapshot=page.evaluate("()=>UnificadoSidebarModelA.snapshot()")
   if module in snapshot['allowedModuleIds']:page.wait_for_function("m=>document.querySelector('.module-page:not([hidden])')?.dataset.module===m",arg=module)
   expand=page.locator('#nav-modern button.nav-text-action').filter(has_text='Expandir tudo')
   if expand.count():expand.first.click()
   if module=='producao' and module in snapshot['allowedModuleIds'] and expected:
    page.wait_for_function("n=>[...document.querySelectorAll('.module-page:not([hidden]) a[href]')].filter(a=>a.href.includes('/armacao/')).length===n",arg=len(expected),timeout=20000)
    if expand.count():expand.first.click()
   data=page.evaluate("""()=>{const s=UnificadoSidebarModelA.snapshot(),p=document.querySelector('.module-page:not([hidden])'),entries=UnificadoBusca.entries();return {allowedModules:s.allowedModuleIds,opened:p?.dataset.module,staticUnauthorized:p?[...p.querySelectorAll('.module-page-link[data-item-id]')].map(a=>a.dataset.itemId).filter(Boolean).filter(id=>!s.allowedItemIds.includes(id)):[],dynamicMenu:[...document.querySelectorAll('#nav-modern .nav-tree a[data-item-id]')].filter(a=>!MENU_ITEMS[a.dataset.itemId]).map(a=>({id:a.dataset.itemId,url:a.href})),armacaoMenu:[...document.querySelectorAll('#nav-modern .nav-tree a[data-item-id^=armacao-]')].map(a=>a.href),moduleArmacao:p?[...p.querySelectorAll('a[href]')].map(a=>a.href).filter(url=>url.includes('/armacao/')):[],searchEntries:entries.map(e=>({id:e.id,url:String(e.url),module:e.moduleId})),indicatorInMenu:s.allowedItemIds.includes('indicadorGeralProducao'),indicatorInSearch:UnificadoBusca.search('indicador geral').results.some(e=>e.id==='indicadorGeralProducao')}}""")
   allowed=module in data['allowedModules'];assert allowed==(data.get('opened')==module),(actor['role'],module,data.get('opened'));assert not data['staticUnauthorized']
   index_urls={canonical(e['url']) for e in data['searchEntries']};missing=[e for e in data['dynamicMenu'] if canonical(e['url']) not in index_urls];assert not missing,('DYNAMIC_MENU_SCREEN_MISSING_FROM_SEARCH',env,actor['role'],module,missing)
   search_arm=[e for e in data['searchEntries'] if e['id'].startswith('armacao-')];assert {canonical(e['url']) for e in search_arm}==expected,(actor['role'],search_arm,expected);assert len(search_arm)==len(expected)
   if module=='producao' and allowed:assert {canonical(u) for u in data['moduleArmacao']}==expected,(actor['role'],'module',data['moduleArmacao'],sorted(expected));assert len(data['armacaoMenu'])==len(original['menu']),(actor['role'],'menu',data['armacaoMenu'])
   if actor['category']=='PCP' and actor['role']=='PCP':assert not data['indicatorInMenu'] and not data['indicatorInSearch']
   row={'origin':actor['category'],'profile':actor['role'],'account':actor['id'],'module':module,'allowed':allowed,'opened':data.get('opened')==module,'dynamic_menu_screens':len(data['dynamicMenu']),'missing_dynamic_search':missing,'armacao_search_screens':len(search_arm),'armacao_menu_links':len(data['armacaoMenu']) if module=='producao' else None,'armacao_module_screens':len(data['moduleArmacao']) if module=='producao' else None,'connections':connections,'ok':True};rows.append(row);progress.write_text(json.dumps(rows,ensure_ascii=False,indent=2),encoding='utf-8')
  assert not errors,errors
  if actor['id']=='alex':
   queries=json.loads((R/'tests/unificado/busca-referencia.json').read_bytes());actual=page.evaluate("qs=>qs.map(([q,id])=>({q,expected:id,actual:UnificadoBusca.search(q).results[0]?.id??null}))",queries);assert all(r['expected']==r['actual'] for r in actual),actual;(O/('queries-'+env+'.json')).write_text(json.dumps(actual,ensure_ascii=False,indent=2),encoding='utf-8')
   page.goto(base+'/unificado/?module=producao',wait_until='domcontentloaded');page.wait_for_timeout(650);page.keyboard.press('Control+k');page.locator('#uni-search-input').fill('armação');page.wait_for_timeout(100);page.screenshot(path=str(O/('armacao-search-'+env+'.png')))
  ctx.close();print(env+' '+actor['category']+'/'+actor['role']+': 8 modules and dynamic coverage OK',flush=True)
 b.close()
gate=subprocess.run([sys.executable,'tests/unificado/modelo_a_gate.py'],env={**os.environ,'UNIFICADO_BASE_URL':base,'PCP_ANON_EXPECTED':'401' if env=='homolog' else '403','PYTHONIOENCODING':'utf-8'},capture_output=True);(O/('gate-'+env+'.txt')).write_bytes(gate.stdout+gate.stderr);assert gate.returncode==0,gate.stdout.decode()+gate.stderr.decode()
result={'environment':env,'profiles':9,'cases':len(rows),'generic_dynamic_menu_coverage':True,'dynamic_modules':['Armação','GED'],'gate':'7/7','rows':rows,'max_connections':max(r['connections'] for r in rows),'ok':True};(O/('matrix-'+env+'.json')).write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps({'environment':env,'profiles':9,'cases':len(rows),'gate':'7/7','ok':True}))
