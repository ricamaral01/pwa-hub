"""Build a static release from the actual homolog baseline, preserving prior work."""
import hashlib,json,re,tarfile
from pathlib import Path
R=Path(__file__).resolve().parents[1];O=R/'docs/revisao-visual-unificado/homolog/login-uni-20261120';B=R/'.codex-tmp/login-uni-public-before';D=R/'.codex-tmp/login-uni-release';D.mkdir(exist_ok=True)
def labels(text):
 text=text.replace('X-Unificado-Screen','X-__KEEP_HEADER__-Screen')
 out=[]
 for line in text.splitlines(keepends=True):
  if not line.lstrip().startswith(('//','/*','*','<!--')):
   line=re.sub(r'\bUnificado\b','Uni',line)
   line=re.sub(r'\b[Ss]istema unificado\b','Uni',line)
  out.append(line)
 return ''.join(out).replace('X-__KEEP_HEADER__-Screen','X-Unificado-Screen').replace('?v=1.4.26','?v=1.4.27')
manifest={};audit=[]
for p in B.rglob('*'):
 if not p.is_file():continue
 rel=p.relative_to(B).as_posix()
 if rel.startswith(('vendor/','armacao/')):continue
 raw=p.read_bytes()
 try:text=raw.decode('utf-8')
 except UnicodeDecodeError:continue
 new=labels(text)
 if rel in ['manifest.webmanifest','mapa/operacao/manifest.json']:
  data=json.loads(text);data['name']='Uni';data['short_name']='Uni';data['icons'][0]['sizes']='1254x1254';data['icons'].insert(0,{'src':'/unificado/assets/img/unificado-pwa-icon.svg','sizes':'any','type':'image/svg+xml','purpose':'any'});new=json.dumps(data,ensure_ascii=False,indent=2)+'\n'
 if rel=='shell/modelo-a/menu.js':new=new.replace('"v",\n                h.version','"Uni ",\n                h.version')
 if text!=new:
  dest=D/rel;dest.parent.mkdir(parents=True,exist_ok=True);dest.write_text(new,encoding='utf-8');audit.append({'file':rel,'kind':'display label / asset version only','before_sha256':hashlib.sha256(raw).hexdigest()})
# These files have behavior or title updates, not only substitution. Ensure baseline parity.
for rel in ['shell/auth.js','shell/router.js','shell/shell.js','shell/navigation.js','shell/module-pages.js','shell/module-pages-mobile.js','sw.js','index.html']:
 local_before=(R/'.codex-tmp/login-uni-baseline/unificado'/rel).read_text(encoding='utf-8')
 actual_before=(B/rel).read_text(encoding='utf-8')
 if rel=='index.html':
  actual_before=re.sub(r'<style>\.test-environment-bar\{position:relative;.*?</style>','',actual_before,flags=re.S)
  actual_before=actual_before.replace('<div class="test-environment-bar">AMBIENTE DE TESTE · dados isolados de homologação</div>','')
 assert local_before==actual_before,('source baseline differs from deployed homolog',rel)
for rel in ['shell/auth.js','shell/router.js','shell/shell.js','shell/navigation.js','shell/module-pages.js','shell/module-pages-mobile.js','sw.js','index.html','login.html','shell/login-uni.css','shell/login-uni.js','shell/aviso.json','shell/tokens.css','assets/img/unificado-pwa-icon.svg','VERSION']:
 text=(R/'unificado'/rel).read_text(encoding='utf-8')
 if rel in ['index.html','login.html']:
  marker='<style>.test-environment-bar{position:relative;z-index:9999;padding:6px 12px;background:#fff3cd;color:#664d03;text-align:center;font:600 12px sans-serif}body{padding-top:31px}</style>'
  text=text.replace('</head>',marker+'</head>').replace('<body>','<body><div class="test-environment-bar">AMBIENTE DE TESTE · dados isolados de homologação</div>')
 dest=D/rel;dest.parent.mkdir(parents=True,exist_ok=True);dest.write_text(text,encoding='utf-8')
for p in D.rglob('*'):
 if p.is_file():manifest[p.relative_to(D).as_posix()]=hashlib.sha256(p.read_bytes()).hexdigest()
assert json.loads((D/'shell/aviso.json').read_text())['ativo'] is False
(O/'release-manifest.json').write_text(json.dumps(manifest,indent=2))
(O/'release-label-audit.json').write_text(json.dumps(audit,indent=2))
with tarfile.open(O/'release.tgz','w:gz') as t:
 for rel in manifest:t.add(D/rel,arcname=rel)
print(json.dumps({'version':'1.4.27','static_files':len(manifest),'actual_homolog_baseline':True,'backends_changed':False,'notice_active':False}))
