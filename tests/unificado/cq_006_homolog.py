"""Read-only functional proof against the published 18446 after CQ 006."""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright
from homolog_session import test_cookie_for
from visual_phase05_sessions import sessions

R=Path(__file__).resolve().parents[2]
O=R/'docs/revisao-visual-unificado/homolog/cq-migracao-006'
BASE='https://concrefer.concretrack.com.br:18446'
PATH='/unificado/laboratorio/certificados-qualidade/'
identities=sessions()
subjects=[('GERENCIA','user-ricardo'),('LABORATORIO','user-alex'),('QUALIDADE','ilson'),('SUPRIMENTOS','e2e-suprimentos-sol')]
for role in ['PCP','PRODUCAO','CONSULTA']:
 entry=identities.get(role,{})
 subjects.append((role,entry.get('mapa',{}).get('id') if entry.get('mapa') else None))
results=[]
with sync_playwright() as pw:
 browser=pw.chromium.launch(channel='msedge',headless=True)
 for role,uid in subjects:
  if not uid:
   results.append({'profile':role,'has_central_identity':False,'expected_access':False,'reason':'Existing planning-only identity; no central CQ grant. No permissions changed.'});continue
  context=browser.new_context(service_workers='block',locale='pt-BR',timezone_id='America/Sao_Paulo',viewport={'width':1440,'height':900})
  context.add_cookies([{'name':'mapa_unificado_homolog_session','value':test_cookie_for(uid),'domain':'concrefer.concretrack.com.br','path':'/unificado/','secure':True,'httpOnly':True}])
  grant=context.request.get(BASE+'/unificado/mapa/api/unified/screen-access/me');assert grant.status==200
  access=grant.json();allowed='labCertificados' in access.get('screens',[])
  record={'profile':role,'has_central_identity':True,'expected_access':allowed,'permission_writes':0}
  response=context.request.get(BASE+PATH+'api/certificados?q=',headers={'X-Unificado-Screen':'labCertificados'})
  record['history_http_status']=response.status
  if not allowed:
   assert response.status in [401,403],(role,response.status)
   record['boundary_preserved']=True;results.append(record);context.close();continue
  assert response.status==200,(role,response.status)
  body=response.json();record['response_shape']=type(body).__name__
  page=context.new_page();errors=[];writes=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  def guard(route):
   if not route.request.url.startswith(BASE+'/'):route.abort();return
   if route.request.method not in ['GET','HEAD','OPTIONS']:
    writes.append({'method':route.request.method,'path':route.request.url.split('?')[0]});route.abort();return
   route.continue_()
  page.route('**/*',guard)
  captures=[]
  for width,height in [(1440,900),(1024,768),(820,1180),(390,844)]:
   page.set_viewport_size({'width':width,'height':height})
   with page.expect_response(lambda r:'/api/certificados?' in r.url and r.request.method=='GET') as loaded:
    opened=page.goto(BASE+PATH+'?tab=historico',wait_until='networkidle')
   assert opened.status==200 and loaded.value.status==200,(role,width)
   assert page.locator('#historico').is_visible()
   assert page.locator('#page-title').inner_text()=='Histórico de certificados'
   assert not page.locator('#notice').is_visible()
   page.evaluate('document.fonts.ready')
   file=f'historico-{role.lower()}-{width}.png';page.screenshot(path=str(O/file))
   captures.append({'width':width,'file':file,'page_status':opened.status,'history_status':loaded.value.status,'visible':True})
  record.update(captures=captures,js_errors=errors,blocked_write_attempts=writes,ok=not errors and not writes)
  assert record['ok'],record
  results.append(record);context.close()
 browser.close()
(O/'historico-perfis.json').write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'profiles_checked':len(results),'allowed_profiles':[r['profile'] for r in results if r['expected_access']],'allowed_profiles_passed':all(r.get('ok') for r in results if r['expected_access'])}))
