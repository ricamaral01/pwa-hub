"""Mark the isolated test copy after staging the unified shell files."""
from pathlib import Path

root = Path('/opt/concrefer-unificado/homolog/public/unificado')
banner = '<div class="test-environment-bar">AMBIENTE DE TESTE · dados do Laboratório isolados</div>'
for name in ('index.html', 'login.html'):
    path = root / name
    content = path.read_text(encoding='utf-8')
    if banner not in content:
        content = content.replace('</head>', '<style>body{padding-top:31px}</style></head>', 1)
        content = content.replace('<body>', '<body>' + banner, 1)
        path.write_text(content, encoding='utf-8')
print('Homolog banner present on the shell and login pages.')
