"""Shared visual foundation from the approved reference, preserving narrow login."""
import re,shutil
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];U=ROOT/'unificado';ref=ROOT/'docs/revisao-visual-unificado/telas'
fonts=U/'shell/fonts';fonts.mkdir(exist_ok=True)
for p in (ref/'assets').glob('Geist-*.woff2'):shutil.copy2(p,fonts/p.name)
base=(ref/'base.css').read_text(encoding='utf-8')
tokens=base[:base.index('*{box-sizing')].replace('url(assets/','url(fonts/').replace('system-ui,"Segoe UI",sans-serif','system-ui,sans-serif')
tokens+='\nbody,button,input,select,textarea{font-family:var(--f-sans);font-variant-numeric:tabular-nums}\n'
(U/'shell/tokens.css').write_text(tokens,encoding='utf-8')
for p in U.rglob('*.html'):
 if any(x in p.parts for x in ['frontend','sidebar-modelo-a','backend','service']):continue
 s=p.read_text(encoding='utf-8')
 if '</head>' not in s:continue
 media=' media="(min-width:1025px)"' if p==U/'login.html' else ''
 s=s.replace('</head>','<link rel="stylesheet" href="/unificado/shell/tokens.css?v=1.4.7"'+media+'>\n</head>',1)
 p.write_text(s,encoding='utf-8',newline='\n')
p=U/'shell/embedded.css';s=p.read_text();p.write_text('@import url("/unificado/shell/tokens.css?v=1.4.7");\n'+s)
p=U/'sidebar-modelo-a/src/components/sidebar/sidebar.css';s=p.read_text(encoding='utf-8')
s=re.sub(r'@import url\([^)]*\);\s*','',s)
s=s.replace("'IBM Plex Sans', system-ui, sans-serif",'var(--f-sans)').replace("'IBM Plex Mono', monospace",'var(--f-mono)').replace("'IBM Plex Mono', ui-monospace, monospace",'var(--f-mono)').replace("'IBM Plex Sans',sans-serif",'var(--f-sans)')
p.write_text(s,encoding='utf-8',newline='\n')
