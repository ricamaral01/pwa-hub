"""Prepare the combined static release from the actual homolog baseline."""
import hashlib,json,re,tarfile
from pathlib import Path
R=Path(__file__).resolve().parents[1];O=R/'docs/revisao-visual-unificado/homolog/modulos-colunas-20261120';B=R/'.codex-tmp/modulos-colunas-baseline/unificado';D=R/'.codex-tmp/modulos-colunas-release'
files=[p.relative_to(B).as_posix() for p in B.rglob('*') if p.is_file()]+['shell/module-columns.css'];manifest={};before={};exceptions=[]
assert (R/'unificado/VERSION').read_text().strip()=='1.4.30'
geometry=json.loads((O/'candidate-geometry.json').read_text(encoding='utf-8'));assert len(geometry)==36
proof=json.loads((O/'candidate-permissions.json').read_text(encoding='utf-8'));assert proof['ok'] and proof['module_cases']==72 and proof['permission_leaks']==0
assert 'pass 59' in (O/'search-compatibility.txt').read_text(encoding='utf-8')
assert (R/'unificado/shell/module-pages-mobile.js').read_bytes()==(B/'shell/module-pages-mobile.js').read_bytes(),'phone implementation must remain unchanged'
assert json.loads((R/'unificado/shell/busca-sinonimos.json').read_text(encoding='utf-8'))==json.loads((B/'shell/busca-sinonimos.json').read_text(encoding='utf-8'))
with tarfile.open(R/'.codex-tmp/modulos-colunas-public-before.tgz') as archive:
 for rel in files:
  raw=(R/'unificado'/rel).read_bytes()
  if (B/rel).exists():
   actual=archive.extractfile(rel).read();old=actual.decode('utf-8').replace('\r\n','\n');local=(B/rel).read_text(encoding='utf-8')
   if rel.endswith('.html'):old=re.sub(r'<style>\.test-environment-bar\{position:relative;.*?</style>','',old,flags=re.S).replace('<div class="test-environment-bar">AMBIENTE DE TESTE · dados isolados de homologação</div>','')
   if rel=='shell/menu.config.js' and old.splitlines()!=local.splitlines():
    pattern=r"(id: 'indicadorGeralProducao'.*?label: ')([^']+)(')";remote_label=re.search(pattern,old).group(2);local_label=re.search(pattern,local).group(2)
    assert old.replace(remote_label,local_label,1).splitlines()==local.splitlines(),rel
    raw=raw.decode('utf-8').replace(local_label,remote_label,1).encode('utf-8');exceptions.append({'file':rel,'preserved_homolog_label':remote_label})
   else:assert old.splitlines()==local.splitlines(),('unexpected pre-existing divergence',rel)
   before[rel]=hashlib.sha256(actual).hexdigest()
  if rel in ['index.html','login.html']:
   s=raw.decode('utf-8');style='<style>.test-environment-bar{position:relative;z-index:9999;padding:6px 12px;background:#fff3cd;color:#664d03;text-align:center;font:600 12px sans-serif}body{padding-top:31px}</style>';raw=s.replace('</head>',style+'</head>').replace('<body>','<body><div class="test-environment-bar">AMBIENTE DE TESTE · dados isolados de homologação</div>').encode('utf-8')
  dest=D/rel;dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(raw);manifest[rel]=hashlib.sha256(raw).hexdigest()
for name,data in [('release-manifest.json',manifest),('baseline-hashes.json',before),('source-parity-exceptions.json',exceptions)]:
 (O/name).write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
with tarfile.open(O/'release.tgz','w:gz') as archive:
 for rel in files:archive.add(D/rel,arcname=rel)
print(json.dumps({'version':'1.4.30','combined_search_commit':'964e4281','static_files':len(files)}))
