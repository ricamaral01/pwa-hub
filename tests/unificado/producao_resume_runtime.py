"""Ephemeral sessions for existing accounts; no passwords or account mutations."""
import json,subprocess,time
from pathlib import Path
from urllib.parse import urlsplit
from visual_phase05_sessions import REMOTE
R=Path(__file__).resolve().parents[2];O=R/'docs/revisao-visual-unificado/producao-20261120/retomada'
MODULES=['planejamento','producao','laboratorio','qualidade','usinas','suprimentos','logistica','ged']
def count():
 p=subprocess.run(['ssh','vps-concrefer','sudo -u postgres psql -X -qAt -c "BEGIN READ ONLY;SELECT count(*) FROM pg_stat_activity;ROLLBACK;"'],capture_output=True,text=True,check=True);n=int(p.stdout.strip());assert n<=80,('CAPACITY_STOP',n);return n
def actors(environment):
 assert environment in ['production','homolog'];count();src=REMOTE
 if environment=='production':
  src=src.replace("root=Path('/etc/concrefer-unificado/homolog')\npcp=env(root/'visual-pcp.env');mapa=env(root/'visual-mapa.env')", "pcp=env('/etc/pcp-unificado/pcp.env');mapa=env('/etc/mapa-unificado/auth.env');mapa.update(env('/etc/mapa-unificado/unified-auth.env'))")
  src=src.replace('pcp_visual_homolog_20261118','pcp_unificado_teste').replace('mapa_visual_homolog_20261118','mapa_unificado_teste')
 extra=r'''
central={}
for u in maps.values():
 if u['primeiro_acesso'] or u['id']=='user-alex':continue
 paired=any(l['mapa_login']==u['id'] and any(v['id']==l['pcp_user_id'] for v in users) for l in links)
 old=central.get(u['perfil']);old_paired=old and any(l['mapa_login']==old['id'] and any(v['id']==l['pcp_user_id'] for v in users) for l in links)
 if old is None or (paired and not old_paired) or u['id']=='alex':central[u['perfil']]=u
actors=[]
for role,u in central.items():
 entry={'category':'central','role':role,'id':u['id'],'mapa':{'id':u['id'],'perfil':role,'nome':u['nome']},'cookie':signer.dumps({'scope':'session','id':u['id'],'updated_at':u['updated_at'].isoformat()})}
 link=next((l for l in links if l['mapa_login']==u['id']),None);native=next((v for v in users if link and v['id']==link['pcp_user_id']),None)
 if native:entry.update(user=native,token=token(native))
 actors.append(entry)
for role,u in out.items():
 if not u.get('unavailable'):actors.append({'category':'PCP','role':role,'id':u['user']['username'],**u})
print(json.dumps(actors,default=str))
'''
 src=src.replace('print(json.dumps(out,default=str))',extra)
 p=subprocess.run(['ssh','vps-concrefer','/opt/concrefer-unificado/homolog-next/visual-full/mapa/.venv/bin/python','-'],input=src.encode(),capture_output=True);assert p.returncode==0,p.stderr.decode();return json.loads(p.stdout)
def start(browser,actor,environment,bootstrap=False,initial_module='producao',before_navigation=None):
 base='https://concrefer.concretrack.com.br'+(':18446' if environment=='homolog' else '');ctx=browser.new_context(viewport={'width':1440,'height':1000},service_workers='block');errors=[];blocked=[]
 allowed_bootstrap=['/unificado/mapa/api/unified/'+kind+'-bootstrap' for kind in ['laboratorio','qualidade','suprimentos']]
 def protect(route):
  req=route.request;u=urlsplit(req.url)
  if environment=='production' and u.path=='/unificado/mapa/api/unified/pcp-session':blocked.append({'method':req.method,'path':u.path,'reason':'prevent any automatic identity provisioning in read-only baseline'});return route.abort()
  if req.method not in ['GET','HEAD','OPTIONS'] and not (bootstrap and req.method=='POST' and u.path in allowed_bootstrap):blocked.append({'method':req.method,'path':u.path});return route.abort()
  if u.netloc!=urlsplit(base).netloc:return route.abort()
  route.continue_()
 ctx.route('**/*',protect)
 if before_navigation:before_navigation(ctx)
 central_cookie='mapa_unificado_homolog_session' if environment=='homolog' else 'mapa_unificado_session';pcp_cookie='unificado_homolog_pcp_screen' if environment=='homolog' else 'unificado_pcp_screen'
 if actor.get('cookie'):ctx.add_cookies([{'name':central_cookie,'value':actor['cookie'],'domain':'concrefer.concretrack.com.br','path':'/unificado/','secure':True,'httpOnly':True}])
 if actor.get('token'):ctx.add_cookies([{'name':pcp_cookie,'value':actor['token'],'domain':'concrefer.concretrack.com.br','path':'/unificado/pcp/','secure':True,'httpOnly':True}])
 page=ctx.new_page();page.on('pageerror',lambda err:errors.append(str(err)));page.goto(base+'/unificado/login.html',wait_until='domcontentloaded');page.evaluate('''a=>{if(a.token){localStorage.setItem('pcp_token',a.token);localStorage.setItem('pcp_user',JSON.stringify(a.user))}if(a.mapa)localStorage.setItem('pwa_mapa_auth_session_v1',JSON.stringify({id:a.mapa.id,role:a.mapa.perfil,name:a.mapa.nome}))}''',actor)
 page.goto(base+'/unificado/'+('?module='+initial_module if initial_module else ''),wait_until='domcontentloaded');page.wait_for_function('window.UnificadoSidebarModelA');page.evaluate('async()=>{await window.UnificadoScreenAccess?.ready;if(window.UnificadoBusca?.ready)await UnificadoBusca.ready()}');page.wait_for_timeout(600);return ctx,page,errors,blocked
