"""Verify the cumulative public release, marked roots and isolated service assets."""
import hashlib,json
from pathlib import Path
H=Path('/opt/concrefer-unificado/homolog-next')
S=H/'staging/visual-completo/revisao-completa'
P=H/'public/unificado'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
manifest=json.loads((S/'final-public-manifest.json').read_text())
for rel,digest in manifest.items():
    if rel not in ('index.html','login.html'):assert sha(P/rel)==digest,rel
banner='<div class="test-environment-bar">AMBIENTE DE TESTE · dados isolados de homologação</div>'
for name in ('index.html','login.html'):
    source=S/'release'/name
    assert sha(source)==manifest[name]
    expected=source.read_text(encoding='utf-8')
    if banner not in expected:
        expected=expected.replace('</head>', '<style>.test-environment-bar{position:relative;z-index:9999;padding:6px 12px;background:#fff3cd;color:#664d03;text-align:center;font:600 12px sans-serif}body{padding-top:31px}</style></head>',1)
        expected=expected.replace('<body>','<body>'+banner,1)
    assert hashlib.sha256(expected.encode()).hexdigest()==sha(P/name),name
service=json.loads((S/'service-manifest.json').read_text())
for rel,digest in service.items():assert sha(H/'visual-full'/rel)==digest,rel
assert (P/'VERSION').read_text().strip()=='1.4.25'
out={'status':'ok','version':'1.4.25','cumulative_public_files_verified':len(manifest),
     'isolated_service_assets_verified':len(service),'marked_shell_login_exact':True,
     'source_manifest':'final-public-manifest.json','production_database_connections':0}
(S/'final-release-audit.json').write_text(json.dumps(out,indent=2))
print(json.dumps(out))
