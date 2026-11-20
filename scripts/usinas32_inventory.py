"""Find all live native HTML users of the affected styles/components."""
import hashlib,io,json,tarfile
from usinas32_common import T,remote,save
code=r'''
import json,re
from pathlib import Path
H=Path('/opt/concrefer-unificado/homolog-next');roots={'public/usinas':H/'public/unificado/usinas','services/laboratorio/server/static':H/'visual-full/laboratorio/server/static','services/carta-static':H/'visual-full/carta-static','services/dosagem-static':H/'visual-full/dosagem-static'};rows=[]
for key,root in roots.items():
 for p in sorted(root.rglob('*.html')):
  text=p.read_text(errors='replace');rows.append({'file':key+'/'+p.relative_to(root).as_posix(),'visual_style':bool(re.search(r'(?:usinas|laboratorio)-visual\.css',text)),'static_tables':len(re.findall(r'<table\b',text)),'list_classes':sorted(set(re.findall(r'\b(?:legacy-card|ct-home-card|native-card)\b',text))),'has_review_css':'review-complete.css' in text,'table_wrappers':sorted(set(re.findall(r'class=["\']([^"\']*(?:scroll|table-wrap|tableWrap|table-responsive|tbl-wrap)[^"\']*)',text)))})
print(json.dumps(rows))
'''
rows=remote(code);save('native-component-inventory.json',rows);missing=[r['file'] for r in rows if r['visual_style'] and not (T/'before'/r['file']).exists()]
if missing:
 data=remote("import sys,tarfile\nfrom pathlib import Path\nH=Path('/opt/concrefer-unificado/homolog-next');keys="+repr(missing)+"\nwith tarfile.open(fileobj=sys.stdout.buffer,mode='w|gz') as tar:\n for k in keys:\n  root=H/('public/unificado' if k.startswith('public/') else 'visual-full');p=root/k.split('/',1)[1];assert p.resolve().is_relative_to(root);tar.add(p,arcname=k,recursive=False)",binary=True)
 with tarfile.open(fileobj=io.BytesIO(data)) as tar:tar.extractall(T/'before',filter='data')
manifest={p.relative_to(T/'before').as_posix():{'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'bytes':p.stat().st_size} for p in (T/'before').rglob('*') if p.is_file()};save('homolog-before-manifest.json',manifest);print(json.dumps({'native_html':len(rows),'shared_style_users':sum(r['visual_style'] for r in rows),'extra_files_fetched':missing,'list_users':sum(bool(r['list_classes']) for r in rows)}))
