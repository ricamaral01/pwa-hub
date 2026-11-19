"""Update authored asset URLs for the next homolog-only visual release."""
import json,os
from pathlib import Path
R=Path(__file__).resolve().parents[1];U=R/'unificado';O=R/'docs/revisao-visual-unificado/homolog/revisao-final'
changed=[]
for base,dirs,names in os.walk(U):
    dirs[:]=[d for d in dirs if d not in {'node_modules','.venv','vendor','backend','service','api','dist','dist-tasks','assets','modelo-a','.git','__pycache__'}]
    for name in names:
        p=Path(base)/name
        if p.suffix not in {'.html','.css','.js','.tsx','.json','.webmanifest'}:continue
        s=p.read_text(encoding='utf-8')
        if '1.4.25' in s:
            p.write_text(s.replace('1.4.25','1.4.26'),encoding='utf-8');changed.append(str(p.relative_to(U)))
(U/'VERSION').write_text('1.4.26\n')
(O/'version-files.json').write_text(json.dumps(changed,indent=2))
print(json.dumps({'version':'1.4.26','updated_authored_files':len(changed)}))
