"""Real read-only daily closing and label printing; no business records created."""
import hashlib,json
from pathlib import Path
from urllib.parse import urlsplit
from playwright.sync_api import sync_playwright
from producao_resume_runtime import actors,start,count
from review_expectations import permitted_external_report
R=Path(__file__).resolve().parents[2];O=R/'docs/revisao-visual-unificado/producao-20261120/retomada-2';BASE='https://concrefer.concretrack.com.br';actor=next(a for a in actors('production') if a['id']=='alex');result={'operational_writes':0,'physical_printer_tested':False};rejected=[];responses=[]
with sync_playwright() as pw:
 b=pw.chromium.launch(channel='msedge',headless=True);ctx,page,errors,blocked=start(b,actor,'production',initial_module='usinas')
 ctx.unroute('**/*')
 def protect(route):
  req=route.request;u=urlsplit(req.url)
  if req.method not in ['GET','HEAD','OPTIONS']:rejected.append({'method':req.method,'path':u.path});return route.abort()
  if u.netloc!=urlsplit(BASE).netloc and not permitted_external_report(req.url,req.method):rejected.append({'method':req.method,'url':req.url});return route.abort()
  route.continue_()
 ctx.route('**/*',protect);page.on('response',lambda r:responses.append({'url':r.url,'status':r.status}) if '/usina/reporting/' in r.url or 'dautomacao.com/' in r.url or 'cdn.jsdelivr.net/' in r.url else None)
 count();page.goto(BASE+'/unificado/usinas/fechamento-diario.html',wait_until='domcontentloaded');page.wait_for_function("!document.querySelector('#source').hidden||!document.querySelector('#report-retry').hidden",timeout=45000)
 daily={'report_visible':page.locator('#report').is_visible(),'responses':responses}
 if daily['report_visible']:
  frame=page.frame_locator('#report');assert len(frame.locator('body').inner_text(timeout=30000))>40;dates=page.locator('#date option').evaluate_all('(items)=>items.map(x=>x.value)');first=page.locator('#report').get_attribute('src');daily.update(dates_count=len(dates),first_url=first)
  if len(dates)>1:
   page.select_option('#date',dates[1]);page.locator('#filter button').click();page.wait_for_function("!document.querySelector('#source').hidden&&document.querySelector('#report').src.includes(document.querySelector('#date').value)",timeout=45000);assert page.locator('#report').get_attribute('src')!=first;assert len(frame.locator('body').inner_text(timeout=30000))>40;daily.update(date_changed=True,second_url=page.locator('#report').get_attribute('src'))
  daily['ok']=True
 else:daily.update(ok=False,message=page.locator('#report-message').inner_text(),retry_visible=page.locator('#report-retry').is_visible())
 for width,height in [(1440,1000),(390,844)]:page.set_viewport_size({'width':width,'height':height});page.screenshot(path=str(O/f'production-daily-{width}.png'))
 result['daily_closing']=daily;(O/'integrations-production.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8');assert daily['ok'],daily
 # GET data first, then use the actual label screen's client-only generation.
 count();headers={'Authorization':'Bearer '+actor['token'],'X-Unificado-Screen':'etiquetasArmaduras'}
 def get(path):
  response=ctx.request.get(BASE+'/unificado/pcp'+path,headers=headers);assert response.status==200,(path,response.status);return response.json()
 templates=get('/api/etiquetas-armaduras/modelos');schedule=get('/api/programacao-circular-s3?data_inicio=2026-10-01&dias=90');normalize=lambda v:''.join(v.upper().replace('×','X').split());models={normalize(t['modelo']) for t in templates};selection=next((r for r in reversed(schedule) if normalize(r['modelo']) in models),None);assert selection,'No existing scheduled model has a matching label template'
 page.set_viewport_size({'width':1440,'height':1000});page.goto(BASE+'/unificado/?module=planejamento',wait_until='domcontentloaded');page.wait_for_function('window.UnificadoRouter');page.evaluate("()=>UnificadoRouter.open('/unificado/pcp/etiquetas-armaduras/','etiquetasArmaduras')")
 page.wait_for_function("()=>[...document.querySelectorAll('iframe')].some(f=>f.src.includes('/etiquetas-armaduras/'))");iframe=page.locator('iframe[src*="/etiquetas-armaduras/"]').first;frame=iframe.content_frame
 frame.locator('#arm-start').fill(selection['data']);frame.locator('#arm-load').click();frame.locator('.arm-check:not([disabled])').first.wait_for(timeout=30000)
 frame.locator('.arm-check:checked').evaluate_all('(nodes)=>nodes.forEach(n=>n.checked=false)');check=frame.locator('.arm-check:not([disabled])').first;check.check();model=check.get_attribute('data-model');selector=frame.locator('select.arm-template').all()
 for control in selector:
  if control.get_attribute('data-model')==model:control.select_option(control.locator('option[value]:not([value=""])').first.get_attribute('value'));break
 frame.locator('#arm-generate').click();assert frame.locator('.arm-label').count()>0;page.screenshot(path=str(O/'production-labels-armaduras.png'),full_page=True)
 # Preserve the real generated DOM and styles in an isolated print document.
 label_frame=next(f for f in page.frames if '/pcp/etiquetas-armaduras/' in f.url);html=label_frame.evaluate("()=>{const d=document.documentElement.cloneNode(true);d.querySelectorAll('script').forEach(e=>e.remove());const base=document.createElement('base');base.href=location.href;d.querySelector('head').prepend(base);return '<!doctype html>'+d.outerHTML}");pdfpage=ctx.new_page();pdfpage.set_content(html,wait_until='networkidle');pdfpage.pdf(path=str(O/'production-labels-armaduras.pdf'),prefer_css_page_size=True,print_background=True);pdfpage.close()
 frame.locator('#arm-print').evaluate("e=>{window.__printInvocations=0;window.print=()=>window.__printInvocations++}");frame.locator('#arm-print').click();assert label_frame.evaluate('window.__printInvocations')==1
 result['armadura_labels']={'models_status':200,'schedule_status':200,'existing_date':selection['data'],'template_model':model,'labels':frame.locator('.arm-label').count(),'print_handler_called':True,'pdf_from_real_generated_dom':True,'pdf_bytes':(O/'production-labels-armaduras.pdf').stat().st_size,'ok':True};result['rejected_requests']=rejected;result['ok']=True;ctx.close();b.close()
(O/'integrations-production.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps(result,ensure_ascii=True))
