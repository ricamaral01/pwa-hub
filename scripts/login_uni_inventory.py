"""Record source labels before changing them; internal identifiers are excluded."""
import hashlib,json,re,shutil,os
from pathlib import Path
R=Path(__file__).resolve().parents[1];O=R/'docs/revisao-visual-unificado/homolog/login-uni-20261120';O.mkdir(parents=True,exist_ok=True)
B=R/'.codex-tmp/login-uni-baseline';B.mkdir(parents=True,exist_ok=True)
rows=[];hashes={}
paths=[]
for base,dirs,names in os.walk(R/'unificado'):
 dirs[:]=[d for d in dirs if d not in {'node_modules','.git','vendor','.venv','__pycache__','frontend-embedded'}]
 paths.extend(Path(base)/name for name in names)
for p in paths:
 if p.suffix not in {'.html','.js','.css','.py','.tsx','.ts','.json','.webmanifest'} and p.name!='VERSION':continue
 try:text=p.read_text(encoding='utf-8')
 except (UnicodeDecodeError,OSError):continue
 rel=p.relative_to(R).as_posix();hashes[rel]=hashlib.sha256(p.read_bytes()).hexdigest()
 dest=B/rel;dest.parent.mkdir(parents=True,exist_ok=True)
 if not dest.exists():shutil.copy2(p,dest)
 for line_no,line in enumerate(text.splitlines(),1):
  if not re.search(r'(?<![\w/-])(?:Unificado|unificado)(?![\w/-])',line):continue
  # Header names, DB literals and comments are identifiers/internal documentation.
  if 'X-Unificado-Screen' in line and not re.search(r'>[^<]*Unificado|[ .]do Unificado',line):continue
  stripped=line.strip()
  if stripped.startswith(('//','/*','*','#','<!--','from ','import ')):continue
  if re.search(r'>[^<]*(?:Unificado|unificado)|["\x27`][^"\x27`\n]*(?:[ ](?:Unificado|unificado)|(?:Unificado|unificado)[ ·.!?])',line):
   rows.append({'file':rel,'line':line_no,'before':line[:1600],'kind':'source_label_candidate; review identifiers in mixed lines'})
(O/'inventory-before.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2),encoding='utf-8')
(B/'source-hashes.json').write_text(json.dumps(hashes,indent=2))
print(json.dumps({'label_candidates':len(rows),'files':len(set(r['file'] for r in rows)),'baseline_source_files':len(hashes)}))
