"""Real IAM navigation and data, plus explicitly labelled shortcut component preview."""
import ast,json,sys
from pathlib import Path
from urllib.parse import urlsplit
from playwright.sync_api import sync_playwright,expect
from visual_phase05_sessions import sessions
ROOT=Path(__file__).resolve().parents[2];BASE='https://concrefer.concretrack.com.br:18446';OUT=ROOT/'docs/revisao-visual-unificado/homolog/fase-2'
if '--out-phase' in sys.argv:OUT=ROOT/'docs/revisao-visual-unificado/homolog'/sys.argv[sys.argv.index('--out-phase')+1]
OUT.mkdir(parents=True,exist_ok=True)
identities=sessions();results=[]
with sync_playwright() as p:
 browser=p.chromium.launch(channel='msedge',headless=True)
 for role,d in identities.items():
  if '--role' in sys.argv and role!=sys.argv[sys.argv.index('--role')+1]:continue
  ctx=browser.new_context(service_workers='block',viewport={'width':1440,'height':900});errors=[]
  cookie={'name':'mapa_unificado_homolog_session','value':d['cookie'],'path':'/unificado/'} if d.get('cookie') else {'name':'unificado_homolog_pcp_screen','value':d['token'],'path':'/unificado/pcp/'}
  ctx.add_cookies([{**cookie,'domain':'concrefer.concretrack.com.br','secure':True,'httpOnly':True,'sameSite':'Lax'}])
  page=ctx.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
  page.route('**/*',lambda r:r.continue_() if urlsplit(r.request.url).netloc==urlsplit(BASE).netloc else r.abort())
  page.goto(BASE+'/unificado/login.html');page.evaluate("""d=>{localStorage.setItem('pcp_token',d.token);localStorage.setItem('pcp_user',JSON.stringify(d.user));if(d.mapa)localStorage.setItem('pwa_mapa_auth_session_v1',JSON.stringify({id:d.mapa.id,role:d.mapa.perfil,name:d.mapa.nome}))}""",d)
  page.goto(BASE+'/unificado/',wait_until='domcontentloaded')
  page.wait_for_function('window.UnificadoSidebarModelA && window.UnificadoScreenAccess?.ready',timeout=20000)
  page.evaluate('async()=>await window.UnificadoScreenAccess.ready')
  try:page.wait_for_load_state('networkidle',timeout=3000)
  except Exception:pass
  snapshot=page.evaluate('window.UnificadoSidebarModelA.snapshot()')
  assert snapshot['allowedModuleIds'],role
  page.locator('.nav-text-action').filter(has_text='Expandir tudo').click()
  visible=page.locator('.nav-item[data-item-id]').evaluate_all('(els)=>els.map(e=>e.dataset.itemId)')
  denied=[id for id in visible if id not in snapshot['allowedItemIds']];assert not denied,(role,denied)
  page.locator('.nav-search').fill('semanal')
  search=page.locator('.nav-tree .nav-item').all_text_contents()
  assert all('semanal' in s.lower() for s in search),(role,search)
  page.locator('.nav-search').fill('')
  api=page.evaluate("""async()=>{let out=[];for(const [path,screen] of [['postes-series/previsao?semana=2026-11-09','postesNumerosSerie'],['programacao-semanal?semana=2026-11-09','programacaoSemanal12'],['armaduras/programacao?semana=2026-11-09&grupo=12','armadurasProgramacao']]){const r=await fetch('/unificado/pcp/api/'+path,{headers:{Authorization:'Bearer '+localStorage.getItem('pcp_token'),'X-Unificado-Screen':screen}});out.push({screen,status:r.status})}return out}""")
  assert all(x['status']==200 for x in api),(role,api)
  writes=[]
  if role in ('PRODUCAO','CONSULTA'):
   writes=page.evaluate("""async()=>{let out=[];for(const [path,method] of [['programacao-semana','POST'],['armaduras/calendario','PUT']]){const r=await fetch('/unificado/pcp/api/'+path,{method,headers:{Authorization:'Bearer '+localStorage.getItem('pcp_token'),'X-Unificado-Screen':path.startsWith('armaduras')?'armadurasProgramacao':'programacaoSemanal12','Content-Type':'application/json'},body:JSON.stringify(path.startsWith('armaduras')?{dias_semana:[0,1,2,3,4],confirmado:true,revisao:1}:{semana_inicio:'2030-01-21',origem:'vazia'})});out.push({path,status:r.status})}return out}""")
   assert all(x['status']==403 for x in writes),(role,writes)
  if role=='ADMIN' and '--no-preview' not in sys.argv:
   # Verify home values against the exact same live sources, never fixture numbers.
   values=page.evaluate("""async()=>{const day=new Intl.DateTimeFormat('sv-SE',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());const headers={Authorization:'Bearer '+localStorage.getItem('pcp_token')};const p=await (await fetch('/unificado/pcp/api/dashboard?data_inicio='+day+'&data_fim='+day,{headers})).json();const m=await (await fetch('/unificado/mapa/api/rest/v1/rpc/rpc_dashboard_produtividade_resumo_v1?p_data_inicio='+day+'&p_data_fim='+day+'&p_scope=ALL')).json();return {pcp:p.por_setor,mapa:m.by_sector,rows:[...document.querySelectorAll('.sector-card')].map(e=>({sector:Number(e.dataset.sector),plan:e.querySelector('[data-stat=programado]').textContent,done:e.querySelector('[data-stat=realizado]').textContent}))}}""")
   for row in values['rows']:
    expected=next((r['qtd_programada'] for r in values['pcp'] if int(r['setor_id'])==row['sector']),None)
    assert row['plan']==('—' if expected is None else str(expected)),row
   (OUT/'home-data.json').write_text(json.dumps(values,ensure_ascii=False,indent=2),encoding='utf-8')
   # Live quick-access config remains untouched. Preview only the visual component,
   # with actual allowed destinations and an explicit screenshot label.
   module=ast.parse((ROOT/'unificado/mapa/api/quick_access.py').read_text(encoding='utf-8'))
   shortcuts=next(ast.literal_eval(n.value) for n in module.body if isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='SHORTCUTS' for t in n.targets))
   allowed=set(snapshot['allowedItemIds']);items=[]
   for item in shortcuts:
    item['destinations']=[dest for dest in item['destinations'] if dest['screen'] in allowed]
    if item['destinations']:items.append(item)
   live=page.request.get(BASE+'/unificado/mapa/api/unified/quick-access/me').json()
   fixture={'enabled':True,'home':True,'revision':0,'user':{'id':d['mapa']['id'],'name':d['mapa']['nome']},'items':items}
   page.route('**/unified/quick-access/me',lambda r:r.fulfill(json=fixture))
   for width,height in [(1440,900),(1024,768),(820,1180),(390,844)]:
    page.set_viewport_size({'width':width,'height':height});page.goto(BASE+'/unificado/',wait_until='networkidle');expect(page.locator('#uqa-home')).to_be_visible()
    page.evaluate("""()=>{const p=document.createElement('p');p.textContent='Prévia visual de componentes · configuração do usuário preservada';p.style.cssText='font-size:11px;color:var(--c-ink-2);margin-bottom:12px';document.querySelector('#uqa-home').prepend(p)}""")
    page.screenshot(path=str(OUT/f'depois/acesso-rapido-previa-{width}.png'))
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
   (OUT/'quick-access-preview.json').write_text(json.dumps({'real_api_response':live,'preview_only':True,'database_changed':False,'destinations_filtered_by_real_iam':True,'items':len(items)},indent=2))
  assert not errors,(role,errors)
  results.append({'role':role,'modules':snapshot['allowedModuleIds'],'allowed_items':len(snapshot['allowedItemIds']),'navigation_links_checked':len(visible),'unauthorized_links':denied,'search':'ok','read':api,'write_denials':writes,'js_errors':errors})
  (OUT/('acceptance-'+role.lower()+'.json')).write_text(json.dumps(results[-1],ensure_ascii=False,indent=2),encoding='utf-8')
  print(role,'passed',flush=True);ctx.close()
 browser.close()
combined=[json.loads(p.read_text(encoding='utf-8')) for p in sorted(OUT.glob('acceptance-*.json'))]
(OUT/'acceptance.json').write_text(json.dumps(combined,ensure_ascii=False,indent=2),encoding='utf-8')
