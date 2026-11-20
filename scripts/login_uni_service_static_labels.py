"""Display-only help labels served by isolated module static roots."""
import difflib,json,re,shutil
from pathlib import Path
from datetime import datetime,timezone
H=Path('/opt/concrefer-unificado/homolog-next');V=H/'visual-full';O=H/'staging/login-uni-20261120'
B=H/'backups'/('login-uni-help-'+datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ'));B.mkdir(mode=0o700);rows=[]
for rel in ['carta-static/manual/manual-carta-traco.html','dosagem-static/direct-entry.html']:
 p=V/rel;assert p.resolve().is_relative_to(V);old=p.read_text();new=re.sub(r'\bUnificado\b','Uni',old)
 if old==new:continue
 saved=B/rel;saved.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(p,saved);p.write_text(new);p.chmod(0o644)
 rows.append({'file':rel,'patch':''.join(difflib.unified_diff(old.splitlines(True),new.splitlines(True),fromfile=rel,tofile=rel))})
result={'backup':str(B),'changes':rows,'services_restarted':False,'rollback':'restore each file from backup to visual-full; no restart','production_changed':False}
(O/'service-static-labels.json').write_text(json.dumps(result,ensure_ascii=False,indent=2));print(json.dumps({'backup':str(B),'files':len(rows)}))
