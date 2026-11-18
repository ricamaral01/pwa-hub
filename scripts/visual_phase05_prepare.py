"""Package published bytes; never package credentials or working-tree changes."""
import hashlib,json,shutil,tarfile
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'docs/revisao-visual-unificado/homolog/fase-0.5'
release=OUT/'release';release.mkdir(exist_ok=True)
files={}
def add(source,relative):
    target=release/relative;target.parent.mkdir(parents=True,exist_ok=True)
    shutil.copy2(source,target);files[relative]=hashlib.sha256(target.read_bytes()).hexdigest()
snapshot=OUT/'snapshot'
for directory in ['app','alembic']:
    for p in (snapshot/'pcp-api'/directory).rglob('*'):
        if p.is_file():add(p,'pcp-api/'+str(p.relative_to(snapshot/'pcp-api')).replace('\\','/'))
for name in ['alembic.ini','requirements.txt']:add(snapshot/'pcp-api'/name,'pcp-api/'+name)
for name in ['screen_access.py','screen_catalog.json']:add(snapshot/'mapa-api'/name,'mapa-api/'+name)
published=json.loads((ROOT/'docs/revisao-visual-unificado/homolog/fase-0/producao-hashes.json').read_text())
for relative,digest in published.items():
    if relative.startswith(('shell/','pcp/','assets/','vendor/')) or relative in ['index.html','login.html','VERSION','sw.js','manifest.webmanifest']:
        source=ROOT/'unificado'/relative
        assert hashlib.sha256(source.read_bytes()).hexdigest()==digest,('Not published bytes',relative)
        add(source,'public/unificado/'+relative)
for name in ['visual_phase05_migrate.py','visual_phase05_install.py','mark_unificado_homolog.py']:shutil.copy2(ROOT/'scripts'/name,OUT/name)
(OUT/'release-manifest.json').write_text(json.dumps(files,indent=2))
with tarfile.open(OUT/'release.tgz','w:gz') as archive:
    for relative in files:archive.add(release/relative,arcname='release/'+relative)
print(json.dumps({'published_files':len(files)}))
