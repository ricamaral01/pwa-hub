"""Version and package public changes only, never backend source or environment."""
import hashlib,json,re,subprocess,sys,tarfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def version(value):
 (ROOT/'unificado/VERSION').write_text(value+'\n')
 p=ROOT/'unificado/shell/shell.js'
 s=p.read_text(encoding='utf-8');s=re.sub(r"const APP_VERSION = '[^']+'", "const APP_VERSION = '"+value+"'",s);p.write_text(s,encoding='utf-8')
 for p in (ROOT/'unificado').rglob('*'):
  if not p.is_file() or any(x in p.parts for x in ['node_modules','src','backend','service','.venv']):continue
  if p.suffix=='.html' or (p.suffix=='.css' and p.parent==ROOT/'unificado/shell') or p.relative_to(ROOT/'unificado').as_posix() in ['shell/router.js','shell/modelo-a-loader.js','sw.js']:
   s=p.read_text(encoding='utf-8');s=re.sub(r'(?<=\?v=)[^\s\x22\x27<>`)}]+',value,s)
   if p.name=='sw.js':s=re.sub(r'concrefer-unificado-shell-v[\w.\-]+','concrefer-unificado-shell-v'+value,s)
   p.write_text(s,encoding='utf-8',newline='\n')
def package(phase,base):
 out=ROOT/f'docs/revisao-visual-unificado/homolog/{phase}';out.mkdir(parents=True,exist_ok=True)
 changed=subprocess.check_output(['git','diff','--name-only',base],cwd=ROOT,text=True).splitlines()
 changed+=subprocess.check_output(['git','ls-files','--others','--exclude-standard'],cwd=ROOT,text=True).splitlines()
 selected=[]
 for rel in sorted(set(changed)):
  p=Path(rel)
  if not rel.startswith('unificado/') or not (ROOT/p).is_file():continue
  if any(x in p.parts for x in ['src','backend','service','sidebar-modelo-a','api','node_modules','dist','dist-tasks']):continue
  if 'frontend' in p.parts and not rel.startswith('unificado/suprimentos/frontend/'):continue
  selected.append(rel[len('unificado/'):])
 manifest={r:hashlib.sha256((ROOT/'unificado'/r).read_bytes()).hexdigest() for r in selected}
 (out/'manifest.json').write_text(json.dumps(manifest,indent=2))
 (out/'arquivos-alterados.txt').write_text('\n'.join(selected)+'\n')
 with tarfile.open(out/'public.tgz','w:gz') as a:
  for r in selected:a.add(ROOT/'unificado'/r,arcname=r)
 print(json.dumps({'phase':phase,'files':len(selected)}))
if __name__=='__main__':
 if sys.argv[1]=='version':version(sys.argv[2])
 else:package(sys.argv[1],sys.argv[2])
