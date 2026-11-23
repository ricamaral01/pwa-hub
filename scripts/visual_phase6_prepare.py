"""Apply screen-only presentation to the remaining modules; retain print CSS."""
import re,json
from pathlib import Path
from visual_css_tokens import screen_only,color
ROOT=Path(__file__).resolve().parents[1];U=ROOT/'unificado'
areas=['mapa','manutencao-usina','relatorios','producao','m','armacao','tv','painel-tv']
skip={'node_modules','backend','service','api','assets','dist','dist-tasks','.venv'}
changed=[]
for area in areas:
 for p in (U/area).rglob('*'):
  if not p.is_file() or any(x in skip for x in p.relative_to(U).parts):continue
  if 'frontend' in p.parts:continue
  if p.suffix not in ('.css','.html'):continue
  s=p.read_text(encoding='utf-8');original=s
  s=re.sub(r'[\w-]*eyebrow','legacy-print-title',s).replace('accent-mark','title-decoration')
  if p.suffix=='.css':s='@import url("/unificado/shell/tokens.css");\n'+screen_only(s)
  else:
   s=re.sub(r'<link[^>]+(?:fonts.googleapis.com|fonts.gstatic.com)[^>]*>','',s)
   s=re.sub(r'<style([^>]*)>(.*?)</style>',lambda m:'<style'+m[1]+'>'+screen_only(m[2])+'</style>',s,flags=re.S)
   if '/shell/remaining-visual.css' not in s:s=s.replace('</head>','<link rel="stylesheet" href="/unificado/shell/module-components.css?v=1.4.12"><link rel="stylesheet" href="/unificado/shell/remaining-visual.css?v=1.4.12"><script defer src="/unificado/shell/components.js?v=1.4.12"></script></head>')
  if s!=original:p.write_text(s,encoding='utf-8');changed.append(str(p.relative_to(ROOT)))
for area in ['logistica','qualidade','producao/noroeste','producao/pederneiras','producao/ribeirao']:
 base=U/area/'frontend'
 for p in (base/'src').rglob('*'):
  if p.suffix not in ('.css','.tsx'):continue
  s=p.read_text(encoding='utf-8')
  if p.suffix=='.css':s='@import url("/unificado/shell/tokens.css");\n'+screen_only(s)
  else:
   s=re.sub(r'<p className="lg-eyebrow">.*?</p>','',s)
   s=s.replace("{r.posicao<=3?['🥇','🥈','🥉'][r.posicao-1]:r.posicao}",'{r.posicao}')
   s=re.sub(r'<span className="lg-tool-arrow"[^>]*>.*?</span>','',s)
  p.write_text(s,encoding='utf-8');changed.append(str(p.relative_to(ROOT)))
out=ROOT/'docs/revisao-visual-unificado/homolog/fase-6';out.mkdir(parents=True,exist_ok=True)
(out/'prepared-files.json').write_text(json.dumps(changed,indent=2))
print('Prepared',len(changed),'presentation files')
