"""Read-only phase-zero capture. Refuse the production origin."""
import json,os,re,sys,time
from pathlib import Path
from urllib.parse import urlsplit,quote
from playwright.sync_api import sync_playwright,expect
from homolog_session import test_cookie_for

ROOT=Path(__file__).resolve().parents[2]
BASE=os.environ.get('UNIFICADO_BASE_URL','https://concrefer.concretrack.com.br:18446').rstrip('/')
assert urlsplit(BASE).port==18446,'Only isolated homologation is allowed'
OUT=ROOT/'docs/revisao-visual-unificado/homolog/fase-0/antes'
OUT.mkdir(parents=True,exist_ok=True)
VIEWS={
 'inicio':'','planejamento':'@planejamento','acesso-rapido':'@quick',
 'numeros-serie':'pcp/numeros-serie/','programacao-semana':'pcp/programacao-semanal/',
 'armaduras':'pcp/armaduras/','etiquetas':'pcp/etiquetas-sc/',
 'suprimentos-painel':'suprimentos/painel/','suprimentos-solicitacoes':'suprimentos/solicitacoes/',
 'suprimentos-nova':'suprimentos/nova/','suprimentos-cotacoes':'suprimentos/cotacoes/',
 'suprimentos-fornecedores':'suprimentos/fornecedores/','suprimentos-almoxarifado':'suprimentos/almoxarifado/',
 'suprimentos-inventario':'suprimentos/inventario/','laboratorio':'@laboratorio',
 'laboratorio-cp':'laboratorio/novo/postes/','usinas':'usinas/',
 'carta-traco':'usinas/carta-traco.html','qualidade':'qualidade/',
 'logistica':'logistica/','mapa':'mapa/operacao/?tela=LIBERACAO',
 'manutencao-usina':'manutencao-usina/','relatorios':'relatorios/acmp-concretagem/',
 'producao':'producao/indicadores-gerais/','mobile-maodeobra':'m/maodeobra/',
 'mobile-inspecao':'m/inspecao/',
}
SIZES=[(1440,900),(1024,768),(820,1180),(390,844)]
results=[]
with sync_playwright() as p:
 browser=p.chromium.launch(channel='msedge',headless=True)
 context=browser.new_context(service_workers='block')
 context.add_cookies([{'name':'mapa_unificado_homolog_session','value':test_cookie_for('user-ricardo'),'domain':'concrefer.concretrack.com.br','path':'/unificado/','secure':True,'httpOnly':True,'sameSite':'Lax'}])
 page=context.new_page();errors=[];bad=[];blocked=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.on('response',lambda r:bad.append({'url':r.url,'status':r.status}) if r.status>=400 else None)
 def restrict(r):
  u=urlsplit(r.request.url)
  if u.scheme in ('http','https') and u.netloc!=urlsplit(BASE).netloc and u.hostname not in ['fonts.googleapis.com','fonts.gstatic.com']:
   blocked.append(r.request.url);r.abort();return
  r.continue_()
 page.route('**/*',restrict)
 page.goto(BASE+'/unificado/login.html',wait_until='domcontentloaded')
 page.evaluate("localStorage.setItem('pwa_mapa_auth_session_v1',JSON.stringify({id:'user-ricardo',role:'GERENCIA',name:'Ricardo'}))")
 linked=page.evaluate("""async()=>{let r=await fetch('/unificado/mapa/api/unified/pcp-session');if(!r.ok)return r.status;let d=await r.json();localStorage.setItem('pcp_token',d.access_token);localStorage.setItem('pcp_user',JSON.stringify(d.usuario));return r.status;}""")
 probes=page.evaluate("""async()=>{const paths=['postes-series/previsao?semana=2026-11-16','programacao-semanal?semana=2026-11-16&grupo=12','armaduras/programacao?semana=2026-11-16&grupo=12'];let out=[];for(const path of paths){let r=await fetch('/unificado/pcp/api/'+path,{headers:{Authorization:'Bearer '+localStorage.getItem('pcp_token'),'X-Unificado-Screen':'postesNumerosSerie'}});out.push({path,status:r.status,body:(await r.text()).slice(0,250)})}return out;}""")
 print(json.dumps({'linked_pcp':linked,'probes':probes}),flush=True)
 for name,view in VIEWS.items():
  start=len(errors);first_bad=len(bad)
  try:
   page.set_viewport_size({'width':1440,'height':900})
   target=BASE+'/unificado/'+(('?view='+quote(view,safe='')) if view and not view.startswith('@') else '')
   page.goto(target,wait_until='domcontentloaded',timeout=25000)
   if view.startswith('@') and view!='@quick':
    mod=view[1:]
    page.wait_for_function('window.UnificadoSidebarModelA && window.UnificadoScreenAccess',timeout=15000)
    page.evaluate('(m)=>window.UnificadoSidebarModelA.selectModule(m)',mod)
   try:page.wait_for_load_state('networkidle',timeout=3500)
   except Exception:pass
   frames=[f.url for f in page.frames]
   texts=[f.locator('body').inner_text(timeout=2000)[:3500] for f in page.frames if f.url.startswith(BASE)]
   shots=[]
   for width,height in SIZES:
    page.set_viewport_size({'width':width,'height':height})
    shot=OUT/f'{name}-{width}.png';page.screenshot(path=str(shot));shots.append(str(shot.relative_to(ROOT)))
   results.append({'screen':name,'view':view,'url':page.url,'frames':frames,'text':texts,'errors':errors[start:],'http_errors':bad[first_bad:],'screenshots':shots})
   print(name,'captured',flush=True)
  except Exception as exc:
   results.append({'screen':name,'error':str(exc),'url':page.url,'http_errors':bad[first_bad:]});print(name,type(exc).__name__,flush=True)
 for width,height in SIZES:
  clean=browser.new_context(viewport={'width':width,'height':height},service_workers='block')
  lp=clean.new_page();lp.goto(BASE+'/unificado/login.html',wait_until='networkidle');lp.screenshot(path=str(OUT/f'login-{width}.png'));clean.close()
 context.close();browser.close()
(OUT.parent/'baseline-results.json').write_text(json.dumps({'base':BASE,'pcp_session':linked,'api_probes':probes,'screens':results,'blocked_origins':sorted(set(blocked))},ensure_ascii=False,indent=2),encoding='utf-8')
