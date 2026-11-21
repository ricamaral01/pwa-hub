"""Repeat visual/print proof after the icon fix, with all business writes blocked."""
import json,shutil,sys,time
import pymupdf,numpy as np,zxingcpp
from playwright.sync_api import sync_playwright
from lab210_resume_common import BASE,O,save
from lab210_browser import session,context_for,screen
from lab210_live_proofs import PAGES,WIDTHS,guard,frame_for,audit
def run():
 source=O/'proof-alex.json';shutil.copy2(source,O/'proof-alex-before-icons-fix.json');records=json.loads(source.read_text(encoding='utf-8'));prior_docs=records['documents'];records['captures']=[];records['documents']=[];records['visual_revision']='public-icon-CSS';records['visual_refresh_business_writes']=0
 with sync_playwright() as pw:
  browser=pw.chromium.launch(channel='msedge',headless=True);context=context_for(browser,session('alex'));page=context.new_page();page.on('pageerror',lambda e:records['js_errors'].append(str(e)))
  for unit,name,identity in [('pederneiras','Pederneiras',9002100001),('ribeirao','Ribeirão Preto',9002100002)]:
   for route,label in PAGES:
    before=guard('refresh-'+unit+'-'+label);page.set_viewport_size({'width':1440,'height':1000});screen(page,'laboratorio/'+unit+'/cec/'+route);frame=frame_for(page,unit);page.wait_for_timeout(1800 if label in ['analise','relatorio'] else 100)
    for width,height in WIDTHS:
     page.set_viewport_size({'width':width,'height':height});page.wait_for_timeout(120);check=audit(frame);file=f'{unit}-{label}-{width}.png';page.screenshot(path=str(O/file));row={'unit':unit,'page':label,'width':width,'file':file,'activity_before':before['total_activity'],**check};records['captures'].append(row);save('proof-alex.json',records);assert not check['pageOverflow'] and not check['brokenHeaders'] and not check['brokenImages'] and check['iconFontValid'],row;assert name in check['unit_label']
    guard('refresh-'+unit+'-'+label+'-after');print(json.dumps({'unit':unit,'page':label,'widths':4,'icon_font_verified':True}),flush=True)
   guard('refresh-documents-'+unit);printer=context.new_page();printer.set_viewport_size({'width':1440,'height':1000});printer.goto(BASE+'/unificado/laboratorio/'+unit+'/cec/etiquetas/',wait_until='networkidle');printer.locator('tr[data-id="'+str(identity)+'"]').click();printer.locator('#btnGerar').click();printer.locator('.etiqueta').first.wait_for()
   with printer.expect_download() as download:printer.get_by_role('button',name='PDF (90×40mm)',exact=False).click()
   pdf=O/f'{unit}-etiquetas.pdf';download.value.save_as(pdf);decoded=[]
   with pymupdf.open(pdf) as doc:
    for i,p in enumerate(doc):
     text=p.get_text();assert name in text;pix=p.get_pixmap(matrix=pymupdf.Matrix(4,4),alpha=False);arr=np.frombuffer(pix.samples,dtype=np.uint8).reshape(pix.height,pix.width,3);codes=zxingcpp.read_barcodes(arr);assert len(codes)==1;decoded.append(codes[0].text)
     if i==0:pix.save(O/f'{unit}-etiqueta-preview.png')
   previous=next(d for d in prior_docs if d['unit']==unit and d['type']=='labels');assert decoded==previous['qrs'];records['documents'].append(previous)
   file=O/f'{unit}-impressao.pdf';printer.pdf(path=str(file),print_background=True,prefer_css_page_size=True)
   with pymupdf.open(file) as doc:assert name in ''.join(p.get_text() for p in doc);doc[0].get_pixmap(matrix=pymupdf.Matrix(1.4,1.4),alpha=False).save(O/f'{unit}-impressao-preview.png')
   records['documents'].append({'unit':unit,'type':'print-preview','file':file.name,'physical_printer_tested':False});printer.close()
   guard('refresh-report-'+unit);printer=context.new_page();printer.set_viewport_size({'width':1440,'height':1000});printer.goto(BASE+'/unificado/laboratorio/'+unit+'/cec/analise/relatorio.html',wait_until='networkidle');printer.wait_for_timeout(2000);file=O/f'{unit}-relatorio.pdf';printer.pdf(path=str(file),print_background=True,prefer_css_page_size=True)
   with pymupdf.open(file) as doc:assert name in ''.join(p.get_text() for p in doc);doc[0].get_pixmap(matrix=pymupdf.Matrix(1.4,1.4),alpha=False).save(O/f'{unit}-relatorio-preview.png')
   records['documents'].append({'unit':unit,'type':'report','file':file.name});printer.close();save('proof-alex.json',records)
  context.close()
  for uid in ['marcelo','philippe','user-ricardo']:
   context=context_for(browser,session(uid));page=context.new_page()
   for unit in ['pederneiras','ribeirao']:
    for route,label in PAGES:
     if label not in ['geral','etiquetas','leitura','resultados','relatorio']:continue
     guard('refresh-'+uid+'-'+unit+'-'+label);screen(page,'laboratorio/'+unit+'/cec/'+route);frame=frame_for(page,unit);check=audit(frame);assert check['iconFontValid'];page.screenshot(path=str(O/f'matrix-{uid}-{unit}-{label}.png'))
   context.close();print(json.dumps({'master_refreshed':uid,'screens':10}),flush=True)
  browser.close()
 save('proof-alex.json',records);print(json.dumps({'visual_cases':len(records['captures']),'documents':len(records['documents']),'all_icon_fonts_valid':True,'business_writes':0}))
if __name__=='__main__':run()
