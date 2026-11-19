"""Package runtime static deltas, with no APIs, backend sources or database data."""
import hashlib,json,tarfile
from pathlib import Path
R=Path(__file__).resolve().parents[1];U=R/'unificado';O=R/'docs/revisao-visual-unificado/homolog/revisao-final'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
public_base=json.loads((O.parent/'revisao-completa/final-public-manifest.json').read_text())
public={}
for rel in public_base:
    p=U/rel
    if p.is_file() and sha(p)!=public_base[rel]:public[rel]=p
for rel in ['assets/img/logo-concrefer-oficial.png','producao/indicadores-gerais/overview.js','producao/indicadores-gerais/overview.css','producao/indicadores-gerais/presentation.js']:
    public[rel]=U/rel
for p in (U/'qualidade/assets').glob('*'):
    if p.is_file() and p.suffix in {'.js','.css'} and (p.name not in {Path(x).name for x in public_base}):public[p.relative_to(U).as_posix()]=p
services={};static=U/'laboratorio/service/server/static'
for folder in ['postes','novo/postes','cronoanalise']:
    for p in (static/folder).rglob('*'):
        if p.is_file() and p.suffix in {'.js','.css','.html','.woff2'}:services['laboratorio/server/static/'+p.relative_to(static).as_posix()]=p
embedded=U/'laboratorio/frontend/embedded'
for p in embedded.rglob('*'):
    if p.is_file():services[p.relative_to(embedded).as_posix()]=p
services['mapa/testar-index.html']=U/'testar/index.html'
old_service=json.loads((O.parent/'revisao-completa/service-manifest.json').read_text())
services={r:p for r,p in services.items() if old_service.get(r)!=sha(p)}
manifest={}
with tarfile.open(O/'release.tgz','w:gz') as archive:
    for kind,items in [('public',public),('services',services)]:
        for rel,p in sorted(items.items()):
            assert not Path(rel).is_absolute() and '..' not in Path(rel).parts
            assert p.is_file() and p.suffix in {'.js','.css','.html','.woff2','.png','.svg','.json','.webmanifest'} or p.name=='VERSION'
            if kind=='public':assert not {'api','backend','service','node_modules'}.intersection(Path(rel).parts)
            else:assert rel.startswith(('laboratorio/server/static/','carta-static/','dosagem-static/','mapa/testar-index.html'))
            key=kind+'/'+rel;manifest[key]=sha(p);archive.add(p,arcname=key)
(O/'release-manifest.json').write_text(json.dumps(manifest,indent=2))
public_full={**public_base,**{r:sha(p) for r,p in public.items()}}
(O/'final-public-manifest.json').write_text(json.dumps(public_full,indent=2))
(O/'service-manifest.json').write_text(json.dumps({**old_service,**{r:sha(p) for r,p in services.items()}},indent=2))
print(json.dumps({'public_delta':len(public),'service_static_delta':len(services),'bytes':(O/'release.tgz').stat().st_size,'manifest_sha256':sha(O/'release-manifest.json')}))
