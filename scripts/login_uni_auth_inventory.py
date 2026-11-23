"""Inspect test credential provisioning and backend display-label candidates; no secrets."""
import json,os,re
from pathlib import Path
H=Path('/opt/concrefer-unificado/homolog-next')
out={'credential_candidate_paths':[],'backend_labels':[],'template_labels':[]}
for folder in [Path('/etc/concrefer-unificado/homolog'),H/'staging']:
 for base,dirs,names in os.walk(folder):
  dirs[:]=[d for d in dirs if d not in {'node_modules','.venv','.git','release','screenshots','capturas','__pycache__'}]
  for name in names:
   p=Path(base)/name
   if re.search(r'credential|login.*env|test.*user|user.*test',name,re.I):out['credential_candidate_paths'].append(str(p))
for folder in [H/'visual-full/mapa',H/'visual-full/pcp/app',H/'visual-full/laboratorio/server',H/'visual-full/qualidade',H/'visual-full/suprimentos']:
 for base,dirs,names in os.walk(folder):
  dirs[:]=[d for d in dirs if d not in {'node_modules','.venv','.git','__pycache__','static','assets','dist','uploads','storage','backups','data'}]
  for name in names:
   p=Path(base)/name
   if p.suffix not in {'.py','.html'} or p.stat().st_size>3_000_000:continue
   text=p.read_text(errors='replace')
   for i,line in enumerate(text.splitlines(),1):
    if re.search(r'\bUnificado\b',line) and not line.lstrip().startswith(('#','//','/*','from ','import ')) and 'X-Unificado-Screen' not in line:
     # Only public label phrases, no config values/credentials.
     matches=re.findall(r'[A-Za-zÀ-ÿ ]{0,45}\bUnificado\b[A-Za-zÀ-ÿ .!]{0,70}',line)
     out['backend_labels'].append({'file':str(p),'line':i,'public_phrase_candidates':matches})
(H/'staging/login-uni-20261120/backend-inventory.json').write_text(json.dumps(out,ensure_ascii=False,indent=2));print(json.dumps(out,ensure_ascii=True))
