"""Apply shared screen presentation, preserving original authored print CSS."""
import re,subprocess
from pathlib import Path
from visual_css_tokens import screen_only
ROOT=Path(__file__).resolve().parents[1];U=ROOT/'unificado'
BASE='ec15aee4'
def original(p):return subprocess.check_output(['git','show',BASE+':'+p.relative_to(ROOT).as_posix()],cwd=ROOT).decode('utf-8')
for p in (U/'pcp').rglob('*.css'):
 if any(x in p.parts for x in ['backend','node_modules']):continue
 if p.name=='inter-original.css':continue  # Unused historical font asset.
 css=re.sub(r'[\w-]*eyebrow','legacy-print-title',original(p))
 p.write_text('@import url("/unificado/shell/tokens.css");\n'+screen_only(css),encoding='utf-8')
for p in (U/'pcp').rglob('*.html'):
 if any(x in p.parts for x in ['backend','node_modules']):continue
 s=original(p)
 # Keep the original print title, while screen headers use the shell breadcrumb.
 s=re.sub(r'[\w-]*eyebrow','legacy-print-title',s)
 s=re.sub(r'<style([^>]*)>(.*?)</style>',lambda m:'<style'+m[1]+'>'+screen_only(m[2])+'</style>',s,flags=re.S)
 if '/shell/module-components.css' not in s:s=s.replace('</head>','<link rel="stylesheet" href="/unificado/shell/module-components.css?v=1.4.10">\n<script defer src="/unificado/shell/components.js?v=1.4.10"></script>\n</head>')
 p.write_text(s,encoding='utf-8')
