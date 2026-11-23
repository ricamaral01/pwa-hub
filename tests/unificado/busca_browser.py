"""Real isolated accounts, candidate/static publication, browser-only screen search."""
import argparse,json,mimetypes,subprocess,time
from pathlib import Path
from urllib.parse import urlsplit,unquote
from playwright.sync_api import sync_playwright
from visual_phase05_sessions import REMOTE
R=Path(__file__).resolve().parents[2];O=R/'docs/revisao-visual-unificado/homolog/busca-20261120';BASE='https://concrefer.concretrack.com.br:18446'
parser=argparse.ArgumentParser();parser.add_argument('--published',action='store_true');parser.add_argument('--perf-only',action='store_true');parser.add_argument('--quick',action='store_true');parser.add_argument('--output-dir');args=parser.parse_args()
if args.output_dir:O=Path(args.output_dir).resolve();O.mkdir(parents=True,exist_ok=True)
def count():
 value=subprocess.run(['ssh','-o','BatchMode=yes','vps-concrefer','sudo -u postgres psql -X -qAt -c "BEGIN READ ONLY; SELECT count(*) FROM pg_stat_activity; ROLLBACK;"'],capture_output=True,text=True,check=True,timeout=30);n=int(value.stdout.strip());assert n<=80,('CAPACITY_STOP',n);return n
extra=r'''
central={}
for u in maps.values():
 if u['primeiro_acesso']:continue
 if u['perfil'] not in central or u['id']=='alex':central[u['perfil']]=u
actors=[]
for role,u in central.items():actors.append({'category':'central','role':role,'id':u['id'],'mapa':{'id':u['id'],'perfil':role,'nome':u['nome']},'cookie':signer.dumps({'scope':'session','id':u['id'],'updated_at':u['updated_at'].isoformat()})})
for role,u in out.items():
 if not u.get('unavailable'):actors.append({'category':'PCP','role':role,'id':u['user']['username'],**u})
print(json.dumps(actors,default=str))
'''
count();process=subprocess.run(['ssh','-o','BatchMode=yes','vps-concrefer','/opt/concrefer-unificado/homolog-next/visual-full/mapa/.venv/bin/python','-'],input=REMOTE.replace('print(json.dumps(out,default=str))',extra),text=True,capture_output=True,check=True);actors=json.loads(process.stdout)
candidate={'index.html','login.html','sw.js','VERSION','shell/icons.js','shell/module-columns.css','shell/busca.js','shell/busca.css','shell/busca-sinonimos.json','shell/menu.config.js','shell/shell.js','shell/navigation.js','shell/module-pages.js','shell/module-pages-mobile.js','shell/modelo-a/menu.js','shell/modelo-a/menu.css','logistica/logistica-native.js'}
banner_style='<style>.test-environment-bar{position:relative;z-index:9999;padding:6px 12px;background:#fff3cd;color:#664d03;text-align:center;font:600 12px sans-serif}body{padding-top:31px}</style>';banner='<div class="test-environment-bar">AMBIENTE DE TESTE · dados isolados de homologação</div>'
matrix=[];screenshots=[];bench={}
with sync_playwright() as pw:
 b=pw.chromium.launch(channel='msedge',headless=True)
 def start(actor,width=1440,height=900):
  ctx=b.new_context(viewport={'width':width,'height':height},service_workers='block');errors=[]
  def intercept(route):
   u=urlsplit(route.request.url)
   if u.netloc!=urlsplit(BASE).netloc:return route.abort()
   rel=unquote(u.path.removeprefix('/unificado/')) or 'index.html'
   if not args.published and rel in candidate:
    p=R/'unificado'/rel
    if rel in ['index.html','login.html']:
     text=p.read_text(encoding='utf-8').replace('</head>',banner_style+'</head>').replace('<body>','<body>'+banner);return route.fulfill(body=text,content_type='text/html; charset=utf-8')
    return route.fulfill(path=str(p),content_type=mimetypes.guess_type(p.name)[0] or 'text/plain')
   route.continue_()
  ctx.route('**/*',intercept)
  if actor.get('cookie'):ctx.add_cookies([{'name':'mapa_unificado_homolog_session','value':actor['cookie'],'domain':'concrefer.concretrack.com.br','path':'/unificado/','secure':True,'httpOnly':True}])
  if actor.get('token'):ctx.add_cookies([{'name':'unificado_homolog_pcp_screen','value':actor['token'],'domain':'concrefer.concretrack.com.br','path':'/unificado/pcp/','secure':True,'httpOnly':True}])
  p=ctx.new_page();p.on('pageerror',lambda e:errors.append(str(e)));p.goto(BASE+'/unificado/login.html',wait_until='domcontentloaded')
  p.evaluate('''d=>{if(d.token){localStorage.setItem('pcp_token',d.token);localStorage.setItem('pcp_user',JSON.stringify(d.user))}if(d.mapa)localStorage.setItem('pwa_mapa_auth_session_v1',JSON.stringify({id:d.mapa.id,role:d.mapa.perfil,name:d.mapa.nome}))}''',actor)
  if actor.get('cookie'):p.evaluate("async()=>{const r=await fetch('/unificado/mapa/api/unified/pcp-session');if(r.ok){const d=await r.json();localStorage.setItem('pcp_token',d.access_token);localStorage.setItem('pcp_user',JSON.stringify(d.usuario))}}")
  p.goto(BASE+'/unificado/',wait_until='networkidle');p.wait_for_function('window.UnificadoBusca && window.UnificadoSidebarModelA');p.evaluate('async()=>await UnificadoBusca.ready()');return ctx,p,errors
 admin=next(actor for actor in actors if actor['category']=='PCP' and actor['role']=='ADMIN')
 for width,height in ([] if args.perf_only else [(1440,900)] if args.quick else [(1440,900),(1024,768),(820,1180),(390,844)]):
  initial=count();ctx,p,errors=start(admin,width,height)
  p.evaluate("localStorage.setItem('unificado.busca.recentes',JSON.stringify(['programação setor 3','slump','estoque cimento']))")
  if width==390:p.locator('.nav-mobile-search').click()
  else:p.keyboard.press('Control+k')
  p.locator('.uni-search').wait_for(state='visible');field=p.locator('#uni-search-input')
  assert field.evaluate('e=>e===document.activeElement');assert field.get_attribute('role')=='combobox'
  p.screenshot(path=str(O/f'recentes-{width}.png'));screenshots.append(f'recentes-{width}.png')
  for state,query in [('resultados','etiqueta 3'),('correcao','etiqeta 3'),('sinonimo','compressao'),('vazio','zzzzxyz')]:
   field.fill(query);p.wait_for_timeout(40)
   if state=='correcao':assert 'mostrando resultados para etiqueta' in p.locator('.uni-search-status').inner_text()
   if state=='sinonimo':assert p.locator('.uni-search-synonym').count()>0
   if state=='vazio':assert p.locator('.uni-search-status').inner_text()=="Nenhuma tela encontrada para 'zzzzxyz'."
   assert not p.evaluate('document.documentElement.scrollWidth>innerWidth+1')
   p.screenshot(path=str(O/f'{state}-{width}.png'));screenshots.append(f'{state}-{width}.png')
  # Recent queries store text only; no IDs, user identity, password or tokens.
  p.keyboard.press('Escape');assert not p.locator('.uni-search').is_visible();assert p.evaluate("JSON.parse(localStorage.getItem('unificado.busca.recentes'))[0]")=='zzzzxyz'
  assert not p.evaluate("document.querySelector('.uni-search').contains(document.activeElement)"),(width,'focus stayed in hidden dialog')
  p.evaluate("()=>{const previous=document.body.getAttribute('tabindex');document.body.tabIndex=-1;document.body.focus();if(previous===null)document.body.removeAttribute('tabindex');else document.body.setAttribute('tabindex',previous)}")
  p.keyboard.press('/');p.locator('.uni-search').wait_for(state='visible');p.get_by_role('button',name='Limpar',exact=True).click();assert p.evaluate("localStorage.getItem('unificado.busca.recentes')") is None
  field.fill('de');initial_options=p.locator('.uni-search-result').count();assert initial_options<int(p.locator('.uni-search-result').first.get_attribute('aria-setsize'))
  for _ in range(initial_options+1):p.keyboard.press('ArrowDown')
  lazy_active=field.get_attribute('aria-activedescendant');assert p.locator('#'+lazy_active).get_attribute('aria-selected')=='true';assert p.locator('.uni-search-result').count()>initial_options
  p.locator('#uni-search-results').evaluate('e=>e.scrollTop=e.scrollHeight');p.wait_for_timeout(40);assert p.locator('.uni-search-result').count()>initial_options
  field.fill('etiqueta');p.keyboard.press('ArrowDown');active=field.get_attribute('aria-activedescendant');assert active and p.locator('#'+active).get_attribute('aria-selected')=='true'
  for _ in range(9):p.keyboard.press('Tab');assert p.evaluate("document.querySelector('.uni-search').contains(document.activeElement)")
  field.focus();field.fill('etiqueta 3');p.keyboard.press('Enter');p.wait_for_function("!document.querySelector('.uni-search').open");p.wait_for_function("location.search.includes('pcp%2Fetiquetas-sc')")
  p.keyboard.press('Escape');p.goto(BASE+'/unificado/?module=planejamento',wait_until='networkidle');p.evaluate('async()=>await UnificadoBusca.ready()');p.locator('.module-page-search:visible').fill('etiqeta 3');p.wait_for_timeout(40);visible=p.locator('.module-page-link:visible');assert visible.count()==1,visible.all_text_contents()
  assert 'mostrando resultados para etiqueta' in p.locator('.uni-search-inline-feedback:visible').inner_text()
  p.keyboard.press('Control+k');assert not p.locator('.uni-search').is_visible()
  assert not errors,errors;ctx.close();count()
 if not args.perf_only and not args.quick:
  ctx,p,errors=start(admin);p.goto(BASE+'/unificado/?view=logistica%2F',wait_until='networkidle');p.locator('[aria-label="Buscar tela na Logística"]').wait_for();p.locator('[aria-label="Buscar tela na Logística"]').fill('motoritas');p.wait_for_timeout(80);assert p.locator('.lg-tool:visible').count()==1;assert 'Motoristas' in p.locator('.lg-tool:visible').inner_text();assert 'mostrando resultados para' in p.locator('.uni-search-inline-feedback:visible').inner_text();p.screenshot(path=str(O/'logistica-correcao-1440.png'));assert not errors,errors;ctx.close();count()
 # Nine existing role sessions: every returned entry is permitted before any search.
 queries=json.loads((R/'tests/unificado/busca-referencia.json').read_text(encoding='utf-8'))
 for actor in ([] if args.perf_only or args.quick else actors):
  initial=count();ctx,p,errors=start(actor)
  result=p.evaluate('''queries=>{const entries=UnificadoBusca.entries(),snap=UnificadoSidebarModelA.snapshot();const unauthorized=entries.filter(e=>!snap.allowedItemIds.includes(e.id)||!snap.allowedModuleIds.includes(e.moduleId));for(const q of queries){for(const r of UnificadoBusca.search(q[0]).results)if(!entries.some(e=>e.id===r.id))throw Error('Unauthorized search result')}return {entries:entries.length,unauthorized:unauthorized.map(e=>e.id),ids:entries.map(e=>e.id)}}''',queries)
  assert result['entries']>0 and not result['unauthorized'],(actor['role'],result)
  if actor['category']=='PCP' and actor['role']=='PCP':assert 'testeProgramacao' not in result['ids']
  matrix.append({'category':actor['category'],'role':actor['role'],'existing_user':actor['id'],'authorized_entries':result['entries'],'unauthorized_entries':result['unauthorized'],'queries_checked':len(queries),'connections_before':initial,'connections_after':count(),'ok':not errors})
  assert not errors,errors;ctx.close()
 # Measure full catalogue, not the reduced permissions of one actor, at tablet viewport.
 ctx,p,errors=start(admin,820,1180);cdp=ctx.new_cdp_session(p);cdp.send('Emulation.setCPUThrottlingRate',{'rate':2})
 p.keyboard.press('Control+k');p.locator('.uni-search').wait_for(state='visible')
 bench=p.evaluate('''()=>{const config={...MENU_CONFIG},items={...MENU_ITEMS};const rows=UnificadoBusca.catalog(config,items,UnificadoPresentation.descriptions,()=>true,{homolog:true});for(const entry of UnificadoBusca.entries())if(!rows.some(row=>row.id===entry.id))rows.push(entry);const engine=UnificadoBusca.createIndex(rows,{'CP':['corpo de prova'],'compressão':['rompimento'],'slump':['abatimento'],'traço':['dosagem'],'NF':['nota fiscal'],'etiqueta':['rótulo']});const samples=[],field=document.querySelector('#uni-search-input');const terms=['etiqeta','programacao setr 3','noroeste rompimento','corpo de prova','inventario'];const nativeFetch=window.fetch,requests=[];window.fetch=(...args)=>{requests.push(String(args[0]));return nativeFetch(...args)};for(let cycle=0;cycle<15;cycle++)for(const term of terms){const started=performance.now();engine.search(term);samples.push(performance.now()-started)};const ui=[];for(let cycle=0;cycle<10;cycle++)for(const term of terms){field.value=term;const started=performance.now();field.dispatchEvent(new Event('input',{bubbles:true}));ui.push(performance.now()-started)};window.fetch=nativeFetch;samples.sort((a,b)=>a-b);ui.sort((a,b)=>a-b);return {catalogue_size:rows.length,cpu_throttle:2,viewport:820,physical_tablet:false,engine_p95_ms:samples[Math.floor(samples.length*.95)],engine_max_ms:samples.at(-1),ui_p95_ms:ui[Math.floor(ui.length*.95)],ui_max_ms:ui.at(-1),search_fetch_calls:requests}}''')
 frames=p.evaluate('''async()=>{const input=document.querySelector('#uni-search-input'),samples=[];for(let cycle=0;cycle<3;cycle++)for(const query of ['etiqeta','programacao setr 3','noroeste rompimento','corpo de prova','inventario','de','3','prod']){await new Promise(resolve=>setTimeout(resolve,120));const started=performance.now();input.value=query;input.dispatchEvent(new Event('input',{bubbles:true}));document.querySelector('#uni-search-results').getBoundingClientRect();const processingMs=performance.now()-started;await new Promise(requestAnimationFrame);samples.push({query,processing_ms:processingMs,ms:performance.now()-started})}const values=samples.map(s=>s.ms).sort((a,b)=>a-b);return {samples,p95_ms:values[Math.floor(values.length*.95)],max_ms:values.at(-1)}}''')
 bench['input_to_frame_p95_ms']=frames['p95_ms'];bench['input_to_frame_max_ms']=frames['max_ms'];(O/'performance-frames.json').write_text(json.dumps(frames,indent=2),encoding='utf-8')
 assert not bench['search_fetch_calls'];assert bench['engine_max_ms']<50 and bench['ui_max_ms']<50 and frames['max_ms']<50,bench
 ctx.close();b.close()
if not args.perf_only and not args.quick:(O/'browser-results.json').write_text(json.dumps({'published_static':args.published,'captures':screenshots,'profiles':matrix,'concurrency':1,'permission_leaks':0,'all_ok':True},ensure_ascii=False,indent=2),encoding='utf-8')
(O/'performance.json').write_text(json.dumps(bench,indent=2),encoding='utf-8');print(json.dumps({'profiles':len(matrix),'captures':len(screenshots),'performance':bench,'ok':True}))
