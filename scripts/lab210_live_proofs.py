"""Real18446 proofs, serial pages, only marked CP writes in the two new units."""
import hashlib,json,sys,time
from pathlib import Path
import pymupdf,numpy as np,zxingcpp
from playwright.sync_api import sync_playwright
from lab210_resume_common import BASE,O,save,activity
from lab210_browser import session,context_for,screen
WIDTHS=[(1440,1000),(1024,900),(820,1180),(390,844)]
PAGES=[('','geral'),('etiquetas/','etiquetas'),('leitura/','leitura'),('analise/resultado-cp.html','resultados'),('rompimentos-mes/','mes'),('analise/','analise'),('analise/relatorio.html','relatorio')]
def guard(label):
 for attempt in range(12):
  value=activity();save('latest-activity.json',value)
  if value['total_activity']<=80:return value
  pauses=json.loads((O/'capacity-pauses.json').read_text()) if (O/'capacity-pauses.json').exists() else []
  pauses.append({'label':label,'total_activity':value['total_activity'],'at_epoch':value['at_epoch']});save('capacity-pauses.json',pauses);print('CAPACITY_PAUSED '+label+' '+str(value['total_activity']),flush=True);time.sleep(10)
 raise RuntimeError('CAPACITY_PAUSED remains above80 at '+label)
def audit(frame):
 return frame.evaluate("""async()=>{await document.fonts.ready;const visible=e=>e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden';const broken=[];for(const e of [...document.querySelectorAll('th')].filter(visible)){const w=document.createTreeWalker(e,NodeFilter.SHOW_TEXT);let n;while(n=w.nextNode())for(const m of n.textContent.matchAll(/[\\p{L}\\p{N}]+/gu)){const r=document.createRange();r.setStart(n,m.index);r.setEnd(n,m.index+m[0].length);if(new Set([...r.getClientRects()].filter(x=>x.width>.1).map(x=>Math.round(x.y))).size>1)broken.push(m[0]);}}const icons=[...document.querySelectorAll('.bi')].filter(visible);return {pageOverflow:document.documentElement.scrollWidth>innerWidth+1,brokenHeaders:broken,unit_label:document.querySelector('.lab-unit-name')?.textContent,brokenImages:[...document.images].filter(visible).filter(i=>!i.complete||!i.naturalWidth).map(i=>i.src),iconFontValid:!icons.length||([ ...document.fonts].some(f=>f.family.replaceAll('"','')==='bootstrap-icons'&&f.status==='loaded')&&icons.every(i=>getComputedStyle(i,'::before').fontFamily.includes('bootstrap-icons')))}}""")
def frame_for(page,unit):
 page.wait_for_function("[...document.querySelectorAll('iframe')].some(f=>f.contentDocument&&f.contentDocument.readyState==='complete'&&f.contentWindow.location.pathname.includes('/laboratorio/'))")
 return next(f for f in page.frames if '/laboratorio/'+unit+'/' in f.url)
def proof_alex():
 records={'environment':'real H18446','actor':'alex','production_requests':0,'captures':[],'documents':[],'api':[],'js_errors':[],'server_errors':[]}
 with sync_playwright() as pw:
  browser=pw.chromium.launch(channel='msedge',headless=True);context=context_for(browser,session('alex'),writes=True);page=context.new_page();page.on('pageerror',lambda e:records['js_errors'].append(str(e)))
  def response(r):
   if '/cec-api/' in r.url:records['api'].append({'path':r.url.split('?')[0],'method':r.request.method,'status':r.status})
   if r.status>=500:records['server_errors'].append({'path':r.url.split('?')[0],'status':r.status})
  page.on('response',response)
  for unit,name,marker,identity in [('pederneiras','Pederneiras','TESTE-LAB-PEDE',9002100001),('ribeirao','Ribeirão Preto','TESTE-LAB-RIB',9002100002)]:
   guard('labels-'+unit);page.set_viewport_size({'width':1440,'height':1000});screen(page,'laboratorio/'+unit+'/cec/etiquetas/');frame=frame_for(page,unit);frame.locator('tr[data-id="'+str(identity)+'"]').click();frame.locator('#btnGerar').click();frame.locator('.etiqueta').first.wait_for()
   assert marker in frame.locator('#etiquetasContainer').inner_text() if frame.locator('#etiquetasContainer').count() else marker in frame.locator('body').inner_text()
   frame.locator('#btnConfirmarMoldagem').click();frame.wait_for_function("document.querySelector('#moldagemStatus').textContent.includes('confirmada')||document.querySelector('#moldagemStatus').textContent.includes('registrada')")
   with page.expect_download() as download:frame.get_by_role('button',name='PDF (90×40mm)',exact=False).click()
   pdf=O/f'{unit}-etiquetas.pdf';download.value.save_as(pdf);decoded=[]
   with pymupdf.open(pdf) as doc:
    for i,pdfpage in enumerate(doc):
     text=pdfpage.get_text();assert name in text and marker+'-001' in text,(unit,'unit or series clipped',text)
     pix=pdfpage.get_pixmap(matrix=pymupdf.Matrix(4,4),alpha=False);array=np.frombuffer(pix.samples,dtype=np.uint8).reshape(pix.height,pix.width,3);codes=zxingcpp.read_barcodes(array);assert len(codes)==1
     qr=codes[0].text;assert 'unidade='+unit in qr and marker in qr;decoded.append(qr)
     if i==0:pix.save(O/f'{unit}-etiqueta-preview.png')
   records['documents'].append({'unit':unit,'type':'labels','file':pdf.name,'qrs':decoded,'unit_and_series_verified':True});save('proof-alex.json',records)
   # HTML print preview uses the actual protected page, the same fixture only.
   guard('print-labels-'+unit);printer=context.new_page();printer.goto(BASE+'/unificado/laboratorio/'+unit+'/cec/etiquetas/',wait_until='networkidle');printer.locator('tr[data-id="'+str(identity)+'"]').click();printer.locator('#btnGerar').click();printer.locator('.etiqueta').first.wait_for();native=O/f'{unit}-impressao.pdf';printer.pdf(path=str(native),print_background=True,prefer_css_page_size=True);printer.close()
   with pymupdf.open(native) as doc:
    assert name in ''.join(p.get_text() for p in doc);doc[0].get_pixmap(matrix=pymupdf.Matrix(1.4,1.4),alpha=False).save(O/f'{unit}-impressao-preview.png')
   records['documents'].append({'unit':unit,'type':'print-preview','file':native.name,'physical_printer_tested':False})
   guard('cp-launch-'+unit);screen(page,'laboratorio/'+unit+'/cec/leitura/');frame=frame_for(page,unit);frame.wait_for_function("queueActorId==='alex'")
   for qr,mpa in zip(decoded[:2],[10.01,10.02]):
    assert marker in qr
    frame.evaluate('(qr)=>{currentQR=qr;currentReadingId=null;displayResult(qr)}',qr);frame.locator('#inputMPa').fill(str(mpa));frame.locator('#btnSalvar').click();frame.wait_for_function("document.querySelector('#toast').textContent.includes('Salvo!')");frame.wait_for_timeout(150)
   guard('cp-after-'+unit)
   for route,label in PAGES:
    before=guard(unit+'-'+label);page.set_viewport_size({'width':1440,'height':1000});screen(page,'laboratorio/'+unit+'/cec/'+route);frame=frame_for(page,unit);page.wait_for_timeout(2000 if label in ['analise','relatorio'] else 200)
    for width,height in WIDTHS:
     page.set_viewport_size({'width':width,'height':height});page.wait_for_timeout(150);check=audit(frame);file=f'{unit}-{label}-{width}.png';page.screenshot(path=str(O/file));row={'unit':unit,'page':label,'width':width,'file':file,'activity_before':before['total_activity'],**check};records['captures'].append(row);save('proof-alex.json',records);assert not check['pageOverflow'] and not check['brokenHeaders'] and not check['brokenImages'] and check['iconFontValid'],row;assert name in (check['unit_label'] or ''),row
    guard(unit+'-'+label+'-after');print(json.dumps({'unit':unit,'page':label,'widths':4,'environment':'real H18446'}),flush=True)
    if label=='relatorio':
     printer=context.new_page();printer.set_viewport_size({'width':1440,'height':1000});printer.goto(BASE+'/unificado/laboratorio/'+unit+'/cec/analise/relatorio.html',wait_until='networkidle');printer.wait_for_timeout(2000);file=O/f'{unit}-relatorio.pdf';printer.pdf(path=str(file),print_background=True,prefer_css_page_size=True);printer.close()
     with pymupdf.open(file) as doc:
      assert name in ''.join(p.get_text() for p in doc);doc[0].get_pixmap(matrix=pymupdf.Matrix(1.4,1.4),alpha=False).save(O/f'{unit}-relatorio-preview.png')
     records['documents'].append({'unit':unit,'type':'report','file':file.name})
  context.close();browser.close()
 save('proof-alex.json',records);assert not records['server_errors'],records['server_errors'];print(json.dumps({'captures':len(records['captures']),'documents':len(records['documents']),'server_errors':records['server_errors'],'js_errors':records['js_errors']}))
def matrix():
 # Existing individual central accounts only; no account or permission creation.
 actors=[('alex','GERENCIA/master',True),('marcelo','GERENCIA/master',True),('philippe','GERENCIA/master',True),('user-ricardo','GERENCIA/master',True),('jgabriel','PCP ADMIN',False),('diegom','PCP',False),('setor1','APONTADOR',False),('jcarlos','GESTOR',False),('alexh','MONTADOR',False),('tv','CONVIDADO',False),('e2e-lab-probe','Laboratório sem nova unidade',False)]
 result={'actors':[],'cases':[],'expected_denial_writes':[],'business_writes':0,'production_requests':0}
 with sync_playwright() as pw:
  browser=pw.chromium.launch(channel='msedge',headless=True)
  for uid,profile,allowed in actors:
   guard('matrix-'+uid);context=context_for(browser,session(uid));page=context.new_page();result['actors'].append({'id':uid,'profile':profile,'new_units_allowed':allowed})
   for unit,name in [('pederneiras','Pederneiras'),('ribeirao','Ribeirão Preto')]:
    for route,label in PAGES:
     guard('matrix-'+uid+'-'+unit+'-'+label);response=context.request.get(BASE+'/unificado/laboratorio/'+unit+'/cec/'+route);case={'actor':uid,'profile':profile,'unit':unit,'screen':label,'status':response.status,'expected':200 if allowed else 403};result['cases'].append(case);save('matrix.json',result);assert case['status']==case['expected'],case
     if allowed:
      page.set_viewport_size({'width':1440,'height':1000});screen(page,'laboratorio/'+unit+'/cec/'+route);frame=frame_for(page,unit);assert name in frame.locator('.lab-unit-name').inner_text();text=frame.locator('body').inner_text();assert 'Conta antiga' not in text
      if uid!='alex':page.screenshot(path=str(O/f'matrix-{uid}-{unit}-{label}.png'))
    if not allowed:
     for operation in ['moldagens','qrcp']:
      response=context.request.post(BASE+'/unificado/laboratorio/'+unit+'/cec-api/'+operation,data={});case={'actor':uid,'unit':unit,'operation':operation,'method':'POST','status':response.status,'expected':403};result['expected_denial_writes'].append(case);save('matrix.json',result);assert response.status==403,case
     screen(page,'laboratorio/'+unit+'/cec/leitura/');page.screenshot(path=str(O/f'denial-{uid}-{unit}.png'));assert 'Conta antiga' not in page.locator('body').inner_text()
    print(json.dumps({'actor':uid,'profile':profile,'unit':unit,'screens':7,'allowed':allowed}),flush=True)
   context.close()
  browser.close()
 save('matrix.json',result);print(json.dumps({'actors':len(result['actors']),'screen_cases':len(result['cases']),'launch_denials':len(result['expected_denial_writes'])}))
if __name__=='__main__':globals()[sys.argv[1]]()
