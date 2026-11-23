"""Existing role sessions, actual APIs, sequential screens; no password/account writes."""
import json,subprocess
from pathlib import Path
from playwright.sync_api import sync_playwright
from visual_phase05_sessions import REMOTE
R=Path(__file__).resolve().parents[2];O=R/'docs/revisao-visual-unificado/homolog/login-uni-20261120';BASE='https://concrefer.concretrack.com.br:18446'
def count():
 r=subprocess.run(['ssh','-o','BatchMode=yes','vps-concrefer','sudo -u postgres psql -X -qAt -c "BEGIN READ ONLY; SELECT count(*) FROM pg_stat_activity; ROLLBACK;"'],capture_output=True,text=True,check=True,timeout=30);n=int(r.stdout.strip());assert n<=80,('CAPACITY_STOP',n);return n
count()
extra=r'''
central={}
for u in maps.values():
 if u['primeiro_acesso']:continue
 role=u['perfil']
 if role not in central or u['id']=='alex':central[role]=u
actors=[]
for role,u in central.items():
 actors.append({'category':'central','role':role,'id':u['id'],'mapa':{'id':u['id'],'perfil':role,'nome':u['nome']},'cookie':signer.dumps({'scope':'session','id':u['id'],'updated_at':u['updated_at'].isoformat()})})
for role,u in out.items():
 if not u.get('unavailable'):actors.append({'category':'PCP','role':role,'id':u['user']['username'],**u})
print(json.dumps(actors,default=str))
'''
script=REMOTE.replace('print(json.dumps(out,default=str))',extra)
r=subprocess.run(['ssh','-o','BatchMode=yes','vps-concrefer','/opt/concrefer-unificado/homolog-next/visual-full/mapa/.venv/bin/python','-'],input=script,text=True,capture_output=True,check=True)
actors=json.loads(r.stdout);results=[]
with sync_playwright() as pw:
 browser=pw.chromium.launch(channel='msedge',headless=True)
 for actor in actors:
  initial=count();ctx=browser.new_context(viewport={'width':1440,'height':900},service_workers='block')
  if actor.get('cookie'):ctx.add_cookies([{'name':'mapa_unificado_homolog_session','value':actor['cookie'],'domain':'concrefer.concretrack.com.br','path':'/unificado/','secure':True,'httpOnly':True}])
  if actor.get('token'):ctx.add_cookies([{'name':'unificado_homolog_pcp_screen','value':actor['token'],'domain':'concrefer.concretrack.com.br','path':'/unificado/pcp/','secure':True,'httpOnly':True}])
  page=ctx.new_page();page.goto(BASE+'/unificado/login.html',wait_until='domcontentloaded')
  page.evaluate('''d=>{if(d.token){localStorage.setItem('pcp_token',d.token);localStorage.setItem('pcp_user',JSON.stringify(d.user))}if(d.mapa)localStorage.setItem('pwa_mapa_auth_session_v1',JSON.stringify({id:d.mapa.id,role:d.mapa.perfil,name:d.mapa.nome}))}''',actor)
  if actor.get('cookie'):
   me=ctx.request.get(BASE+'/unificado/mapa/api/me');assert me.status==200,(actor['role'],me.status)
   page.evaluate("async()=>{const r=await fetch('/unificado/mapa/api/unified/pcp-session');if(r.ok){const d=await r.json();localStorage.setItem('pcp_token',d.access_token);localStorage.setItem('pcp_user',JSON.stringify(d.usuario))}}")
  page.goto(BASE+'/unificado/',wait_until='domcontentloaded');page.wait_for_function('window.UnificadoSidebarModelA && window.UnificadoScreenAccess?.ready');ready=page.evaluate('async()=>await window.UnificadoScreenAccess.ready');assert ready,(actor['role'],'access not ready')
  page.wait_for_timeout(200)
  text=page.locator('body').inner_text()
  if 'Uni 1.4.27' not in text:page.screenshot(path=str(O/'profile-failure.png'),full_page=True)
  assert 'Uni 1.4.27' in text,(actor['role'],text[:1000])
  assert not page.url.endswith('login.html')
  filename='perfil-'+actor['category'].lower()+'-'+actor['role'].lower()+'.png';page.screenshot(path=str(O/filename),full_page=True)
  results.append({'category':actor['category'],'role':actor['role'],'existing_user':actor['id'],'session_check':'real signed session; password login waived by user','ok':True,'connections_before':initial,'connections_after':count(),'screenshot':filename,'allowed_module_ids':page.evaluate('window.UnificadoSidebarModelA.snapshot().allowedModuleIds')});ctx.close()
 browser.close()
(O/'profile-matrix.json').write_text(json.dumps({'concurrency':1,'stop_above':80,'new_accounts':0,'passwords_changed':0,'password_login_waived_by_user':True,'checks':results,'all_ok':all(r['ok'] for r in results)},ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps({'profiles':len(results),'ok':True,'connection_range':[min(r['connections_before'] for r in results),max(r['connections_after'] for r in results)]}))
