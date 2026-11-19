"""Publish the cumulative static release with byte-exact hashes, including CRLF normalization."""
import hashlib,json,tarfile
from pathlib import Path
R=Path(__file__).resolve().parents[1];O=R/'docs/revisao-visual-unificado/homolog/revisao-completa';U=R/'unificado'
paths=set(json.loads((O.parent/'fase-7/final-public-manifest.json').read_text()))|set(json.loads((O/'manifest.json').read_text()))
manifest={}
for rel in sorted(paths):
 p=U/rel;assert p.resolve().is_relative_to(U) and p.is_file()
 assert not any(x in p.relative_to(U).parts for x in ['api','backend','service','..'])
 manifest[rel]=hashlib.sha256(p.read_bytes()).hexdigest()
for name in ['manifest.json','final-public-manifest.json']:(O/name).write_text(json.dumps(manifest,indent=2))
with tarfile.open(O/'public.tgz','w:gz') as archive:
 for rel in manifest:archive.add(U/rel,arcname=rel)
(O/'arquivos-publicados.txt').write_text('\n'.join(manifest)+'\n')
print(json.dumps({'cumulative_static_files':len(manifest)}))
