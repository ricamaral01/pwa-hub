"""Accept the three published PCP screens on port 18446 only."""
import json,sys,re
from pathlib import Path
from urllib.parse import urlsplit,quote
from playwright.sync_api import sync_playwright,expect
from homolog_session import test_cookie_for

ROOT=Path(__file__).resolve().parents[2]
BASE='https://concrefer.concretrack.com.br:18446'
OUT=ROOT/'docs/revisao-visual-unificado/homolog/fase-0.5'
OUT.joinpath('capturas').mkdir(exist_ok=True)
with sync_playwright() as p:
    browser=p.chromium.launch(channel='msedge',headless=True)
    context=browser.new_context(service_workers='block',viewport={'width':1440,'height':900})
    context.add_cookies([{'name':'mapa_unificado_homolog_session','value':test_cookie_for('user-ricardo'),'domain':'concrefer.concretrack.com.br','path':'/unificado/','secure':True,'httpOnly':True,'sameSite':'Lax'}])
    page=context.new_page();errors=[];failures=[];blocked=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.on('response',lambda r:failures.append({'url':r.url,'status':r.status}) if r.status>=400 else None)
    def route(r):
        u=urlsplit(r.request.url)
        if u.scheme in ('https','http') and u.netloc!=urlsplit(BASE).netloc and u.hostname not in ['fonts.googleapis.com','fonts.gstatic.com']:
            blocked.append(r.request.url);r.abort();return
        r.continue_()
    page.route('**/*',route)
    page.goto(BASE+'/unificado/login.html',wait_until='domcontentloaded')
    page.evaluate("localStorage.setItem('pwa_mapa_auth_session_v1',JSON.stringify({id:'user-ricardo',role:'GERENCIA',name:'Ricardo'}))")
    linked=page.evaluate("""async()=>{const r=await fetch('/unificado/mapa/api/unified/pcp-session');if(!r.ok)return {status:r.status,body:await r.text()};const d=await r.json();localStorage.setItem('pcp_token',d.access_token);localStorage.setItem('pcp_user',JSON.stringify(d.usuario));return {status:r.status,role:d.usuario.nivel_acesso};}""")
    assert linked['status']==200,linked
    probes=page.evaluate("""async()=>{const cases=[['series','postes-series/previsao?semana=2026-11-09','postesNumerosSerie'],['semana','programacao-semanal?semana=2026-11-09','programacaoSemanal12'],['armaduras','armaduras/programacao?semana=2026-11-09&grupo=12','armadurasProgramacao']];let result=[];for(const [name,path,screen] of cases){const r=await fetch('/unificado/pcp/api/'+path,{headers:{Authorization:'Bearer '+localStorage.getItem('pcp_token'),'X-Unificado-Screen':screen}});result.push({name,status:r.status,data:await r.json()});}return result;}""")
    (OUT/'api-smoke.json').write_text(json.dumps(probes,ensure_ascii=False,indent=2),encoding='utf-8')
    assert all(item['status']==200 for item in probes),[(r['name'],r['status'],r['data']) for r in probes]
    screens=[('series','pcp/numeros-serie/','#sr-status','#sr-error'),('semana','pcp/programacao-semanal/','#wk-status','#wk-alert'),('armaduras','pcp/armaduras/','#status','#error')]
    results=[]
    for name,view,status,error in screens:
        page.goto(BASE+'/unificado/?view='+quote(view,safe=''),wait_until='domcontentloaded')
        iframe=page.frame_locator('#module-host iframe.is-active')
        try:
            expect(iframe.locator('h1')).to_be_visible(timeout=30000)
            if name=='series':expect(iframe.locator('#sr-status')).to_contain_text('Consulta',timeout=30000)
            elif name=='armaduras':expect(iframe.locator('#results .ar-panel').first).to_be_visible(timeout=30000)
            else:expect(iframe.locator('#weekly-page')).to_have_attribute('aria-busy','false',timeout=30000)
            if name!='semana':assert iframe.locator(error).is_hidden(),iframe.locator(error).inner_text()
            for width,height in [(1440,900),(1024,768),(820,1180),(390,844)]:
                page.set_viewport_size({'width':width,'height':height})
                page.screenshot(path=str(OUT/f'capturas/{name}-{width}.png'))
                assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),(name,width)
            results.append({'screen':name,'status':'ok'})
        except Exception:
            page.screenshot(path=str(OUT/f'capturas/{name}-error.png'))
            print(json.dumps({'screen':name,'url':page.url,'frames':[f.url for f in page.frames],'errors':errors,'http':failures[-12:]},ensure_ascii=False))
            raise
    result={'base':BASE,'session':linked,'api_statuses':{i['name']:i['status'] for i in probes},'screens':results,'errors':errors,'http_errors':failures,'blocked_origins':blocked}
    (OUT/'smoke-results.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
    print(json.dumps(result,ensure_ascii=False));browser.close()
