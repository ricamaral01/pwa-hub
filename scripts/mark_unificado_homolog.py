"""Mark the isolated test copy after staging the unified shell files."""
from pathlib import Path
import argparse

parser=argparse.ArgumentParser()
parser.add_argument('--root',default='/opt/concrefer-unificado/homolog-next/public/unificado')
root=Path(parser.parse_args().root).resolve()
assert root in {Path('/opt/concrefer-unificado/homolog/public/unificado'),Path('/opt/concrefer-unificado/homolog-next/public/unificado')},'Homologation paths only'
banner = '<div class="test-environment-bar">AMBIENTE DE TESTE · dados isolados de homologação</div>'
for name in ('index.html', 'login.html'):
    path = root / name
    content = path.read_text(encoding='utf-8')
    if banner not in content:
        content = content.replace('</head>', '<style>.test-environment-bar{position:relative;z-index:9999;padding:6px 12px;background:#fff3cd;color:#664d03;text-align:center;font:600 12px sans-serif}body{padding-top:31px}</style></head>', 1)
        content = content.replace('<body>', '<body>' + banner, 1)
        path.write_text(content, encoding='utf-8')
print('Homolog banner present on the shell and login pages.')
