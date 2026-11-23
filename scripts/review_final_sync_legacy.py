"""Preserve the approved deployed legacy UI when updating its authored static sources."""
import hashlib,io,json,subprocess,tarfile
from pathlib import Path
R=Path(__file__).resolve().parents[1];O=R/'docs/revisao-visual-unificado/homolog/revisao-final'
E=R/'unificado/laboratorio/frontend/embedded'
baseline=json.loads((O.parent/'revisao-completa/service-manifest.json').read_text())
files={p.relative_to(E).as_posix():baseline[p.relative_to(E).as_posix()] for p in E.rglob('*') if p.is_file()}
remote=r'''
import sys,tarfile,hashlib,json,io
from pathlib import Path
files=json.loads(sys.stdin.readline());root=Path('/opt/concrefer-unificado/homolog-next/visual-full')
buffer=io.BytesIO()
with tarfile.open(fileobj=buffer,mode='w:gz') as archive:
 for rel,expected in files.items():
  assert rel.startswith(('laboratorio/server/static/','carta-static/','dosagem-static/')) and '..' not in Path(rel).parts
  p=root/rel;assert p.suffix in ['.html','.css','.js','.svg','.png']
  assert hashlib.sha256(p.read_bytes()).hexdigest()==expected,rel
  archive.add(p,arcname=rel)
sys.stdout.buffer.write(buffer.getvalue())
'''
# Pass the script via -c and only a static path/hash manifest on stdin.
result=subprocess.run(['ssh','vps-staging','python3','-c',"'"+remote.replace("'","'\"'\"'")+"'"],input=json.dumps(files).encode(),capture_output=True,check=True)
receipts=[]
with tarfile.open(fileobj=io.BytesIO(result.stdout),mode='r:gz') as archive:
 for member in archive:
  assert member.name in files and member.isfile()
  raw=archive.extractfile(member).read();assert hashlib.sha256(raw).hexdigest()==files[member.name]
  target=E/member.name;updated=raw.replace(b'1.4.25',b'1.4.26');target.write_bytes(updated)
  receipts.append({'path':member.name,'approved_sha256':files[member.name],'candidate_sha256':hashlib.sha256(updated).hexdigest(),'change':'Only version 1.4.25 to 1.4.26; approved UI preserved'})
(O/'legacy-source-sync.json').write_text(json.dumps(receipts,indent=2))
print(json.dumps({'approved_static_sources_preserved':len(receipts)}))
