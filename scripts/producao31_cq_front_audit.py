"""Capture actual CQ/Lab frontend bytes and compare the frozen release dependency."""
import difflib,hashlib,io,json,re,tarfile
from pathlib import Path
from producao31_common import R,P,O,B,D,remote,save,target
m=json.loads((O/'candidate-manifest.json').read_bytes());initial=json.loads((P/'inventory.json').read_bytes());hashes={p:v for root in initial['files'].values() for p,v in root.items()}
paths={k:target(k) for k in m if k.startswith(('public/laboratorio/','services/laboratorio/'))};paths.update({'cq-static/'+name:'/opt/concrefer-unificado/cq/static/'+name for name in ['app.js','index.html','app.css']})
code='import io,json,tarfile,sys,hashlib\nfrom pathlib import Path\npaths='+repr(paths)+'\nexpected='+repr(hashes)+'''\nbuf=io.BytesIO()
with tarfile.open(fileobj=buf,mode='w:gz') as tar:
 for key,name in paths.items():
  p=Path(name)
  if not p.exists():continue
  assert hashlib.sha256(p.read_bytes()).hexdigest()==expected[name]['sha256'],name
  tar.add(p,arcname=key)
sys.stdout.buffer.write(buf.getvalue())
'''
raw=remote(code,binary=True);(B/'production-cq-lab-frontend.tgz').write_bytes(raw);before=B/'production-cq-lab-frontend';before.mkdir(exist_ok=True)
with tarfile.open(fileobj=io.BytesIO(raw)) as t:t.extractall(before,filter='data')
diffs=O/'lab-frontend-diffs';diffs.mkdir(exist_ok=True);rows=[]
for key in sorted(paths):
 p=before/key
 if key.startswith('cq-static/'):
  assert p.exists() and hashlib.sha256(p.read_bytes()).hexdigest()==hashes[paths[key]]['sha256'];continue
 old=p.read_text(encoding='utf-8').replace('\r\n','\n') if p.exists() else '';new=(D/key).read_text(encoding='utf-8').replace('\r\n','\n')
 if old==new:continue
 filename=key.replace('/','__')+'.diff';diff=''.join(difflib.unified_diff(old.splitlines(True),new.splitlines(True),fromfile='1.4.6/'+key,tofile='1.4.31/'+key));(diffs/filename).write_text(diff,encoding='utf-8')
 old_cq=sorted(re.findall(r'.{0,100}(?:certificados-qualidade|api/certificados).{0,140}',old));new_cq=sorted(re.findall(r'.{0,100}(?:certificados-qualidade|api/certificados).{0,140}',new))
 # Compare CQ URLs as code literals; surrounding branding/style text may change.
 urls=lambda s:sorted(set(re.findall(r'''["'`]([^"'`\s]*(?:certificados-qualidade|api/certificados)[^"'`\s]*)["'`]''',s)))
 assert urls(old)==urls(new),(key,'CQ request/navigation URL changed',urls(old),urls(new))
 suffix=Path(key).suffix;summary='Folha de estilo: tipografia, cores, espaçamento e tokens do padrão visual.' if suffix=='.css' else 'HTML: apresentação e referências a recursos; diferença integral disponível.' if suffix=='.html' else 'Bundle JavaScript: diferença integral disponível; não é o cliente da prévia CQ.'
 rows.append({'file':key,'action':'add' if not p.exists() else 'replace','summary':summary,'diff':'lab-frontend-diffs/'+filename,'before_bytes':p.stat().st_size if p.exists() else 0,'after_bytes':(D/key).stat().st_size,'cq_urls_before':urls(old),'cq_urls_after':urls(new)})
# CQ owns the preview/PDF client; none of these three files is deployed.
assert not any(target(k).startswith('/opt/concrefer-unificado/cq/') for k in m if k.startswith(('public/','services/')))
cq=(before/'cq-static/app.js').read_text(encoding='utf-8');calls=[line.strip() for line in cq.splitlines() if '/pdf' in line or 'preview' in line.lower()]
save('cq-lab-frontend-audit.json',{'cq_frontend_unchanged':{name:hashes['/opt/concrefer-unificado/cq/static/'+name] for name in ['app.js','index.html','app.css']},'cq_preview_client_not_in_manifest':True,'preview_url_parameters_headers_changed':False,'unchanged_cq_client_pdf_calls':calls,'changed_lab_files':rows,'production_changes':0,'ok':True})
print(json.dumps({'changed_lab_files':len(rows),'cq_frontend_files_unchanged':3,'preview_url_parameters_headers_changed':False,'ok':True}))
