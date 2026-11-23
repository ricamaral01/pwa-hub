"""Read actual seeded home/shortcuts and exercise mobile navigation, without mocks."""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright
from homolog_session import test_cookie_for
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'docs/revisao-visual-unificado/homolog/revisao-completa'
BASE='https://concrefer.concretrack.com.br:18446'
with sync_playwright() as pw:
 b=pw.chromium.launch(channel='msedge',headless=True)
 c=b.new_context(timezone_id='America/Sao_Paulo',viewport={'width':1440,'height':900},service_workers='block')
 c.add_cookies([{'name':'mapa_unificado_homolog_session','value':test_cookie_for('user-ricardo'),'domain':'concrefer.concretrack.com.br','path':'/unificado/','secure':True,'httpOnly':True}])
 p=c.new_page();errors=[];p.on('pageerror',lambda e:errors.append(str(e)))
 p.goto(BASE+'/unificado/login.html');p.evaluate("localStorage.setItem('pwa_mapa_auth_session_v1',JSON.stringify({id:'user-ricardo',role:'GERENCIA',name:'Ricardo'}))")
 p.evaluate("async()=>{const r=await fetch('/unificado/mapa/api/unified/pcp-session');const d=await r.json();localStorage.setItem('pcp_token',d.access_token);localStorage.setItem('pcp_user',JSON.stringify(d.usuario))}")
 p.goto(BASE+'/unificado/',wait_until='networkidle')
 p.wait_for_function("document.querySelector('[data-total=programado]')?.textContent!=='—'")
 p.wait_for_timeout(1000)
 date_label=p.locator('#opening-compact-date').inner_text()
 totals=p.locator('.home-strip').inner_text();sectors=p.locator('#sector-cards').inner_text()
 rows=p.locator('#sector-cards tr').evaluate_all("rows=>rows.map(r=>Object.fromEntries([...r.querySelectorAll('[data-stat]')].map(e=>[e.dataset.stat,e.textContent])))")
 assert any(float(r['programado'].replace('.','').replace(',','.'))>0 and r['aderencia']!='—' and float(r['aderencia'].replace('%','').replace(',','.'))<85 and float(r['falta'].replace('.','').replace(',','.'))>0 for r in rows),rows
 (OUT/'fluxos').mkdir(exist_ok=True);p.screenshot(path=str(OUT/'fluxos/inicio-dados-reais.png'),full_page=True)
 data=p.evaluate("async()=>await (await fetch('/unificado/mapa/api/unified/quick-access/me')).json()")
 allowed=p.evaluate("async()=>await (await fetch('/unificado/mapa/api/unified/screen-access/me')).json()")['screens']
 assert data['enabled'] and 6<=len(data['items'])<=8
 assert all(d['screen'] in allowed for item in data['items'] for d in item['destinations'])
 p.locator('.uqa-return-desktop').click();p.wait_for_timeout(300)
 assert p.locator('#uqa-home').is_visible()
 assert not p.locator('#uqa-home a').filter(has_text='Abrir').count()
 p.screenshot(path=str(OUT/'fluxos/atalhos-reais.png'),full_page=True)
 p.set_viewport_size({'width':390,'height':844})
 p.goto(BASE+'/unificado/?view=pcp%2Fnumeros-serie%2F%3Fsemana%3D2030-03-11',wait_until='networkidle')
 title=p.locator('.nav-mobile-title').inner_text();assert title!='Início',title
 p.screenshot(path=str(OUT/'fluxos/titulo-serie-com-parametros.png'))
 p.locator('.nav-mobile-bottom [data-mode=conta]').click();p.wait_for_timeout(250)
 assert p.locator('.nav-account-links').is_visible()
 assert p.locator('.nav-account-links a').filter(has_text='Como funciona').count()==1
 assert p.locator('.nav-account-links a').filter(has_text='Relatar problema').count()==1
 assert p.locator('.nav-help-menu:visible').count()==0
 p.screenshot(path=str(OUT/'fluxos/conta-ajuda-em-lista.png'))
 p.goto(BASE+'/unificado/?view=suprimentos%2Fpainel%2F',wait_until='domcontentloaded');p.wait_for_timeout(2000)
 supply=next(f for f in p.frames if '/suprimentos/painel/' in f.url)
 supply.locator('.sup-compact-list').wait_for(state='attached',timeout=20000)
 p.emulate_media(media='print')
 assert supply.locator('.sup-compact-list').evaluate('(e)=>getComputedStyle(e).display')=='none'
 p.emulate_media(media='screen')
 p.evaluate("()=>window.UnificadoRouter.open(MENU_ITEMS.labCriteria.url,'labCriteria')")
 field=p.frame_locator('iframe.is-active').locator('.drawer input').first
 field.wait_for(state='visible',timeout=25000)
 before=field.input_value();assert ',' in before and '.' not in before,before
 field.fill('5,1');assert field.input_value()=='5,1'
 p.screenshot(path=str(OUT/'fluxos/criterios-decimal-virgula.png'))
 result={'criteria_decimal_display':before,'decimal_edit_display':'5,1','criteria_saved':False,'compact_mobile_list_excluded_from_print':True,'status':'ok','version':(ROOT/'unificado/VERSION').read_text().strip(),'home_totals':totals,'home_sectors':rows,'quick_access_items':len(data['items']),'all_destinations_allowed_by_iam':True,'mocked_responses':0,'mobile_parameter_title':title,'account_help_inline':True,'js_errors':errors,'date_label':date_label,'requested_test_date':'2026-11-18','timezone':'America/Sao_Paulo'}
 assert not errors,errors
 (OUT/'fluxos.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps(result,ensure_ascii=True));b.close()
