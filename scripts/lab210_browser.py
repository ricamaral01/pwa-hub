"""Real H browser helpers. Session secrets stay only in memory; no production route."""
import json,sys
from pathlib import Path
from urllib.parse import urlsplit,quote
from lab210_resume_common import BASE,O,remote,save,under_limit
HOST=urlsplit(BASE).hostname
def session(user_id):
 assert user_id and all(c.isalnum() or c in '-_.' for c in user_id)
 code=r'''
import json,psycopg
from pathlib import Path
from urllib.parse import urlsplit
from itsdangerous import URLSafeTimedSerializer
values={}
for line in Path('/etc/concrefer-unificado/homolog/visual-mapa.env').read_text().splitlines():
 if '=' in line and not line.startswith('#'):
  k,v=line.split('=',1);values[k]=v.strip().strip('"').strip("'")
url=urlsplit(values['MAPA_AUTH_DATABASE_URL']);assert url.hostname in ['127.0.0.1','localhost'] and url.path=='/mapa_visual_homolog_20261118'
with psycopg.connect(values['MAPA_AUTH_DATABASE_URL']) as c:
 c.execute('SET TRANSACTION READ ONLY')
 row=c.execute('SELECT id,nome,perfil,updated_at FROM public.usuarios WHERE id=%s AND ativo AND deleted_at IS NULL',[%USER%]).fetchone();assert row
token=URLSafeTimedSerializer(values['MAPA_AUTH_SIGNING_KEY'],salt='mapa-login-v1').dumps({'scope':'session','id':row[0],'updated_at':row[3].isoformat()})
print(json.dumps({'cookie':token,'id':row[0],'name':row[1],'role':row[2]}))
'''.replace('%USER%',repr(user_id))
 return remote(code,'/opt/concrefer-unificado/homolog-next/visual-full/mapa/.venv/bin/python')
def context_for(browser,actor,writes=False):
 context=browser.new_context(viewport={'width':1440,'height':1000},service_workers='block',accept_downloads=True,timezone_id='America/Sao_Paulo')
 context.add_cookies([{'name':'mapa_unificado_homolog_session','value':actor['cookie'],'domain':HOST,'path':'/','httpOnly':True,'secure':True}])
 context.add_init_script("localStorage.setItem('pwa_mapa_auth_session_v1',"+json.dumps(json.dumps({k:actor[k] for k in ['id','name','role']}))+');')
 def restrict(route):
  u=urlsplit(route.request.url);method=route.request.method
  bootstrap=method=='POST' and u.path in ['/unificado/mapa/api/unified/laboratorio-bootstrap','/unificado/mapa/api/unified/suprimentos-bootstrap','/unificado/mapa/api/unified/qualidade-bootstrap']
  permitted_write=writes and method=='POST' and any(u.path=='/unificado/laboratorio/'+unit+'/cec-api/'+operation for unit in ['pederneiras','ribeirao'] for operation in ['moldagens','qrcp'])
  if u.scheme in ['http','https'] and u.netloc!=urlsplit(BASE).netloc:return route.abort()
  if method not in ['GET','HEAD','OPTIONS'] and not bootstrap and not permitted_write:return route.abort()
  route.continue_()
 context.route('**/*',restrict);return context
def screen(page,path):
 response=page.goto(BASE+'/unificado/?view='+quote(path,safe=''),wait_until='domcontentloaded',timeout=45000)
 page.wait_for_timeout(2000)
 try:page.get_by_text('Carregando tela...',exact=True).wait_for(state='hidden',timeout=15000)
 except Exception:pass
 frames=[f for f in page.frames if '/unificado/'+path.split('?')[0].rstrip('/') in f.url and f!=page.main_frame]
 for f in frames:
  try:f.wait_for_function('document.body && document.body.innerText.trim().length>70',timeout=10000)
  except Exception:pass
 return response,frames
def pool_probe(name):
 from playwright.sync_api import sync_playwright
 before=under_limit('pool-'+name+'-before-screen');actor=session('user-ricardo');errors=[];bad=[]
 with sync_playwright() as pw:
  browser=pw.chromium.launch(channel='msedge',headless=True);context=context_for(browser,actor);page=context.new_page();page.on('pageerror',lambda e:errors.append(str(e)));page.on('response',lambda r:bad.append({'path':urlsplit(r.url).path,'status':r.status}) if r.status>=500 else None)
  page.goto(BASE+'/unificado/login.html',wait_until='domcontentloaded')
  page.evaluate("async()=>{const r=await fetch('/unificado/mapa/api/unified/pcp-session');if(r.ok){const d=await r.json();localStorage.setItem('pcp_token',d.access_token);localStorage.setItem('pcp_user',JSON.stringify(d.usuario))}}")
  response,frames=screen(page,'armacao/' if name=='armacao' else 'pcp/programacao-semanal/')
  texts=[{'url':f.url.split('?')[0],'text':f.locator('body').inner_text()[:650]} for f in frames]
  if not texts:texts=[{'url':page.url.split('?')[0],'text':' '.join(page.locator('main').all_inner_texts())[:650]}]
  screenshot='pool-'+name+'-screen.png';page.screenshot(path=str(O/screenshot));opened=response.status==200 and any(len(t['text'])>70 for t in texts) and not page.get_by_text('Carregando tela...',exact=True).is_visible() and '/login.html' not in page.url
  result={'service':name,'opened':opened,'http':response.status,'frames':texts,'js_errors':errors,'server_errors':bad,'screenshot':screenshot,'actor':actor['id'],'business_writes_blocked':True}
  context.close();browser.close()
 after=under_limit('pool-'+name+'-after-screen');result['counts']={'before_total':before['total_activity'],'after_total':after['total_activity'],'after_service':after['by_service'].get('unificado-visual-homolog-'+name+'.service',0)};save('pool-'+name+'-screen.json',result)
 if not opened or bad:raise RuntimeError('Pool service screen failed: '+name)
 print(json.dumps(result,ensure_ascii=True))
if __name__=='__main__':pool_probe(sys.argv[1])
