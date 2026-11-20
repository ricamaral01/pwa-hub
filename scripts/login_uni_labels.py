"""Apply display-only labels and asset version; record every changed source."""
import hashlib,json,re
from pathlib import Path
R=Path(__file__).resolve().parents[1];O=R/'docs/revisao-visual-unificado/homolog/login-uni-20261120';B=R/'.codex-tmp/login-uni-baseline'
baseline=json.loads((B/'source-hashes.json').read_text());changes=[]
for rel in baseline:
 p=R/rel
 # Keep generated bundles aligned with their source label; no identifier rewrite.
 if p.suffix not in {'.html','.js','.tsx','.ts','.webmanifest'} and p.name!='VERSION':continue
 text=p.read_text(encoding='utf-8');new=text
 if p.suffix=='.webmanifest' and p.name=='manifest.webmanifest' and p.parent==R/'unificado':
  manifest=json.loads(text);manifest['name']='Uni';manifest['short_name']='Uni';new=json.dumps(manifest,ensure_ascii=False,indent=2)+'\n'
 else:
  new=new.replace('X-Unificado-Screen','X-__KEEP_SCREEN_HEADER__-Screen')
  lines=[]
  for line in new.splitlines(keepends=True):
   if not line.lstrip().startswith(('//','/*','*','<!--')):
    line=re.sub(r'\bUnificado\b','Uni',line)
    line=re.sub(r'\bSistema unificado\b','Uni',line)
    line=re.sub(r'\bsistema unificado\b','Uni',line)
   lines.append(line)
  new=''.join(lines).replace('X-__KEEP_SCREEN_HEADER__-Screen','X-Unificado-Screen')
 new=new.replace('?v=1.4.26','?v=1.4.27')
 if rel in ['unificado/shell/shell.js','unificado/sw.js']:new=new.replace('1.4.26','1.4.27')
 if p.name=='VERSION' and p.parent==R/'unificado':new='1.4.27\n'
 if rel=='unificado/shell/modelo-a/menu.js':
  new=new.replace('"v",\n                h.version','"Uni ",\n                h.version')
 if rel=='unificado/sidebar-modelo-a/src/components/sidebar/Sidebar.tsx':new=new.replace('>v{p.version}<','>Uni {p.version}<')
 if rel=='unificado/shell/shell.js':new=new.replace('`Versão ${APP_VERSION}`','`Uni ${APP_VERSION}`')
 if text!=new:p.write_text(new,encoding='utf-8')
 before=(B/rel).read_bytes()
 if p.read_bytes()!=before:changes.append({'file':rel,'before_sha256':hashlib.sha256(before).hexdigest(),'after_sha256':hashlib.sha256(p.read_bytes()).hexdigest()})
(O/'source-changes.json').write_text(json.dumps(changes,indent=2),encoding='utf-8')
print(json.dumps({'changed_files':len(changes)}))
