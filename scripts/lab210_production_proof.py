"""Serial H/prod Lab access proofs, no valid business writes in production.

The release identity signature stays in memory. POST probes use {} and target
expected denials; bootstrap creates only the existing central Lab session.
"""
import json,sys,time
from pathlib import Path
from urllib.parse import urlsplit,quote
from playwright.sync_api import sync_playwright
from lab210_production_common import R,O,remote,save,activity
PAGES=[('','geral'),('etiquetas/','etiquetas'),('leitura/','leitura'),('analise/resultado-cp.html','resultados'),('rompimentos-mes/','mes'),('analise/','analise'),('analise/relatorio.html','relatorio')]

def identities(env):
    assert env in ['homolog','production']
    code=r'''
import ast,json,subprocess
from pathlib import Path
import psycopg
from itsdangerous import URLSafeTimedSerializer
from urllib.parse import urlsplit
homolog=%HOMOLOG%
unit='unificado-visual-homolog-mapa.service' if homolog else 'mapa-unificado-auth.service'
pid=int(subprocess.check_output(['systemctl','show',unit,'-p','MainPID','--value'],text=True))
values=dict(p.decode().split('=',1) for p in Path('/proc/'+str(pid)+'/environ').read_bytes().split(b'\0') if b'=' in p)
u=urlsplit(values['MAPA_AUTH_DATABASE_URL']);assert u.hostname in ['127.0.0.1','localhost'] and u.path==('/mapa_visual_homolog_20261118' if homolog else '/mapa_unificado_teste')
app=Path('/opt/concrefer-unificado/homolog-next/visual-full/mapa/app.py' if homolog else '/opt/concrefer-unificado/mapa-api/app.py')
cookie=next(ast.literal_eval(n.value) for n in ast.parse(app.read_text()).body if isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='COOKIE_NAME' for t in n.targets))
signer=URLSafeTimedSerializer(values['MAPA_AUTH_SIGNING_KEY'],salt='mapa-login-v1')
out=[]
with psycopg.connect(values['MAPA_AUTH_DATABASE_URL']) as c:
 c.execute('SET TRANSACTION READ ONLY')
 for uid in ['alex','marcelo','philippe','user-ricardo','francisco','ricardogoncalvesrb']+(['e2e-lab-probe','diegom'] if homolog else ['francielli.moura','tv']):
  row=c.execute('SELECT id,nome,perfil,updated_at,primeiro_acesso FROM public.usuarios WHERE id=%s AND ativo AND deleted_at IS NULL',[uid]).fetchone()
  assert row,uid
  token=signer.dumps({'scope':'legacy_session' if row[4] else 'session','id':row[0],'updated_at':row[3].isoformat()})
  out.append({'id':row[0],'name':row[1],'role':row[2],'cookie_name':cookie,'cookie':token})
print(json.dumps(out))
'''.replace('%HOMOLOG%',repr(env=='homolog'))
    return remote(code,'/opt/concrefer-unificado/homolog-next/visual-full/mapa/.venv/bin/python')

def guard(label,result):
    snap=activity();result.setdefault('capacity_samples',[]).append({'case':label,**snap});save(result['environment']+'-access.json',result)
    if snap['total_activity']>80:raise RuntimeError('CAPACITY_PAUSED above80: '+str(snap['total_activity']))
    if result['environment']=='production' and snap['common_headroom_excluding_collector']<25:raise RuntimeError('Production capacity headroom below25: '+str(snap['common_headroom_excluding_collector']))
    return snap

def proof(env):
    base='https://concrefer.concretrack.com.br'+(':18446' if env=='homolog' else '')
    result={'environment':env,'base':base,'cases':[],'denied_writes':[],'ui':[],'business_writes':0,'passed':False}
    people=identities(env)
    if env=='production':people.sort(key=lambda actor:(0 if actor['id'] in ['francisco','ricardogoncalvesrb'] else 1,actor['id']))
    with sync_playwright() as pw:
        browser=pw.chromium.launch(channel='msedge',headless=True)
        for actor in people:
            uid=actor['id'];context=browser.new_context(viewport={'width':1440,'height':900},service_workers='block')
            context.add_cookies([{'name':actor['cookie_name'],'value':actor['cookie'],'domain':'concrefer.concretrack.com.br','path':'/unificado/','secure':True,'httpOnly':True}])
            context.add_init_script("localStorage.setItem('pwa_mapa_auth_session_v1',"+json.dumps(json.dumps({k:actor[k] for k in ['id','name','role']}))+');')
            blocked=[]
            def restrict(route):
                request=route.request;u=urlsplit(request.url)
                bootstrap=request.method=='POST' and u.path=='/unificado/mapa/api/unified/laboratorio-bootstrap'
                if u.netloc!=urlsplit(base).netloc or request.method not in ['GET','HEAD','OPTIONS'] and not bootstrap:
                    blocked.append({'path':u.path,'method':request.method});return route.abort()
                return route.continue_()
            context.route('**/*',restrict)
            bootstrap=context.request.post(base+'/unificado/mapa/api/unified/laboratorio-bootstrap',data={})
            assert bootstrap.status in [200,403],(uid,bootstrap.status)
            if uid=='alex':
                users=context.request.get(base+'/unificado/mapa/api/unified/users');assert users.status==200
                result['central_roles']=[{k:u.get(k) for k in ['id','login','name','unit','extra_units','planning_role','production_role','laboratory_role']} for u in users.json()['users'] if u['id'] in ['francisco','ricardogoncalvesrb','francielli.moura']]
                assert next(u for u in result['central_roles'] if u['id']=='francisco')['laboratory_role']=='tecnico'
                assert next(u for u in result['central_roles'] if u['id']=='ricardogoncalvesrb')['laboratory_role']=='admin'
            page=context.new_page();errors=[];http_errors=[];scope={'allowed':False};page.on('pageerror',lambda e:errors.append(str(e)))
            def response_check(response):
                path=urlsplit(response.url).path
                if scope['allowed'] and response.status>=400 and (path.startswith('/unificado/laboratorio/') or path.startswith('/unificado/vendor/')):http_errors.append({'path':path,'status':response.status})
            page.on('response',response_check)
            for unit,name in [('pederneiras','Pederneiras'),('ribeirao','Ribeirão Preto')]:
                allowed=uid in ['alex','marcelo','philippe','user-ricardo'] or uid=='francisco' and unit=='pederneiras' or uid=='ricardogoncalvesrb' and unit=='ribeirao'
                scope['allowed']=allowed
                for path,label in PAGES:
                    guard(uid+'-'+unit+'-'+label,result)
                    response=context.request.get(base+'/unificado/laboratorio/'+unit+'/cec/'+path)
                    case={'actor':uid,'unit':unit,'screen':label,'status':response.status,'expected':200 if allowed else 403};result['cases'].append(case)
                    assert response.status==case['expected'],case
                if allowed:
                    me=context.request.get(base+'/unificado/laboratorio/'+unit+'/cec-api/auth/me');assert me.status==200,(uid,unit,me.status)
                    data=me.json();assert data['id']==uid;result.setdefault('authors',[]).append({'actor':uid,'unit':unit,'response_id':data['id'],'role':data.get('role')})
                    if env=='production' and uid in ['alex','francisco','ricardogoncalvesrb']:
                        for operation in ['massadas','qrcp','rompimentos-grupos']:
                            answer=context.request.get(base+'/unificado/laboratorio/'+unit+'/cec-api/'+operation);assert answer.status==200,(uid,unit,operation,answer.status)
                            payload=answer.json();rows=payload['rows'] if operation=='rompimentos-grupos' else payload
                            assert isinstance(rows,list),(unit,operation,type(rows).__name__)
                            if operation=='massadas' and unit=='pederneiras':assert not {70195,70990,70991,70992,70993,70994,70995,70996}.intersection(x['id'] for x in rows)
                            result.setdefault('api_data_checks',[]).append({'actor':uid,'unit':unit,'operation':operation,'status':answer.status,'rows':len(rows)})
                    for path,label in [('', 'geral'),('leitura/','leitura')]:
                        response=page.goto(base+'/unificado/?view='+quote('laboratorio/'+unit+'/cec/'+path,safe=''),wait_until='domcontentloaded',timeout=45000)
                        frame=page.frame_locator('iframe').first
                        # The router owns the same-origin frame; wait for unit heading.
                        frame.locator('.lab-unit-name').filter(has_text=name).wait_for(timeout=25000)
                        try:page.wait_for_load_state('networkidle',timeout=5000)
                        except Exception:pass
                        text=frame.locator('body').inner_text();assert 'Conta antiga' not in text
                        shot=f'{env}-{uid}-{unit}-{label}.png' if env=='homolog' else None
                        if shot:page.screenshot(path=str(O/shot))
                        result['ui'].append({'actor':uid,'unit':unit,'screen':label,'screenshot':shot,'unit_heading':name,'http':response.status})
                else:
                    for operation in ['moldagens','qrcp']:
                        # No valid payload can be written even if authorization regresses.
                        response=context.request.post(base+'/unificado/laboratorio/'+unit+'/cec-api/'+operation,data={})
                        case={'actor':uid,'unit':unit,'operation':operation,'status':response.status,'expected':403,'empty_payload':True};result['denied_writes'].append(case);assert response.status==403,case
                    if uid in ['francisco','ricardogoncalvesrb']:
                        page.goto(base+'/unificado/?view='+quote('laboratorio/'+unit+'/cec/leitura/',safe=''),wait_until='domcontentloaded')
                        page.get_by_text('Você não tem acesso a esta tela',exact=True).wait_for(timeout=25000)
                        shot=f'{env}-{uid}-{unit}-negado.png' if env=='homolog' else None
                        if shot:page.screenshot(path=str(O/shot))
                        result['ui'].append({'actor':uid,'unit':unit,'screen':'denied','screenshot':shot})
                save(env+'-access.json',result)
            result.setdefault('browser_errors',[]).extend(errors);result.setdefault('http_errors',[]).extend(http_errors)
            assert not http_errors,(uid,http_errors)
            context.close()
            print(json.dumps({'environment':env,'actor':uid,'screen_cases':len(result['cases']),'denied_posts':len(result['denied_writes'])}),flush=True)
        browser.close()
    assert not result.get('browser_errors'),result.get('browser_errors')
    result['passed']=True;save(env+'-access.json',result)
    print(json.dumps({'environment':env,'screen_cases':len(result['cases']),'denied_posts':len(result['denied_writes']),'ui':len(result['ui']),'passed':True}))
    return result
if __name__=='__main__':proof(sys.argv[1])
