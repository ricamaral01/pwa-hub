"""Open catalog screens with existing accounts on the isolated origin only."""
import argparse, asyncio, json, sys
from collections import Counter
from pathlib import Path
from urllib.parse import urlsplit, quote
from playwright.async_api import async_playwright
from homolog_session import test_cookie_for
from visual_phase05_sessions import sessions

ROOT = Path(__file__).resolve().parents[2]
BASE = 'https://concrefer.concretrack.com.br:18446'
OUT = ROOT / 'docs/revisao-visual-unificado/homolog/revisao-completa'
parser = argparse.ArgumentParser()
parser.add_argument('--role', default='GERENCIA')
parser.add_argument('--only', nargs='*')
parser.add_argument('--resume',action='store_true')
parser.add_argument('--concurrency',type=int,default=3)
args = parser.parse_args()

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
            access = await init.evaluate("async()=>{const r=await fetch('/unificado/mapa/api/unified/screen-access/me');return await r.json()}")
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
        if any(row['module']=='suprimentos' and row['id'] in allowed for row in catalog):
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
        pending = [row for row in catalog if (row['id'] in allowed or row.get('public') or row.get('access_screen') in allowed or args.role in row.get('role_access',[]) or (row['module']=='ged' and 'ged' in module_allowed and (not row.get('access_screen') or row['access_screen'] in allowed))) and (not args.only or row['id'] in args.only)]
        sem = asyncio.Semaphore(args.concurrency)
        async def check(row):
            async with sem:
                page = await context.new_page()
                js, http, external = [], [], []
                page.on('pageerror', lambda e:js.append(str(e)))
                page.on('response', lambda r:http.append({'url':r.url,'status':r.status}) if r.status>=400 else None)
                async def restrict(route):
                    u = urlsplit(route.request.url)
                    if u.scheme in ('http','https') and u.netloc != urlsplit(BASE).netloc:
                        external.append(route.request.url)
                        await route.abort()
                    else: await route.continue_()
                await page.route('**/*', restrict)
                path = menu_urls.get(row['id'], row['path'] + (row.get('query') or ''))
                if path.startswith('http'):
                    parsed = urlsplit(path)
                    assert parsed.netloc == urlsplit(BASE).netloc
                    path = parsed.path + ('?' + parsed.query if parsed.query else '')
                if ':id' in path:
                    nc = json.loads((OUT.parent / 'fase-6/qualidade-flow.json').read_text(encoding='utf-8'))['nc_id']
                    path = path.replace(':id', nc)
                view = path.removeprefix('/unificado/')
                record = {'profile':args.role, 'screen':row['id'], 'path':path,'review_version':(ROOT/'unificado/VERSION').read_text().strip()}
                try:
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
                        if width!=1440:
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
                        await page.evaluate('()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))')
                        await page.wait_for_timeout(250)
                        frames = []
                        for frame in page.frames:
                            if not frame.url.startswith(BASE):continue
                            await frame.wait_for_function('document.body && getComputedStyle(document.documentElement).visibility!=="hidden"',timeout=15000)
                            await frame.wait_for_function("()=>{const scope=document.querySelector('.scrim>.drawer,[role=dialog],[aria-modal=true]')||document;return ![...scope.querySelectorAll('.loading-state,#loading,.page-loading')].some(e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return r.width&&r.height&&s.display!=='none'&&s.visibility!=='hidden'&&/carregando/i.test(e.textContent)})}",timeout=30000)
                            record['last_stage']='font readiness '+str(width)+' '+frame.url
                            await asyncio.wait_for(frame.evaluate('Promise.race([document.fonts.ready,new Promise(r=>setTimeout(r,2500))])'),timeout=45)
                            await frame.evaluate("Promise.race([Promise.all([...document.images].filter(i=>{const r=i.getBoundingClientRect();return r.top<innerHeight&&r.bottom>0&&r.width>0}).map(i=>i.decode().catch(()=>{}))),new Promise(r=>setTimeout(r,3000))])")
                            text = await frame.locator('body').inner_text()
                            record['last_stage']='DOM audit '+str(width)+' '+frame.url
                            frames.append({'url':frame.url, 'overflow':await frame.evaluate('document.documentElement.scrollWidth>innerWidth+1'),
                                'access_denied':any(v in text for v in ['Você não tem acesso a esta tela','Acesso não permitido']),
                                'blank':len(text.strip())<10, 'text':text[:180], 'audit':await asyncio.wait_for(frame.evaluate((ROOT/'tests/unificado/review_dom_audit.js').read_text(encoding='utf-8')),timeout=60)})
                        metrics.append({'width':width,'frames':frames})
                        if True:
                            dest = OUT / 'capturas' / args.role.lower()
                            dest.mkdir(parents=True,exist_ok=True)
                            await page.screenshot(path=str(dest / (row['id'] + '-' + str(width) + '.png')))
                    expected = [e for e in http if not planning_token and e['status'] in (401,403) and urlsplit(e['url']).path=='/unificado/mapa/api/unified/pcp-session']
                    scope_denials = [e for e in http if row['module'] in native_denied and e['status']==403 and urlsplit(e['url']).path.startswith('/api/suprimentos/')]
                    errors = [e for e in http if e not in expected]
                    errors = [e for e in errors if e not in scope_denials]
                    if row.get('expected_denial'):
                        record['expected_disabled_unit_denials']=[e for e in errors if e['status'] in (401,403)]
                        errors=[e for e in errors if e['status'] not in (401,403)]
                    record.update(layout=metrics, js_errors=js, http_errors=errors, expected_capability_denials=expected,
                        expected_native_module_denials=scope_denials, authorization_expectation='native module denies access' if row['module'] in native_denied else 'allowed', external_attempts=external)
                    record['standard_issues'] = sum(len(f['audit']['issues']) for m in metrics for f in m['frames'])
                    record['ok'] = record['status']==200 and not js and not errors and not external and all(
                        not (f['overflow'] or f['blank'] or (f['access_denied'] and row['module'] not in native_denied and not row.get('expected_denial'))) for m in metrics for f in m['frames'])
                    record['ok'] = record['ok'] and record['standard_issues']==0
                    if not record['ok']:
                        await page.screenshot(path=str(OUT / ('falha-' + args.role + '-' + row['id'] + '.png')))
                except Exception as exc:
                    record.update(ok=False, error=type(exc).__name__+': '+str(exc), js_errors=js, http_errors=http, external_attempts=external)
                await page.close()
                results.append(record)
                (OUT / ('matrix-' + args.role.lower() + '.json')).write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf-8')
                print(args.role, len(results)-retained, '/', len(pending), row['id'], 'OK' if record['ok'] else 'FAIL', flush=True)
        await asyncio.gather(*(check(row) for row in pending))
        await browser.close()
    print(json.dumps({'profile':args.role,'screens':len(results),'failed':[r['screen'] for r in results if not r['ok']]}))
    return all(r['ok'] for r in results)

if __name__ == '__main__':
    sys.exit(0 if asyncio.run(main()) else 1)
