"""Offline browser + own local PG proof. Never forwards a request to the VPS."""
import hashlib,importlib.util,json,mimetypes,os,sys,time
from datetime import datetime,timezone
from pathlib import Path
from urllib.parse import urlsplit,unquote
import fitz,numpy as np,zxingcpp
from playwright.sync_api import sync_playwright

R=Path(__file__).resolve().parents[2];BASELINE=Path('C:/Users/Admin/Documents/pwa-hub-uni-2.0.0');O=R/'docs/revisao-visual-unificado/homolog/laboratorio-210-local';O.mkdir(parents=True,exist_ok=True)
sys.path.insert(0,str(R/'tests/unificado'));from test_lab210_api_local import ApiTests,owner,module
ApiTests.setUpClass();api=ApiTests();api.setUp();BASE='https://lab210-fixture.invalid:18446';WIDTHS=[(1440,1000),(1024,900),(820,1180),(390,844)]
pages=[('', 'geral'),('etiquetas/','etiquetas'),('leitura/','leitura'),('analise/resultado-cp.html','resultados'),('rompimentos-mes/','mes'),('analise/','analise'),('analise/relatorio.html','relatorio')]
captures=[];documents=[];blocked=[];requests=[];errors=[]
for unit,marker in [('pederneiras','TESTE-LAB-PEDE'),('ribeirao','TESTE-LAB-RIB')]:
 with owner() as c:
  for identity in [1,2]:c.execute(f"UPDATE lab_cec_{unit}.massadas SET numero_serie=%s,produto=%s,formula='TRACO',test_marker=%s,source_payload='{{\"qtd\":0.25}}' WHERE id=%s",[marker+f'-{identity:03}',marker,marker,identity])
def serve(route,source=R):
 u=urlsplit(route.request.url);path=unquote(u.path);method=route.request.method
 if u.netloc!=urlsplit(BASE).netloc:blocked.append(route.request.url);return route.abort()
 if '/cec-api/' in path:
  unit=path.split('/laboratorio/',1)[1].split('/',1)[0];operation=path.split('/cec-api/',1)[1]
  if unit not in module.UNITS:return route.fulfill(status=404,body='Not found')
  body=route.request.post_data_json if method not in ['GET','HEAD'] and route.request.post_data else None
  response=api.client.request(method,'/'+unit+'/cec-api/'+operation+('?' + u.query if u.query else ''),json=body,headers=api.headers(unit,method,operation))
  requests.append({'unit':unit,'method':method,'path':operation,'status':response.status_code,'local_pg':True})
  return route.fulfill(status=response.status_code,body=response.content,content_type='application/json; charset=utf-8')
 if '/api/' in path or path.startswith('/api/'):
  if path.endswith('/screen-access/me'):
   rows=json.loads((source/'unificado/mapa/api/screen_catalog.json').read_text(encoding='utf-8'));body={'screens':[r['id'] for r in rows],'preview_modules':False,'ged_access':True,'suprimentos_flags':{'S1':True}}
  elif path.endswith('/me'):body={'id':'alex','nome':'Prévia local Alex','perfil':'GERENCIA'}
  else:body={'ok':True}
  return route.fulfill(status=200,body=json.dumps(body),content_type='application/json; charset=utf-8')
 if path.startswith('/unificado/laboratorio/'):
  root=source/'unificado/laboratorio/service/server/static';rel=path.removeprefix('/unificado/laboratorio/');p=root/rel
 else:root=source/'unificado';p=root/path.removeprefix('/unificado/')
 if p.is_dir():p=p/'index.html'
 if not p.resolve().is_relative_to(root.resolve()) or not p.is_file():return route.fulfill(status=404,body='Missing local fixture: '+path)
 return route.fulfill(path=str(p),content_type=(mimetypes.guess_type(str(p))[0] or 'application/octet-stream')+('; charset=utf-8' if p.suffix in ['.html','.js','.css','.json'] else ''))

def init(context):
 context.add_init_script("localStorage.setItem('pwa_mapa_auth_session_v1',JSON.stringify({id:'alex',name:'Prévia local Alex',role:'GERENCIA'}));localStorage.setItem('unificado_modulo','laboratorio');const NativeDate=Date;class FixedDate extends NativeDate{constructor(...a){super(...(a.length?a:[1795197600000]));}static now(){return 1795197600000;}}window.Date=FixedDate;")
def mark(page):page.evaluate("()=>{if(document.querySelector('#local-preview-marker'))return;const e=document.createElement('div');e.id='local-preview-marker';e.textContent='PRÉVIA LOCAL · NÃO PUBLICADA';e.style.cssText='position:fixed;bottom:6px;right:6px;z-index:9999999;background:#fff0c4;padding:4px 8px;font:11px system-ui;color:#604800;pointer-events:none';document.body.append(e)}")
def frame_for(page,unit):
 page.wait_for_function("[...document.querySelectorAll('iframe')].some(f=>f.contentDocument&&f.contentDocument.readyState==='complete'&&f.contentWindow.location.pathname.includes('/laboratorio/'))")
 return next(f for f in page.frames if '/laboratorio/'+unit+'/' in f.url)
def audit(frame):return frame.evaluate("""()=>{const visible=e=>e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden';const broken=[];for(const e of [...document.querySelectorAll('th')].filter(visible)){const w=document.createTreeWalker(e,NodeFilter.SHOW_TEXT);let n;while(n=w.nextNode())for(const m of n.textContent.matchAll(/[\\p{L}\\p{N}]+/gu)){const r=document.createRange();r.setStart(n,m.index);r.setEnd(n,m.index+m[0].length);if(new Set([...r.getClientRects()].filter(x=>x.width>.1).map(x=>Math.round(x.y))).size>1)broken.push(m[0]);}}return {pageOverflow:document.documentElement.scrollWidth>innerWidth+1,brokenHeaders:broken,unit:document.querySelector('.lab-unit-name')?.textContent,images:[...document.images].filter(visible).filter(i=>!i.complete||!i.naturalWidth).map(i=>i.src)}}""")

try:
 with sync_playwright() as pw:
  browser=pw.chromium.launch(channel='msedge',headless=True)
  context=browser.new_context(viewport={'width':1440,'height':1000},service_workers='block',accept_downloads=True,timezone_id='America/Sao_Paulo');init(context);context.route('**/*',lambda r:serve(r,R));page=context.new_page();page.on('pageerror',lambda x:errors.append(str(x)))
  # Unit-qualified module pages, including exact 2.0.0 before screenshots.
  for mode,source in [('before',BASELINE),('after',R)]:
   sub=browser.new_context(service_workers='block',timezone_id='America/Sao_Paulo');init(sub);sub.route('**/*',lambda r:serve(r,source));p=sub.new_page()
   for width,height in WIDTHS:
    p.set_viewport_size({'width':width,'height':height});p.goto(BASE+'/unificado/?module=laboratorio&unit='+('campinas' if mode=='before' else 'pederneiras'),wait_until='networkidle');p.locator('.module-page:visible').wait_for();mark(p);p.screenshot(path=str(O/f'modulo-{mode}-{width}.png'));assert not p.evaluate('document.documentElement.scrollWidth>innerWidth+1');captures.append({'type':'module','mode':mode,'width':width,'file':f'modulo-{mode}-{width}.png','local_preview':True})
   sub.close()
  for unit,name in [('pederneiras','Pederneiras'),('ribeirao','Ribeirão Preto')]:
   view='laboratorio/'+unit+'/cec/etiquetas/';page.goto(BASE+'/unificado/?view='+view,wait_until='networkidle');frame=frame_for(page,unit)
   frame.locator('button[onclick="loadMassadas()"]').click();frame.locator('tr[data-id="1"]').click();frame.locator('#btnGerar').click();frame.locator('.etiqueta').first.wait_for()
   frame.locator('#btnConfirmarMoldagem').click();frame.wait_for_function("document.querySelector('#moldagemStatus').textContent.includes('confirmada')||document.querySelector('#moldagemStatus').textContent.includes('registrada')")
   with page.expect_download() as download:frame.get_by_role('button',name='PDF (90×40mm)',exact=False).click()
   pdf=O/f'{unit}-etiquetas-local.pdf';download.value.save_as(pdf);doc=fitz.open(pdf);decoded=[]
   for i,pdfpage in enumerate(doc):
    text=pdfpage.get_text();assert name in text,(unit,i,text);assert ('TESTE-LAB-PEDE-001' if unit=='pederneiras' else 'TESTE-LAB-RIB-001') in text,(unit,'series clipped',text);pix=pdfpage.get_pixmap(matrix=fitz.Matrix(4,4),alpha=False);arr=np.frombuffer(pix.samples,dtype=np.uint8).reshape(pix.height,pix.width,3);found=zxingcpp.read_barcodes(arr);assert len(found)==1,(unit,i,len(found));value=found[0].text;assert 'unidade='+unit in value and 'TESTE-LAB-' in value;decoded.append(value)
    if i==0:pix.save(O/f'{unit}-etiqueta-preview.png')
   documents.append({'unit':unit,'file':pdf.name,'pages':len(doc),'unit_text':True,'decoded_qrs':decoded,'local_only':True});doc.close()
   # Native print media preview of the same generated labels, locally only.
   print_file=O/f'{unit}-impressao-local.pdf'
   printer=context.new_page();printer.set_viewport_size({'width':1440,'height':1000});printer.goto(BASE+'/unificado/laboratorio/'+unit+'/cec/etiquetas/',wait_until='networkidle');printer.locator('tr[data-id="1"]').click();printer.locator('#btnGerar').click();printer.locator('.etiqueta').first.wait_for()
   printer.pdf(path=str(print_file),print_background=True,prefer_css_page_size=True);printer.close()
   with fitz.open(print_file) as print_doc:
    print_text=''.join(p.get_text() for p in print_doc);assert name in print_text and '-001' in print_text,(unit,'empty print preview')
    print_doc[0].get_pixmap(matrix=fitz.Matrix(1.4,1.4),alpha=False).save(O/f'{unit}-impressao-preview.png')
   documents.append({'unit':unit,'file':print_file.name,'type':'browser-print-preview','unit_and_series_verified':True,'physical_printer_tested':False,'local_only':True})
   # Real local CP writes through the new API, using the decoded PDF payload.
   page.goto(BASE+'/unificado/?view=laboratorio/'+unit+'/cec/leitura/',wait_until='networkidle');frame=frame_for(page,unit);frame.wait_for_function('queueActorId===\'alex\'')
   for qr,mpa in zip(decoded[:2],[10.01,10.02]):
    frame.evaluate('(qr)=>{currentQR=qr;currentReadingId=null;displayResult(qr)}',qr);frame.locator('#inputMPa').fill(str(mpa));frame.locator('#btnSalvar').click();frame.wait_for_function("document.querySelector('#toast').textContent.includes('Salvo!')");frame.wait_for_timeout(100)
   # Same date/formula, different batch series must stay separate in all views.
   for qr,mpa in zip(decoded[:2],[30,40]):
    qr=qr.replace('-001|','-002|');frame.evaluate('(qr)=>{currentQR=qr;currentReadingId=null;displayResult(qr)}',qr);frame.locator('#inputMPa').fill(str(mpa));frame.locator('#btnSalvar').click();frame.wait_for_function("document.querySelector('#toast').textContent.includes('Salvo!')");frame.wait_for_timeout(100)
   # Four viewports, seven actual candidate pages, one at a time.
   for route,label in pages:
    page.goto(BASE+'/unificado/?view=laboratorio/'+unit+'/cec/'+route,wait_until='networkidle');frame=frame_for(page,unit);page.wait_for_timeout(2100 if label in ['analise','relatorio'] else 200)
    if label in ['resultados','mes','relatorio']:
     text=frame.locator('body').inner_text();assert '-001' in text and '-002' in text,(unit,label,'batch series lost or merged')
    for width,height in WIDTHS:
     page.set_viewport_size({'width':width,'height':height});page.wait_for_timeout(130);data=audit(frame);mark(page);file=f'{unit}-{label}-{width}.png';page.screenshot(path=str(O/file));captures.append({'unit':unit,'page':label,'width':width,'file':file,'local_preview':True,**data});assert not data['pageOverflow'] and not data['brokenHeaders'] and not data['images'],data
    print(json.dumps({'unit':unit,'page':label,'widths':4,'local_only':True}),flush=True)
    if label=='relatorio':
     file=O/f'{unit}-relatorio-local.pdf';printer=context.new_page();printer.set_viewport_size({'width':1440,'height':1000});printer.goto(BASE+'/unificado/laboratorio/'+unit+'/cec/analise/relatorio.html',wait_until='networkidle');printer.wait_for_timeout(2200);printer.pdf(path=str(file),print_background=True,prefer_css_page_size=True);printer.close()
     with fitz.open(file) as report:
      text=''.join(p.get_text() for p in report);assert name in text and '-001' in text and '-002' in text
      report[0].get_pixmap(matrix=fitz.Matrix(1.4,1.4),alpha=False).save(O/f'{unit}-relatorio-preview.png')
     documents.append({'unit':unit,'file':file.name,'type':'browser-report-print','two_series_verified':True,'local_only':True})
  context.close();browser.close()
 with owner() as c:
  rows=[]
  for unit in module.UNITS:rows.append({'unit':unit,'readings':c.execute(f'SELECT count(*) FROM lab_cec_{unit}.rompimentos').fetchone()[0],'authors':[r[0] for r in c.execute(f'SELECT DISTINCT responsavel_id FROM lab_cec_{unit}.rompimentos').fetchall()]})
 result={'status':'local_preview_only','vps_network_requests':0,'shared_cluster_connections_added':0,'captures':captures,'documents':documents,'api_requests':requests,'external_requests_blocked':blocked,'page_errors':errors,'database':{'host':'127.0.0.1','port':55421,'rows':rows},'not_live_18446':True};(O/'browser-local.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8');assert not errors,errors;print(json.dumps({'captures':len(captures),'documents':len(documents),'api_requests':len(requests),'errors':errors,'local_only':True}))
finally:ApiTests.tearDownClass()
