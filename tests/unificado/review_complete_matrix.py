"""Open catalog screens with existing accounts on the isolated origin only."""
import argparse, asyncio, hashlib, json, sys
from datetime import datetime, timezone
from collections import Counter
from pathlib import Path
from urllib.parse import urlsplit, quote
from playwright.async_api import async_playwright
from homolog_session import test_cookie_for
from visual_phase05_sessions import sessions
from review_expectations import legacy_login_challenge,permitted_external_report,EXTERNAL_REPORT_PREFIX

ROOT = Path(__file__).resolve().parents[2]
BASE = 'https://concrefer.concretrack.com.br:18446'
OUT = ROOT / 'docs/revisao-visual-unificado/homolog/revisao-completa'
parser = argparse.ArgumentParser()
parser.add_argument('--role', default='GERENCIA')
parser.add_argument('--only', nargs='*')
parser.add_argument('--resume',action='store_true')
parser.add_argument('--concurrency',type=int,default=3)
parser.add_argument('--output-dir',default='revisao-completa')
parser.add_argument('--candidate',action='store_true')
parser.add_argument('--fresh-widths',action='store_true',help='Reload for each width; default exercises responsive resize with the same real data.')
args = parser.parse_args()
OUT=ROOT/'docs/revisao-visual-unificado/homolog'/args.output_dir
assert OUT.resolve().is_relative_to((ROOT/'docs/revisao-visual-unificado/homolog').resolve())
limit=OUT/'matrix-concurrency-limit.txt'
if limit.exists():args.concurrency=min(args.concurrency,int(limit.read_text().strip()))

async def main():
    identities = sessions()
    if args.role in ('PCP', 'PRODUCAO', 'CONSULTA'):
        identity = identities[args.role]
    else:
        uid = {'GERENCIA':'user-ricardo', 'LABORATORIO':'user-alex',
               'QUALIDADE':'ilson', 'SUPRIMENTOS':'e2e-suprimentos-sol'}[args.role]
        identity = {'cookie':test_cookie_for(uid), 'mapa':{'id':uid,'perfil':'CONVIDADO' if args.role=='SUPRIMENTOS' else 'GERENCIA','nome':args.role}}
    catalog = json.loads((OUT / 'inventario.json').read_text(encoding='utf-8'))
    results = []
    if args.resume and (OUT / ('matrix-' + args.role.lower() + '.json')).exists():
        previous_rows=json.loads((OUT / ('matrix-' + args.role.lower() + '.json')).read_text(encoding='utf-8'))
        expected_counts=Counter(r['id'] for r in catalog)
        complete_counts=Counter(r['screen'] for r in previous_rows if r.get('ok') and not r.get('standard_issues'))
        complete={screen for screen,count in complete_counts.items() if count>=expected_counts[screen]}
        args.only=[r['id'] for r in catalog if r['id'] not in complete]
    retained = 0
    previous = OUT / ('matrix-' + args.role.lower() + '.json')
    if args.only and previous.exists():
        results = [row for row in json.loads(previous.read_text(encoding='utf-8')) if row['screen'] not in args.only]
        retained = len(results)
    OUT.mkdir(parents=True, exist_ok=True)
    async with async_playwright() as pw:
        browser = await pw.chromium.launch(channel='msedge', headless=True)
        context = await browser.new_context(service_workers='block',timezone_id='America/Sao_Paulo',locale='pt-BR')
        api_lock=asyncio.Lock()
        async def candidate_asset(route):
            u=urlsplit(route.request.url)
            if not args.candidate or u.netloc!=urlsplit(BASE).netloc or not u.path.startswith('/unificado/') or route.request.method!='GET':return False
            relative=u.path.removeprefix('/unificado/')
            if relative=='VERSION':
                await route.fulfill(body=(ROOT/'unificado/VERSION').read_text(),content_type='text/plain');return True
            if not Path(relative).suffix:relative=relative.rstrip('/')+'/index.html'
            local=(ROOT/'unificado'/relative).resolve()
            safe=local.is_relative_to(ROOT/'unificado') and not {'api','backend','service'}.intersection(Path(relative).parts)
            if safe and not local.is_file() and relative.startswith('laboratorio/') and relative!='laboratorio/index.html':
                tail=relative.removeprefix('laboratorio/')
                tail={'novo/postes/index.html':'novo/postes/novo.html','novo/absorcao/index.html':'novo/postes/absorcao.html','cronoanalise/index.html':'cronoanalise/cronoanalise.html'}.get(tail,tail)
                compiled_root=ROOT/'unificado/laboratorio/service/server/static'
                legacy_root=ROOT/'unificado/laboratorio/frontend/embedded/laboratorio/server/static'
                compiled=(compiled_root/tail).resolve();legacy=(legacy_root/tail).resolve()
                if tail.startswith(('postes/','novo/postes/','cronoanalise/')) and compiled.is_relative_to(compiled_root) and compiled.is_file():local=compiled
                elif legacy.is_relative_to(legacy_root) and legacy.is_file():local=legacy
            if not safe or not local.is_file() or local.suffix not in ('.html','.css','.js','.png','.woff2','.svg'):return False
            if local.suffix=='.html':
                source=local.read_text(encoding='utf-8')
                if relative in ('index.html','login.html'):
                    source=source.replace('</head>','<style>.test-environment-bar{position:relative;z-index:9999;padding:6px 12px;background:#fff3cd;color:#664d03;text-align:center;font:600 12px sans-serif}body{padding-top:31px}</style></head>',1).replace('<body>','<body><div class="test-environment-bar">AMBIENTE DE TESTE · dados isolados de homologação</div>',1)
                await route.fulfill(body=source,content_type='text/html; charset=utf-8')
            else:await route.fulfill(path=str(local))
            return True
        async def init_asset(route):
            u=urlsplit(route.request.url)
            if u.netloc!=urlsplit(BASE).netloc:
                if permitted_external_report(route.request.url,route.request.method):
                    response=await route.fetch(max_redirects=0)
                    if 300<=response.status<400:await route.abort()
                    else:await route.fulfill(response=response)
                else:await route.abort()
                return
            if await candidate_asset(route):return
            if '/api/' in u.path:
                async with api_lock:
                    try:
                        response=await route.fetch(max_redirects=0,timeout=30000)
                        await route.fulfill(response=response)
                    except Exception:
                        try:await route.abort()
                        except Exception:pass
            else:await route.continue_()
        await context.route('**/*',init_asset)
        if identity.get('cookie'):
            await context.add_cookies([{'name':'mapa_unificado_homolog_session','value':identity['cookie'],
                'domain':'concrefer.concretrack.com.br','path':'/unificado/','secure':True,'httpOnly':True}])
            actual = await context.request.get(BASE + '/unificado/mapa/api/me')
            actor = (await actual.json())['user']
            identity['mapa'] = {'id':actor['id'],'perfil':actor.get('role',actor.get('perfil')),
                                'nome':actor.get('name',actor.get('nome'))}
        elif identity.get('token'):
            await context.add_cookies([{'name':'unificado_homolog_pcp_screen','value':identity['token'],
                'domain':'concrefer.concretrack.com.br','path':'/unificado/pcp/','secure':True,'httpOnly':True}])
        if identity.get('test_cookie'):
            await context.add_cookies([{'name':'unificado_homolog_test_session','value':identity['test_cookie'],'domain':'concrefer.concretrack.com.br','path':'/unificado/testar/','secure':True,'httpOnly':True}])
        init = await context.new_page()
        await init.goto(BASE + '/unificado/login.html', wait_until='domcontentloaded')
        await init.evaluate('''d=>{
          if(d.token){localStorage.setItem('pcp_token',d.token);localStorage.setItem('pcp_user',JSON.stringify(d.user))}
          if(d.mapa)localStorage.setItem('pwa_mapa_auth_session_v1',JSON.stringify({id:d.mapa.id,role:d.mapa.perfil,name:d.mapa.nome}));
        }''', identity)
        if identity.get('cookie'):
            await init.evaluate('''async()=>{
              const r=await fetch('/unificado/mapa/api/unified/pcp-session');
              if(r.ok){const d=await r.json();localStorage.setItem('pcp_token',d.access_token);localStorage.setItem('pcp_user',JSON.stringify(d.usuario))}
            }''')
            access = await init.evaluate("async()=>{const r=await fetch('/unificado/mapa/api/unified/screen-access/me');if(!r.ok)throw Error('screen-access/me HTTP '+r.status);const d=await r.json();if(!Array.isArray(d.screens))throw Error('Invalid screen access response');return d}")
            allowed = set(access.get('screens', []))
            for path in ['/unificado/suprimentos/session-renew','/unificado/qualidade/session-renew','/unificado/laboratorio/session-renew']:
                await context.request.get(BASE + path)
        else:
            # Planning-only cookies are checked against each protected route.
            allowed = {s['id'] for s in catalog if s['module']=='planejamento' and s.get('require') is None}
        await init.goto(BASE + '/unificado/', wait_until='domcontentloaded')
        await init.wait_for_function('window.UnificadoSidebarModelA && window.UnificadoScreenAccess?.ready')
        await init.evaluate('async()=>await window.UnificadoScreenAccess.ready')
        menu_urls = await init.evaluate('Object.fromEntries(Object.entries(MENU_ITEMS).map(([k,v])=>[k,v.url]))')
        planning_token = await init.evaluate("Boolean(localStorage.getItem('pcp_token'))")
        if not identity.get('cookie'):
            allowed = set(await init.evaluate('window.UnificadoSidebarModelA.snapshot().allowedItemIds'))
        module_allowed=set(await init.evaluate('window.UnificadoSidebarModelA.snapshot().allowedModuleIds'))
        native_denied = set()
        boundaries = []
        if any(row['module']=='suprimentos' and row['id'] in allowed and (not args.only or row['id'] in args.only) for row in catalog):
            native = await context.request.get(BASE + '/api/suprimentos/me')
            if native.status == 403:
                native_denied.add('suprimentos')
                boundaries.append({'module':'suprimentos','native_authority':'/api/suprimentos/me',
                    'status':403,'expected':'existing account is not authorized in the native module',
                    'permission_writes':0})
            else:
                assert native.status==200, ('native supply authority unavailable',native.status)
        (OUT / ('boundaries-' + args.role.lower() + '.json')).write_text(json.dumps(boundaries,indent=2))
        await init.close()
        identity_state=await context.storage_state()
        eligible = [row for row in catalog if not row.get('inactive') and (row['id'] in allowed or row.get('public') or row.get('access_screen') in allowed or args.role in row.get('role_access',[]) or (row['module']=='ged' and 'ged' in module_allowed and (not row.get('access_screen') or row['access_screen'] in allowed)))]
        (OUT/('profile-access-'+args.role.lower()+'.json')).write_text(json.dumps({'profile':args.role,'eligible_screens':[row['id'] for row in eligible],'allowed_screens':sorted(allowed),'allowed_modules':sorted(module_allowed),'permission_writes':0,'access_verified':True,'permission_source':'central screen-access/me HTTP 200' if identity.get('cookie') else 'existing planning-only identity and native sidebar snapshot'},indent=2))
        pending = [row for row in eligible if not args.only or row['id'] in args.only]
        sem = asyncio.Semaphore(args.concurrency)
        async def check(row):
            async with sem:
                case_context=await browser.new_context(storage_state=identity_state,service_workers='block',timezone_id='America/Sao_Paulo',locale='pt-BR')
                page = await case_context.new_page()
                js, http, external = [], [], []
                transport=[]
                blocked_upstreams=[]
                allowed_external=[]
                capturing=True
                page.on('pageerror', lambda e:js.append(str(e)))
                page.on('response', lambda r:http.append({'url':r.url,'status':r.status}) if r.status>=400 else None)
                async def restrict(route):
                    u = urlsplit(route.request.url)
                    if u.scheme in ('http','https') and u.netloc != urlsplit(BASE).netloc:
                        if permitted_external_report(route.request.url,route.request.method):
                            allowed_external.append({'url':route.request.url,'method':'GET'})
                            try:
                                response=await route.fetch(max_redirects=0,timeout=30000)
                                if 300<=response.status<400:
                                    external.append({'url':route.request.url,'blocked_redirect':response.headers.get('location')})
                                    await route.abort()
                                else:await route.fulfill(response=response)
                            except Exception as exc:
                                transport.append({'path':u.path,'error':type(exc).__name__})
                                await route.abort()
                        else:
                            external.append(route.request.url)
                            await route.abort()
                    elif await candidate_asset(route):return
                    elif '/api/' in u.path:
                        # Keep real endpoints/statuses/data; bound read bursts on the shared host.
                        async with api_lock:
                            try:
                                response=await route.fetch(max_redirects=0,timeout=30000)
                                await route.fulfill(response=response)
                            except Exception as exc:
                                if capturing and not page.is_closed():transport.append({'path':u.path,'error':type(exc).__name__})
                                try:await route.abort()
                                except Exception:pass
                    else:await route.continue_()
                await page.route('**/*', restrict)
                path = menu_urls.get(row['id'], row['path'] + (row.get('query') or ''))
                if path.startswith('http'):
                    parsed = urlsplit(path)
                    assert parsed.netloc == urlsplit(BASE).netloc
                    path = parsed.path + ('?' + parsed.query if parsed.query else '') + ('#'+parsed.fragment if parsed.fragment else '')
                if ':id' in path:
                    nc = json.loads((OUT.parent / 'fase-6/qualidade-flow.json').read_text(encoding='utf-8'))['nc_id']
                    path = path.replace(':id', nc)
                view = path.removeprefix('/unificado/')
                fresh_widths=args.fresh_widths or row['id'].startswith('module-')
                record = {'profile':args.role, 'screen':row['id'], 'path':path,'review_version':(ROOT/'unificado/VERSION').read_text().strip(),'viewport_mode':'fresh_navigation' if fresh_widths else 'responsive_resize','api_reads_serialized':True,'captured_at_utc':datetime.now(timezone.utc).isoformat()}
                checkpoint=OUT/'ui-frozen.json'
                if checkpoint.exists():
                    inputs=json.loads(checkpoint.read_text())['files']
                    record['ui_source_hashes']={name:hashlib.sha256((ROOT/name).read_bytes()).hexdigest() for name in inputs}
                try:
                    if identity.get('cookie'):
                        fresh_cookie=await asyncio.to_thread(test_cookie_for,identity['mapa']['id'])
                        await case_context.add_cookies([{'name':'mapa_unificado_homolog_session','value':fresh_cookie,'domain':'concrefer.concretrack.com.br','path':'/unificado/','secure':True,'httpOnly':True}])
                    await page.set_viewport_size({'width':1440,'height':900})
                    target = BASE+path if row.get('direct') else BASE + '/unificado/?view=' + quote(view,safe='')
                    response = await page.goto(target, wait_until='domcontentloaded', timeout=30000)
                    record['status'] = response.status if response else None
                    try: await page.wait_for_load_state('networkidle', timeout=4000)
                    except Exception: pass
                    if row['id'] in ('fechamentoDiario','fechamentoDiarioPcp'):
                        for frame in page.frames:
                            if '/fechamento-diario/' in frame.url and await frame.locator('#loading').count():
                                await frame.locator('#loading').wait_for(state='hidden',timeout=25000)
                    await page.wait_for_function("()=>!document.body.classList.contains('unificado-permissions-loading')&&!document.querySelector('#module-host:not([hidden]).is-loading,#module-host:not([hidden]).is-ged-loading')",timeout=45000)
                    metrics = []
                    for width,height in [(1440,900),(1024,768),(820,1180),(390,844)]:
                        await page.set_viewport_size({'width':width,'height':height})
                        if width!=1440 and fresh_widths:
                            await page.goto(target,wait_until='domcontentloaded',timeout=30000)
                            try:await page.wait_for_load_state('networkidle',timeout=4000)
                            except Exception:pass
                            await page.wait_for_function("()=>!document.body.classList.contains('unificado-permissions-loading')&&!document.querySelector('#module-host:not([hidden]).is-loading,#module-host:not([hidden]).is-ged-loading')",timeout=45000)
                        if row.get('module_unit') and width<601:
                            await page.locator('.module-page-units button').filter(has_text=row['module_unit']).click()
                        if row['id'].startswith('module-'):
                            await page.locator('.module-page:not([hidden])').wait_for(state='visible',timeout=20000)
                            if row['id']=='module-laboratorio-noroeste':
                                await page.wait_for_function("()=>document.querySelector('.module-page:not([hidden]) .module-page-description')?.textContent.includes('Noroeste')",timeout=15000)
                            record.setdefault('module_states',[]).append({'width':width,**await page.locator('.module-page:not([hidden])').evaluate("e=>({description:e.querySelector('.module-page-description')?.textContent,units:[...e.querySelectorAll('.module-page-units button')].map(b=>({label:b.textContent,selected:b.matches('.active,.is-current')}))})")})
                        if row.get('interaction') and width<768:
                            await page.locator('.nav-mobile-bottom [data-mode='+row['interaction']+']').click()
                        for step in row.get('steps',[]) if width==1440 or fresh_widths else []:
                            step_frame=next((frame for frame in page.frames if step.get('frame_path','') in frame.url),None)
                            assert step_frame is not None,('Missing tab frame',step)
                            step_target=step_frame.locator(step['selector'])
                            if step.get('text'):step_target=step_target.filter(has_text=step['text'])
                            await step_target.click()
                            try:await page.wait_for_load_state('networkidle',timeout=4000)
                            except Exception:pass
                        await page.evaluate('()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))')
                        await page.wait_for_timeout(250)
                        if row.get('query','').startswith('#'):
                            requested_hash=row['query']
                            actual_hash=urlsplit(page.url).fragment
                            record.setdefault('native_route_proof',[]).append({'width':width,'requested':requested_hash,'actual':'#'+actual_hash})
                            assert '#'+actual_hash==requested_hash,('Native route was not opened',requested_hash,actual_hash)
                        frames = []
                        for frame in page.frames:
                            if not frame.url.startswith(BASE):continue
                            await frame.wait_for_function('document.body && getComputedStyle(document.documentElement).visibility!=="hidden"',timeout=15000)
                            await frame.wait_for_function("()=>{const scope=document.querySelector('.scrim>.drawer,[role=dialog],[aria-modal=true]')||document;return ![...scope.querySelectorAll('.loading-state,#loading,.page-loading,tbody tr,.native-status,.state-card,.cr-loading,#report-feedback')].some(e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return r.width&&r.height&&s.display!=='none'&&s.visibility!=='hidden'&&/carregando|consultando dados|preparando consulta/i.test(e.textContent)})}",timeout=30000)
                            record['last_stage']='font readiness '+str(width)+' '+frame.url
                            await asyncio.wait_for(frame.evaluate('Promise.race([document.fonts.ready,new Promise(r=>setTimeout(r,2500))])'),timeout=45)
                            await frame.evaluate("Promise.race([Promise.all([...document.images].filter(i=>{const r=i.getBoundingClientRect();return r.top<innerHeight&&r.bottom>0&&r.width>0}).map(i=>i.decode().catch(()=>{}))),new Promise(r=>setTimeout(r,3000))])")
                            text = await frame.locator('body').inner_text()
                            record['last_stage']='DOM audit '+str(width)+' '+frame.url
                            audit_source=(ROOT/'tests/unificado/review_dom_audit.js').read_text(encoding='utf-8')
                            if row['id'].startswith('labDosagem'):
                                record['shadow_dom_scopes']=await frame.evaluate("[...document.querySelectorAll('*')].filter(e=>e.shadowRoot).map(e=>({host:e.tagName,id:e.id,titles:[...e.shadowRoot.querySelectorAll('h1')].map(h=>h.textContent),filters:[...e.shadowRoot.querySelectorAll('form,.ct-filter-bar')].map(f=>f.className)}))")
                            frames.append({'url':frame.url,'audit_sha256':hashlib.sha256(audit_source.encode()).hexdigest(), 'overflow':await frame.evaluate('document.documentElement.scrollWidth>innerWidth+1'),
                                'access_denied':any(v in text for v in ['Você não tem acesso a esta tela','Acesso não permitido']) or (row['id']!='shell-login' and await frame.locator('.login-layout').count()>0),
                                'blank':len(text.strip())<10, 'text':text[:180], 'audit':await asyncio.wait_for(frame.evaluate(audit_source),timeout=60)})
                        metrics.append({'width':width,'frames':frames})
                        if row['id']=='usinas-relatorios-fechamento-diario':
                            report=next((frame for frame in page.frames if frame.url.startswith(EXTERNAL_REPORT_PREFIX)),None)
                            assert report is not None,'The authorized external report did not open'
                            report_text=await report.locator('body').inner_text()
                            assert len(report_text.strip())>50 and not any(text in report_text for text in ['404 Not Found','502 Bad Gateway','ERR_CONNECTION','Traceback'])
                            record.setdefault('external_report_proof',[]).append({'width':width,'url':report.url,'text_length':len(report_text),'tables':await report.locator('table').count(),'style_scope':'Read-only external document; not restyled'})
                        if True:
                            dest = OUT / 'capturas' / args.role.lower()
                            dest.mkdir(parents=True,exist_ok=True)
                            await page.screenshot(path=str(dest / (row['id'] + '-' + str(width) + '.png')))
                    capturing=False
                    expected = [e for e in http if not planning_token and e['status'] in (401,403) and urlsplit(e['url']).path=='/unificado/mapa/api/unified/pcp-session']
                    visible_legacy_login=False
                    for frame in page.frames:
                        if not frame.url.startswith(BASE):continue
                        login=frame.locator('.native-login:not([hidden])')
                        if await login.count() and await login.is_visible():visible_legacy_login=True
                    legacy_challenges=[e for e in http if legacy_login_challenge(e,row['module'],visible_legacy_login)]
                    scope_denials = [e for e in http if row['module'] in native_denied and e['status']==403 and urlsplit(e['url']).path.startswith('/api/suprimentos/')]
                    errors = [e for e in http if e not in expected]
                    errors = [e for e in errors if e not in legacy_challenges]
                    errors = [e for e in errors if e not in scope_denials]
                    if row.get('expected_denial'):
                        record['expected_disabled_unit_denials']=[e for e in errors if e['status'] in (401,403)]
                        errors=[e for e in errors if e['status'] not in (401,403)]
                    record.update(layout=metrics, js_errors=js, http_errors=errors, transport_errors=list(transport),blocked_external_upstreams=list(blocked_upstreams), expected_capability_denials=expected,
                        expected_legacy_login_challenges=legacy_challenges,legacy_authenticated_data_verified=False if legacy_challenges else None,allowed_external_reads=allowed_external,
                        expected_native_module_denials=scope_denials, authorization_expectation='legacy login required; authenticated data not checked' if legacy_challenges else 'native module denies access' if row['module'] in native_denied else 'allowed', external_attempts=external)
                    record['standard_issues'] = sum(len(f['audit']['issues']) for m in metrics for f in m['frames'])
                    record['ok'] = record['status']==200 and not js and not errors and not external and not transport and not blocked_upstreams and all(
                        not (f['overflow'] or f['blank'] or (f['access_denied'] and row['module'] not in native_denied and not row.get('expected_denial'))) for m in metrics for f in m['frames'])
                    record['ok'] = record['ok'] and record['standard_issues']==0
                    if not record['ok']:
                        await page.screenshot(path=str(OUT / ('falha-' + args.role + '-' + row['id'] + '.png')))
                except Exception as exc:
                    capturing=False
                    record.update(ok=False, error=type(exc).__name__+': '+str(exc), js_errors=js, http_errors=http, external_attempts=external)
                await page.unroute_all(behavior='ignoreErrors')
                await page.close()
                await case_context.close()
                results.append(record)
                (OUT / ('matrix-' + args.role.lower() + '.json')).write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf-8')
                print(args.role, len(results)-retained, '/', len(pending), row['id'], 'OK' if record['ok'] else 'FAIL', flush=True)
        await asyncio.gather(*(check(row) for row in pending))
        await browser.close()
    print(json.dumps({'profile':args.role,'screens':len(results),'failed':[r['screen'] for r in results if not r['ok']]}))
    return all(r['ok'] for r in results)

if __name__ == '__main__':
    sys.exit(0 if asyncio.run(main()) else 1)
