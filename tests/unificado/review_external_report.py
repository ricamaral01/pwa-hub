"""Read-only external report navigation, with isolated failure fixtures."""
import argparse,json
from pathlib import Path
from urllib.parse import urlsplit
from playwright.sync_api import sync_playwright
from homolog_session import test_cookie_for
from review_expectations import EXTERNAL_REPORT_PREFIX,permitted_external_report

R=Path(__file__).resolve().parents[2]
O=R/'docs/revisao-visual-unificado/homolog/revisao-final/external-report'
BASE='https://concrefer.concretrack.com.br:18446'
API='/unificado/mapa/api/usina/reporting/pcp-producao/'
parser=argparse.ArgumentParser();parser.add_argument('--live',action='store_true');args=parser.parse_args()
O.mkdir(parents=True,exist_ok=True)
results=[]
with sync_playwright() as pw:
    browser=pw.chromium.launch(channel='msedge',headless=True)
    modes=['live'] if args.live else ['normal','missing','offline','browser-offline','manifest-offline','empty']
    cookie=test_cookie_for('user-ricardo') if args.live else None
    for mode in modes:
        context=browser.new_context(viewport={'width':1440,'height':900},service_workers='block')
        if cookie:context.add_cookies([{'name':'mapa_unificado_homolog_session','value':cookie,'url':BASE}])
        external=[];rejected=[];responses=[]
        def intercept(route):
            request=route.request;url=urlsplit(request.url)
            if request.method!='GET':
                rejected.append({'method':request.method,'path':url.path});return route.abort()
            if url.netloc!=urlsplit(BASE).netloc:
                if not permitted_external_report(request.url,request.method):
                    rejected.append({'method':request.method,'url':request.url});return route.abort()
                external.append(request.url)
                if mode=='browser-offline':return route.abort('internetdisconnected')
                if not args.live:return route.fulfill(content_type='text/html; charset=utf-8',body='<html><meta charset="utf-8"><body><h1>Fixture de navegação</h1><table><tr><td>Relatório sintético para testar navegação somente leitura.</td></tr></table></body></html>')
                return route.continue_()
            relative=url.path.removeprefix('/unificado/')
            asset=R/'unificado'/relative
            if relative.startswith(('shell/','usinas/')) and asset.is_file():return route.fulfill(path=str(asset))
            if url.path.startswith(API) and not args.live:
                if url.path.endswith('/manifest'):
                    if mode=='manifest-offline':return route.fulfill(status=503,body='fixture unavailable')
                    return route.fulfill(json={'reports':[] if mode=='empty' else ['2026-10-30','2026-10-29']})
                if mode=='missing':return route.fulfill(status=404,body='fixture missing')
                if mode=='offline':return route.fulfill(status=503,body='fixture unavailable')
                return route.fulfill(content_type='text/html',body='<html><body>Fixture de disponibilidade</body></html>')
            route.continue_()
        context.route('**/*',intercept)
        page=context.new_page()
        page.on('response',lambda response:responses.append({'path':urlsplit(response.url).path,'status':response.status}) if API in response.url else None)
        page.goto(BASE+'/unificado/usinas/fechamento-diario.html',wait_until='domcontentloaded')
        page.wait_for_function("!document.querySelector('#report-feedback').hidden && !document.querySelector('#report-message').textContent.startsWith('Carregando') || !document.querySelector('#source').hidden",timeout=45000)
        success=mode in ('normal','live')
        if args.live and not page.locator('#report').is_visible():
            text=page.locator('#report-message').inner_text()
            assert page.locator('#report-retry').is_visible()
            for width,height in [(1440,900),(390,844)]:
                page.set_viewport_size({'width':width,'height':height});page.screenshot(path=str(O/f'live-unavailable-{width}.png'))
            origin_url=EXTERNAL_REPORT_PREFIX+'relatorio_pcp_producao_2026-10-30.html'
            origin=context.request.get(origin_url,max_redirects=0,timeout=30000)
            results.append({'mode':mode,'synthetic':False,'ok':False,'availability':'unavailable','message':text,'retry_visible':True,'external_gets':external,'responses':responses,'normal_navigation_proven':False,'origin_read_outside_isolated_service':{'url':origin_url,'method':'GET','status':origin.status,'bytes':len(origin.body()),'files_saved':0}})
            context.unroute_all(behavior='ignoreErrors');context.close();continue
        if success:
            assert page.locator('#report').is_visible()
            frame=page.frame_locator('#report');assert len(frame.locator('body').inner_text(timeout=30000))>40
            dates=page.locator('#date option').evaluate_all('(items)=>items.map(x=>x.value)')
            assert dates
            first=page.locator('#report').get_attribute('src')
            if len(dates)>1:
                page.select_option('#date',dates[1]);page.locator('#filter button').click()
                page.wait_for_function("!document.querySelector('#source').hidden && document.querySelector('#report').src.includes(document.querySelector('#date').value)",timeout=45000)
                assert page.locator('#report').get_attribute('src')!=first
                assert len(frame.locator('body').inner_text(timeout=30000))>40
            detail={'dates_count':len(dates),'date_change':len(dates)>1,'iframe_url':page.locator('#report').get_attribute('src')}
        else:
            text=page.locator('#report-message').inner_text()
            assert not page.locator('#report').is_visible()
            assert page.locator('#report-retry').is_visible()
            assert not any(x in text for x in ['HTTP','Traceback','503','404','fixture'])
            detail={'message':text,'retry_visible':True,'iframe_hidden':True}
        assert not rejected,rejected
        for width,height in [(1440,900),(390,844)]:
            page.set_viewport_size({'width':width,'height':height});page.screenshot(path=str(O/f'{mode}-{width}.png'))
        results.append({'mode':mode,'synthetic':not args.live,'ok':True,'external_gets':external,**detail})
        context.unroute_all(behavior='ignoreErrors');context.close()
    browser.close()
(O/('live.json' if args.live else 'fixtures.json')).write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'ok':all(x['ok'] for x in results),'modes':modes,'evidence':str(O)},ensure_ascii=False))
raise SystemExit(0 if all(x['ok'] for x in results) else 1)
