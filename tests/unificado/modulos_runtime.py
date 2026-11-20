"""Existing homolog sessions; block business writes, allow normal auth bootstrap."""
import json,mimetypes,subprocess
from pathlib import Path
from urllib.parse import urlsplit,unquote
from visual_phase05_sessions import REMOTE
R=Path(__file__).resolve().parents[2];O=R/'docs/revisao-visual-unificado/homolog/modulos-colunas-20261120';BASE='https://concrefer.concretrack.com.br:18446'
MODULES=['planejamento','producao','laboratorio','qualidade','usinas','suprimentos','logistica','ged']
def count():
 r=subprocess.run(['ssh','-o','BatchMode=yes','vps-concrefer','sudo -u postgres psql -X -qAt -c "BEGIN READ ONLY; SELECT count(*) FROM pg_stat_activity; ROLLBACK;"'],capture_output=True,text=True,check=True,timeout=30);n=int(r.stdout.strip());assert n<=80,('CAPACITY_STOP',n);return n
def actors():
 count()
 extra="""
central={}
for u in maps.values():
 if u['primeiro_acesso']:continue
 if u['perfil'] not in central or u['id']=='alex':central[u['perfil']]=u
actors=[]
for role,u in central.items():actors.append({'category':'central','role':role,'id':u['id'],'mapa':{'id':u['id'],'perfil':role,'nome':u['nome']},'cookie':signer.dumps({'scope':'session','id':u['id'],'updated_at':u['updated_at'].isoformat()})})
for role,u in out.items():
 if not u.get('unavailable'):actors.append({'category':'PCP','role':role,'id':u['user']['username'],**u})
print(json.dumps(actors,default=str))
"""
 r=subprocess.run(['ssh','-o','BatchMode=yes','vps-concrefer','/opt/concrefer-unificado/homolog-next/visual-full/mapa/.venv/bin/python','-'],input=REMOTE.replace('print(json.dumps(out,default=str))',extra),text=True,capture_output=True,check=True);return json.loads(r.stdout)
def start(browser,actor,width=1440,height=1000,candidate=False,environment=None):
 ctx=browser.new_context(viewport={'width':width,'height':height},service_workers='block');errors=[]
 changed={'index.html','login.html','VERSION','sw.js','shell/icons.js','shell/module-pages.js','shell/module-columns.css','shell/menu.config.js','shell/shell.js','shell/quick-access.js','shell/navigation.js'}
 def intercept(route):
  u=urlsplit(route.request.url)
  session_bootstrap=route.request.method=='POST' and u.path in ['/unificado/mapa/api/unified/laboratorio-bootstrap','/unificado/mapa/api/unified/qualidade-bootstrap','/unificado/mapa/api/unified/suprimentos-bootstrap']
  if route.request.method not in ['GET','HEAD','OPTIONS'] and not session_bootstrap:return route.abort()
  if u.netloc!=urlsplit(BASE).netloc:return route.abort()
  rel=unquote(u.path.removeprefix('/unificado/')) or 'index.html'
  if (candidate and rel in changed) or (environment and rel=='shell/menu.config.js'):
   p=R/'unificado'/rel
   if rel=='shell/menu.config.js' and environment:
    text=p.read_text(encoding='utf-8').replace("UNIFICADO_BASE.port === '18446' ? 'homolog' : 'producao'",repr(environment));return route.fulfill(body=text,content_type='text/javascript; charset=utf-8')
   if p.suffix=='.html':
    text=p.read_text(encoding='utf-8');style='<style>.test-environment-bar{position:relative;z-index:9999;padding:6px 12px;background:#fff3cd;color:#664d03;text-align:center;font:600 12px sans-serif}body{padding-top:31px}</style>';text=text.replace('</head>',style+'</head>').replace('<body>','<body><div class="test-environment-bar">AMBIENTE DE TESTE · dados isolados de homologação</div>');return route.fulfill(body=text,content_type='text/html; charset=utf-8')
   return route.fulfill(path=str(p),content_type=mimetypes.guess_type(p.name)[0] or 'text/plain')
  route.continue_()
 ctx.route('**/*',intercept)
 if actor.get('cookie'):ctx.add_cookies([{'name':'mapa_unificado_homolog_session','value':actor['cookie'],'domain':'concrefer.concretrack.com.br','path':'/unificado/','secure':True,'httpOnly':True}])
 if actor.get('token'):ctx.add_cookies([{'name':'unificado_homolog_pcp_screen','value':actor['token'],'domain':'concrefer.concretrack.com.br','path':'/unificado/pcp/','secure':True,'httpOnly':True}])
 page=ctx.new_page();page.on('pageerror',lambda e:errors.append(str(e)));page.goto(BASE+'/unificado/login.html',wait_until='domcontentloaded')
 page.evaluate('''d=>{if(d.token){localStorage.setItem('pcp_token',d.token);localStorage.setItem('pcp_user',JSON.stringify(d.user))}if(d.mapa)localStorage.setItem('pwa_mapa_auth_session_v1',JSON.stringify({id:d.mapa.id,role:d.mapa.perfil,name:d.mapa.nome}))}''',actor)
 if actor.get('cookie'):page.evaluate("async()=>{const r=await fetch('/unificado/mapa/api/unified/pcp-session');if(r.ok){const d=await r.json();localStorage.setItem('pcp_token',d.access_token);localStorage.setItem('pcp_user',JSON.stringify(d.usuario))}}")
 page.goto(BASE+'/unificado/',wait_until='networkidle');page.wait_for_function('window.UnificadoBusca && window.UnificadoSidebarModelA');page.evaluate('async()=>await UnificadoBusca.ready()');return ctx,page,errors
