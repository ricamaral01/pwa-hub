"""Package generated Lab frontend and authored embedded assets, no API code."""
import hashlib,json,sys,tarfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];phase=sys.argv[1];assert phase in ('fase-5','fase-7')
out=ROOT/'docs/revisao-visual-unificado/homolog'/phase;out.mkdir(parents=True,exist_ok=True)
sources={}
base=ROOT/'unificado/laboratorio/service/server/static'
for folder in ['postes','novo/postes','cronoanalise']:
 for p in (base/folder).rglob('*'):
  if p.is_file() and p.suffix in ('.js','.css','.html','.woff2'):
   sources['laboratorio/server/static/'+p.relative_to(base).as_posix()]=p
embedded=ROOT/'unificado/laboratorio/frontend/embedded'
for p in embedded.rglob('*'):
 if p.is_file():sources[p.relative_to(embedded).as_posix()]=p
manifest={r:hashlib.sha256(p.read_bytes()).hexdigest() for r,p in sorted(sources.items())}
(out/'service-manifest.json').write_text(json.dumps(manifest,indent=2))
with tarfile.open(out/'service-static.tgz','w:gz') as a:
 for name,p in sorted(sources.items()):a.add(p,arcname=name)
print(json.dumps({'phase':phase,'service_static_files':len(sources)}))
