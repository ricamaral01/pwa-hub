"""Change only the PDF cover header; preserve all body text and page geometry."""
import hashlib,json
from pathlib import Path
import pymupdf
from PIL import Image,ImageChops,ImageDraw
R=Path(__file__).resolve().parents[1];O=R/'docs/revisao-visual-unificado/homolog/login-uni-20261120';source=R/'.codex-tmp/login-uni-manual-before.pdf';target=R/'.codex-tmp/login-uni-manual-after.pdf'
doc=pymupdf.open(source);page=doc[0];word=page.search_for('UNIFICADO');assert len(word)==1
rect=word[0];raw=page.get_text('rawdict');span=next(s for b in raw['blocks'] if 'lines' in b for l in b['lines'] for s in l['spans'] if ''.join(c['c'] for c in s['chars']).endswith('UNIFICADO'))
chars=span['chars'][-9:];font=next(f for f in page.get_fonts(full=True) if f[3].endswith(span['font']))
fontbuffer=doc.extract_font(font[0])[3];assert fontbuffer
page.add_redact_annot(rect,fill=(1,1,1));page.apply_redactions(images=0,graphics=0)
page.insert_font(fontname='UniCoverFont',fontbuffer=fontbuffer)
value=span['color'];color=(((value>>16)&255)/255,((value>>8)&255)/255,(value&255)/255)
for char,original in zip('UNI',chars):page.insert_text(original['origin'],char,fontsize=span['size'],fontname='UniCoverFont',color=color)
doc.save(target,garbage=3,deflate=True);doc.close();after=pymupdf.open(target);before=pymupdf.open(source)
assert len(after)==len(before)==19
assert 'UNIFICADO' not in after[0].get_text() and 'UNI' in after[0].get_text()
checks=[]
for i,(a,b) in enumerate(zip(before,after)):
 pa=a.get_pixmap();pb=b.get_pixmap();ia=Image.frombytes('RGB',[pa.width,pa.height],pa.samples);ib=Image.frombytes('RGB',[pb.width,pb.height],pb.samples);diff=ImageChops.difference(ia,ib)
 if i==0:
  # Text replacement is the only allowed region. No page/body/footer mask.
  ImageDraw.Draw(diff).rectangle((int(rect.x0)-2,int(rect.y0)-2,int(rect.x1)+2,int(rect.y1)+2),fill=(0,0,0))
 changed=sum(p!=(0,0,0) for p in diff.getdata());assert changed==0,(i+1,changed)
 checks.append({'page':i+1,'same_page_size':tuple(a.rect)==tuple(b.rect),'changed_pixels_outside_header':changed})
 if i==0:ia.save(O/'manual-before-p1.png');ib.save(O/'manual-after-p1.png')
occurrences=[]
for i,p in enumerate(after):
 for r in p.search_for('Unificado'):occurrences.append({'page':i+1,'rect':list(r),'classification':'body or embedded historical diagram; intentionally unchanged per PDF header/footer-only instruction'})
result={'before_sha256':hashlib.sha256(source.read_bytes()).hexdigest(),'after_sha256':hashlib.sha256(target.read_bytes()).hexdigest(),'pages':19,'only_replacement':{'page':1,'from':'UNIFICADO','to':'UNI','rect':list(rect)},'checks':checks,'remaining_body_occurrences':occurrences,'body_layout_unchanged':True}
(O/'manual-pdf-check.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps({'pages':19,'outside_header_pixels_changed':0,'remaining_body_occurrences':len(occurrences)}))
