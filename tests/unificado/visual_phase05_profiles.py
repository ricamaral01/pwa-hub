"""Existing roles, real authorization decisions, no permission writes."""
import json,re,sys
from pathlib import Path
from urllib.parse import quote,urlsplit
from playwright.sync_api import sync_playwright,expect
from visual_phase05_sessions import sessions
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'docs/revisao-visual-unificado/homolog/fase-0.5'
BASE='https://concrefer.concretrack.com.br:18446'
identities=sessions();results=[]
with sync_playwright() as p:
 browser=p.chromium.launch(channel='msedge',headless=True)
 for role,identity in identities.items():
  if '--role' in sys.argv and sys.argv[sys.argv.index('--role')+1]!=role:continue
  assert not identity.get('unavailable'),role
  context=browser.new_context(service_workers='block',viewport={'width':1440,'height':900})
  if identity.get('cookie'):context.add_cookies([{'name':'mapa_unificado_homolog_session','value':identity['cookie'],'domain':'concrefer.concretrack.com.br','path':'/unificado/','secure':True,'httpOnly':True,'sameSite':'Lax'}])
  else:context.add_cookies([{'name':'unificado_homolog_pcp_screen','value':identity['token'],'domain':'concrefer.concretrack.com.br','path':'/unificado/pcp/','secure':True,'httpOnly':True,'sameSite':'Lax'}])
  page=context.new_page();errors=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.route('**/*',lambda r:r.continue_() if urlsplit(r.request.url).netloc==urlsplit(BASE).netloc or urlsplit(r.request.url).hostname in ('fonts.googleapis.com','fonts.gstatic.com') else r.abort())
  page.goto(BASE+'/unificado/login.html',wait_until='domcontentloaded')
  page.evaluate("""(d)=>{localStorage.setItem('pcp_token',d.token);localStorage.setItem('pcp_user',JSON.stringify(d.user));if(d.mapa)localStorage.setItem('pwa_mapa_auth_session_v1',JSON.stringify({id:d.mapa.id,role:d.mapa.perfil,name:d.mapa.nome}));}""",identity)
  read=page.evaluate("""async()=>{const cases=[['series','postes-series/previsao?semana=2026-11-09','postesNumerosSerie'],['semana','programacao-semanal?semana=2026-11-09','programacaoSemanal12'],['armaduras','armaduras/programacao?semana=2026-11-09&grupo=12','armadurasProgramacao']];let result=[];for(const [name,path,screen] of cases){const r=await fetch('/unificado/pcp/api/'+path,{headers:{Authorization:'Bearer '+localStorage.getItem('pcp_token'),'X-Unificado-Screen':screen}});result.push({name,status:r.status,detail:r.ok?null:await r.text()});}return result;}""")
  assert all(x['status']==200 for x in read),(role,read)
  positive=[]
  if role=='PCP':
   positive=page.evaluate("""async()=>{const headers={Authorization:'Bearer '+localStorage.getItem('pcp_token'),'X-Unificado-Screen':'programacaoSemanal12','Content-Type':'application/json'};let r=await fetch('/unificado/pcp/api/programacao-semanal?semana=2030-01-14',{headers}),before=await r.json();if(before.semana)throw new Error('Não sobrescrever semana existente');let c=await fetch('/unificado/pcp/api/programacao-semana',{method:'POST',headers,body:JSON.stringify({semana_inicio:'2030-01-14',origem:'vazia'})}),created=await c.json();if(c.status!==201)return [{operation:'create',status:c.status}];let product=before.setores.flatMap(s=>s.produtos).find(p=>p.formas>0&&p.codigo&&p.vol_unit);let w=await fetch('/unificado/pcp/api/programacao-semana/'+created.id+'/itens',{method:'PUT',headers,body:JSON.stringify([{data:'2030-01-14',setor_id:product.setor_id,produto_id:product.id,quantidade:1}])});return [{operation:'create',status:c.status,week_id:created.id,test_week:'2030-01-14'},{operation:'save',status:w.status}];}""")
   assert [x['status'] for x in positive]==[201,200],positive
  denials=[]
  if role in ('PRODUCAO','CONSULTA'):
   denials=page.evaluate("""async()=>{let out=[];for(const [path,screen] of [['programacao-semana','programacaoSemanal12'],['armaduras/calendario','armadurasProgramacao']]){let r=await fetch('/unificado/pcp/api/'+path,{method:path==='programacao-semana'?'POST':'PUT',headers:{Authorization:'Bearer '+localStorage.getItem('pcp_token'),'X-Unificado-Screen':screen,'Content-Type':'application/json'},body:JSON.stringify(path==='programacao-semana'?{semana_inicio:'2026-12-07',origem:'vazia'}:{dias_semana:[0,1,2,3,4],confirmado:true,revisao:1})});out.push({path,status:r.status});}return out;}""")
   assert all(x['status']==403 for x in denials),(role,denials)
   series_denial=page.evaluate("""async()=>{const r=await fetch('/unificado/pcp/api/postes-series/saldos',{method:'POST',headers:{Authorization:'Bearer '+localStorage.getItem('pcp_token'),'X-Unificado-Screen':'postesNumerosSerie','Content-Type':'application/json'},body:JSON.stringify({modelo_id:1,ano:2030,saldo_inicial:0,data_base:'2030-01-01',motivo:'Teste de recusa por perfil na homologação',revisao:0})});return {path:'postes-series/saldos',status:r.status};}""")
   assert series_denial['status']==403,(role,series_denial)
   denials.append(series_denial)
  opened=[]
  for view,marker in [('pcp/numeros-serie/','#sr-day-grid'),('pcp/programacao-semanal/','#weekly-page'),('pcp/armaduras/','#results')]:
   page.goto(BASE+'/unificado/?view='+quote(view,safe=''),wait_until='domcontentloaded')
   frame=page.frame_locator('#module-host iframe.is-active')
   try:expect(frame.locator(marker)).to_be_visible(timeout=30000)
   except Exception:
    page.screenshot(path=str(OUT/f'capturas/perfil-{role.lower()}-error.png'))
    print(json.dumps({'role':role,'view':view,'frames':[{ 'url':f.url,'text':f.locator('body').inner_text()[:1000]} for f in page.frames],'errors':errors},ensure_ascii=False));raise
   page.screenshot(path=str(OUT/f'capturas/perfil-{role.lower()}-{view.split("/")[1]}.png'))
   opened.append(view)
  assert not errors,(role,errors)
  results.append({'role':role,'paired_mapa_account':bool(identity.get('mapa')),'read':read,'positive_write_checks':positive,'write_denials':denials,'opened':opened,'errors':errors})
  (OUT/f'profiles-{role.lower()}-results.json').write_text(json.dumps(results[-1],ensure_ascii=False,indent=2),encoding='utf-8')
  print(role,'ok',flush=True);context.close()
 browser.close()
combined=[json.loads((OUT/f'profiles-{role.lower()}-results.json').read_text(encoding='utf-8')) for role in identities if (OUT/f'profiles-{role.lower()}-results.json').exists()]
(OUT/'profiles-results.json').write_text(json.dumps(combined,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'status':'ok','profiles':results},ensure_ascii=False))
