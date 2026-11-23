"""Record production read-only and fetch the exact current homolog static files."""
import io,json,tarfile
from usinas32_common import R,O,T,remote,save
O.mkdir(parents=True,exist_ok=True);T.mkdir(parents=True,exist_ok=True)
prod=remote((R/'scripts/producao_inventory_readonly.py').read_text(encoding='utf-8'));save('production-before.json',prod);assert prod['version']=='1.4.31' and prod['cluster']['common_headroom']>=15
code=r'''
import hashlib,io,json,sys,tarfile
from pathlib import Path
H=Path('/opt/concrefer-unificado/homolog-next');m=json.loads((H/'staging/producao-1.4.31/candidate-manifest.json').read_text());keys=[k for k in m if k.startswith(('public/','services/'))];assert (H/'public/unificado/VERSION').read_text().strip()=='1.4.31'
with tarfile.open(fileobj=sys.stdout.buffer,mode='w|gz') as tar:
 for k in keys:
  root=H/('public/unificado' if k.startswith('public/') else 'visual-full');p=root/k.split('/',1)[1];assert p.resolve().is_relative_to(root)
  tar.add(p,arcname=k,recursive=False)
'''
data=remote(code,binary=True);(T/'before.tgz').write_bytes(data)
with tarfile.open(fileobj=io.BytesIO(data)) as tar:tar.extractall(T/'before',filter='data')
manifest={str(p.relative_to(T/'before')).replace('\\','/'):{'sha256':__import__('hashlib').sha256(p.read_bytes()).hexdigest(),'bytes':p.stat().st_size} for p in (T/'before').rglob('*') if p.is_file()};save('homolog-before-manifest.json',manifest)
print(json.dumps({'production_version':prod['version'],'production_files':sum(len(f) for f in prod['files'].values()),'homolog_version':'1.4.31','homolog_files':len(manifest),'common_headroom':prod['cluster']['common_headroom']}))
