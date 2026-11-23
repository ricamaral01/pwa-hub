"""Restore only the reviewed search-release backup under homolog-next."""
import json,os,shutil,sys
from pathlib import Path
H=Path('/opt/concrefer-unificado/homolog-next');B=Path(sys.argv[1]).resolve();P=H/'public/unificado'
assert B.is_relative_to(H/'backups') and B.name.startswith('busca-')
files=json.loads((B/'original-files.json').read_text())
for rel,existed in files.items():
 dest=P/rel;assert dest.resolve().is_relative_to(P)
 if existed:temp=dest.with_name(dest.name+'.restore-tmp');shutil.copy2(B/rel,temp);os.replace(temp,dest)
 else:dest.unlink(missing_ok=True)
print(json.dumps({'restored_files':len(files),'production_changed':False,'services_restarted':False}))
