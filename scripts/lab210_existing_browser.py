"""Existing units before/after, real H data, business writes forbidden."""
import hashlib,json,sys,time
import pymupdf
from pathlib import Path
from playwright.sync_api import sync_playwright
from lab210_resume_common import BASE,O,save,activity
from lab210_browser import session,context_for
def budget(label):
 for attempt in range(10):
  d=activity();save('activity-'+label+'.json',d)
  if d['total_activity']<=79:return
  print('CAPACITY_WAIT '+str(d['total_activity']),flush=True);time.sleep(10)
 raise RuntimeError('CAPACITY_PAUSED '+label)
def pdf_fingerprint(path):
 with pymupdf.open(path) as doc:
  return {'pages':len(doc),'text_sha256':hashlib.sha256('\n'.join(p.get_text() for p in doc).encode()).hexdigest(),'page_raster_sha256':[hashlib.sha256(p.get_pixmap(matrix=pymupdf.Matrix(2,2),alpha=False).samples).hexdigest() for p in doc]}
def run(mode):
 results=[];actor=session('user-ricardo')
 with sync_playwright() as pw:
  browser=pw.chromium.launch(channel='msedge',headless=True);context=context_for(browser,actor)
  context.add_init_script("(()=>{let chart;Object.defineProperty(window,'Chart',{configurable:true,get(){return chart},set(v){chart=v;if(v?.defaults)v.defaults.animation=false}})})()")
  for unit,prefix in [('campinas',''),('noroeste','noroeste/')]:
   budget('existing-'+mode+'-'+unit);page=context.new_page();page.goto(BASE+'/unificado/laboratorio/'+prefix+'cec/etiquetas/',wait_until='networkidle')
   page.locator('#fAno').select_option('2026');page.locator('#fMes').select_option('07');page.locator('#fMes').dispatch_event('change');page.locator('#fDia').select_option('13');page.locator('button[onclick="loadMassadas()"]').click();page.wait_for_timeout(600)
   result={'unit':unit,'mode':mode,'business_writes_blocked':True,'source':'real H18446 data'}
   if unit=='campinas':
    page.locator('tr[data-id="69855"]').click();page.locator('#btnGerar').click();page.locator('.etiqueta').first.wait_for()
    with page.expect_download() as download:page.get_by_role('button',name='PDF (90×40mm)',exact=False).click()
    pdf=O/f'existing-{unit}-labels-{mode}.pdf';download.value.save_as(pdf);result['labels_pdf']=pdf.name;result['labels_fingerprint']=pdf_fingerprint(pdf)
   else:
    result['labels_not_generated_reason']='H Noroeste has0 source batches; no data invented or copied into the unit'
    assert page.locator('tr[data-id]').count()==0
   page.screenshot(path=str(O/f'existing-{unit}-labels-{mode}.png'));page.close()
   budget('existing-'+mode+'-'+unit+'-report');page=context.new_page();page.goto(BASE+'/unificado/laboratorio/'+prefix+'cec/analise/relatorio.html',wait_until='networkidle');page.wait_for_timeout(2200)
   pdf=O/f'existing-{unit}-report-{mode}.pdf';page.pdf(path=str(pdf),print_background=True,prefer_css_page_size=True);result['report_pdf']=pdf.name;result['report_fingerprint']=pdf_fingerprint(pdf);page.screenshot(path=str(O/f'existing-{unit}-report-{mode}.png'));page.close();results.append(result)
   save('existing-browser-'+mode+'.json',results);print(json.dumps({'unit':unit,'mode':mode,'labels':unit=='campinas','report':True}),flush=True)
  context.close();browser.close()
 if mode=='after':
  before=json.loads((O/'existing-browser-before.json').read_text());comparisons=[]
  for a,b in zip(before,results):
   for kind in ['labels','report']:
    key=kind+'_fingerprint'
    if key in a:comparisons.append({'unit':a['unit'],'kind':kind,'text_identical':a[key]['text_sha256']==b[key]['text_sha256'],'render_identical':a[key]['page_raster_sha256']==b[key]['page_raster_sha256'],'pages_before':a[key]['pages'],'pages_after':b[key]['pages']})
  save('existing-pdf-comparison.json',comparisons)
  assert all(x['text_identical'] and x['render_identical'] for x in comparisons),comparisons
if __name__=='__main__':run(sys.argv[1])
