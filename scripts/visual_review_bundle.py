"""Package untouched screenshots and compare the narrow login to its baseline."""
from pathlib import Path
import json,zipfile,html
from PIL import Image,ImageChops
ROOT=Path(__file__).resolve().parents[1]
out=ROOT/'docs/revisao-visual-unificado/homolog/fase-2'
baseline=out.parent/'fase-1/antes';checks=[]
for width in [1024,820,390]:
 a=Image.open(baseline/f'login-{width}.png');b=Image.open(out/f'depois/login-{width}.png')
 box=(0,0,a.width,a.height-28)
 identical=ImageChops.difference(a.crop(box),b.crop(box)).getbbox() is None
 checks.append({'width':width,'identical_except_version_footer':identical})
assert all(x['identical_except_version_footer'] for x in checks),checks
(out/'login-comparison.json').write_text(json.dumps({'baseline':'phase 1 before, version 1.4.6','current':'1.4.8','excluded':'bottom 28px containing the version footer','checks':checks},indent=2))
screens=[('inicio','Início','inicio.html'),('planejamento','Planejamento','t-planejamento.html'),('laboratorio','Laboratório','laboratorio.html'),('suprimentos','Suprimentos — entrada do módulo','suprimentos.html'),('login','Login','login.html'),('acesso-rapido-previa','Meu acesso rápido — prévia de componentes','acesso-rapido.html')]
parts=['''<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Revisão da fase 2 · 1.4.8</title><style>body{font:14px/1.5 system-ui,sans-serif;background:#f4f5f7;color:#0b1730;margin:0;padding:24px}a{color:#15416f}h1{font-size:24px;margin:0}h2{margin-top:36px}nav{display:flex;gap:16px;flex-wrap:wrap}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}figure{margin:0;border:1px solid #e1e5eb;background:white;border-radius:6px;padding:12px}figcaption{margin-bottom:8px}img{display:block;width:100%;max-height:520px;object-fit:contain;object-position:top}small{color:#5b6779}.note{padding:12px;background:#fff3cd;border-radius:4px}@media(max-width:800px){.grid{grid-template-columns:1fr}body{padding:16px}}</style><body><h1>Fase 2 · versão 1.4.8</h1><p>Somente homologação 18446. Fases 3–7 não iniciadas. Clique nas imagens para abrir em tamanho original.</p><p><a href="RELATORIO.md">Relatório e roteiro</a> · <a href="capturas-fase-2.zip">Baixar 24 capturas finais</a> · <a href="https://concrefer.concretrack.com.br:18446/unificado/">Abrir homologação</a></p><nav>''']
for key,title,_ in screens:parts.append(f'<a href="#{key}">{html.escape(title)}</a>')
parts.append('</nav>')
for key,title,ref in screens:
 parts.append(f'<section id="{key}"><h2>{html.escape(title)}</h2><p><a href="../../telas/{ref}">Referência estática</a></p>')
 if key=='acesso-rapido-previa':parts.append('<p class="note">Prévia visual no navegador. A conta real continua com atalhos desativados. Destinos filtrados pelo IAM real; nenhuma configuração ou permissão foi gravada.</p>')
 for width in [1440,1024,820,390]:
  parts.append(f'<h3>{width}px</h3><div class="grid">')
  moments=['depois'] if key=='acesso-rapido-previa' else ['antes','depois']
  for moment in moments:
   path=f'{moment}/{key}-{width}.png';assert (out/path).is_file(),path
   parts.append(f'<figure><figcaption>{moment.capitalize()} · {width}px</figcaption><a href="{path}" target="_blank"><img loading="lazy" src="{path}" alt="{html.escape(title)} — {moment}, {width}px"></a></figure>')
  parts.append('</div>')
 parts.append('</section>')
parts.append('</body></html>');(out/'galeria.html').write_text(''.join(parts),encoding='utf-8')
files=sorted((out/'depois').glob('*.png'));assert len(files)==24,len(files)
with zipfile.ZipFile(out/'capturas-fase-2.zip','w',zipfile.ZIP_DEFLATED) as z:
 for p in files:z.write(p,'capturas/'+p.name)
 z.write(out/'RELATORIO.md','RELATORIO.md')
print(json.dumps({'final_screenshots':len(files),'zip_bytes':(out/'capturas-fase-2.zip').stat().st_size,'narrow_login':checks}))
