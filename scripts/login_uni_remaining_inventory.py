"""Read display-label candidates in other isolated service roots, including GED."""
import json,os,re
from pathlib import Path
H=Path('/opt/concrefer-unificado/homolog-next');O=H/'staging/login-uni-20261120';rows=[];files=0
for base,dirs,names in os.walk(H/'visual-full'):
 dirs[:]=[d for d in dirs if d not in {'node_modules','.venv','venv','.git','__pycache__','assets','static','dist','uploads','storage','backups','data','public','vendor','photo-storage'}]
 for name in names:
  p=Path(base)/name
  if p.suffix not in {'.py','.js','.html','.tsx','.ts','.cs','.razor'} or p.stat().st_size>3_000_000:continue
  files+=1
  for i,line in enumerate(p.read_text(errors='replace').splitlines(),1):
   if re.search(r'\bUnificado\b',line) and not line.lstrip().startswith(('#','//','/*','from ','import ')) and 'X-Unificado-Screen' not in line:
    phrases=re.findall(r'[A-Za-zÀ-ÿ ]{0,45}\bUnificado\b[A-Za-zÀ-ÿ .!]{0,70}',line)
    rows.append({'file':str(p),'line':i,'phrase_candidates':phrases})
result={'files_checked':files,'rows':rows,'mode':'read only; after the first label patches; includes remaining isolated service roots'}
(O/'backend-additional-inventory.json').write_text(json.dumps(result,ensure_ascii=False,indent=2));print(json.dumps(result,ensure_ascii=True))
