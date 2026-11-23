"""Build a small static release; actual current homolog sources must match baseline."""
import hashlib,json,re,tarfile
from pathlib import Path
R=Path(__file__).resolve().parents[1];O=R/'docs/revisao-visual-unificado/homolog/busca-20261120';B=R/'.codex-tmp/busca-baseline'
files=['index.html','login.html','VERSION','sw.js','shell/busca.js','shell/busca.css','shell/busca-sinonimos.json','shell/shell.js','shell/menu.config.js','shell/module-pages.js','shell/module-pages-mobile.js','shell/navigation.js','shell/modelo-a/menu.js','shell/modelo-a/menu.css','logistica/logistica-native.js']
baseline={};overrides={};exceptions=[]
with tarfile.open(R/'.codex-tmp/busca-public-before.tgz') as archive:
 for rel in files:
  saved=B/'unificado'/rel
  if not saved.exists():continue
  member=archive.getmember(rel);raw=archive.extractfile(member).read();before=raw.decode('utf-8').replace('\r\n','\n')
  if rel in ['index.html','login.html']:
   before=re.sub(r'<style>\.test-environment-bar\{position:relative;.*?</style>','',before,flags=re.S).replace('<div class="test-environment-bar">AMBIENTE DE TESTE · dados isolados de homologação</div>','')
  local_before=saved.read_text(encoding='utf-8')
  if before!=local_before and rel=='shell/menu.config.js':
   pattern=r"(id: 'indicadorGeralProducao'.*?label: ')([^']+)(')"
   remote_label=re.search(pattern,before).group(2);local_label=re.search(pattern,local_before).group(2)
   assert before.replace(remote_label,local_label,1).splitlines()==local_before.splitlines(),('unexpected catalogue divergence',rel)
   current=(R/'unificado'/rel).read_text(encoding='utf-8');overrides[rel]=current.replace(local_label,remote_label,1)
   exceptions.append({'file':rel,'reason':'pre-existing local/display-label divergence; keep the actual homolog label while adding only the environment flag','local_label':local_label,'homolog_label_preserved':remote_label})
  else:assert before.splitlines()==local_before.splitlines(),('homolog differs from starting worktree',rel)
  baseline[rel]=hashlib.sha256(raw).hexdigest()
manifest={};D=R/'.codex-tmp/busca-release'
for rel in files:
 source=R/'unificado'/rel;raw=overrides[rel].encode('utf-8') if rel in overrides else source.read_bytes()
 if rel in ['index.html','login.html']:
  text=source.read_text(encoding='utf-8');style='<style>.test-environment-bar{position:relative;z-index:9999;padding:6px 12px;background:#fff3cd;color:#664d03;text-align:center;font:600 12px sans-serif}body{padding-top:31px}</style>';raw=text.replace('</head>',style+'</head>').replace('<body>','<body><div class="test-environment-bar">AMBIENTE DE TESTE · dados isolados de homologação</div>').encode('utf-8')
 dest=D/rel;dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(raw);manifest[rel]=hashlib.sha256(raw).hexdigest()
assert json.loads((O/'approval.json').read_text(encoding='utf-8'))['approved']
assert (O/'browser-results.json').exists(),'candidate browser proof required before publication'
(O/'release-manifest.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8');(O/'baseline-hashes.json').write_text(json.dumps(baseline,indent=2),encoding='utf-8')
(O/'source-parity-exceptions.json').write_text(json.dumps(exceptions,ensure_ascii=False,indent=2),encoding='utf-8')
with tarfile.open(O/'release.tgz','w:gz') as archive:
 for rel in files:archive.add(D/rel,arcname=rel)
print(json.dumps({'version':'1.4.29','static_files':len(files),'baseline_equal':True,'approval_received':True}))
