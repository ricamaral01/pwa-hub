"""Patch only the unified site's API locations; keep the official apps untouched."""
from pathlib import Path
import sys

source = Path(sys.argv[1])
target = Path(sys.argv[2])
text = source.read_text(encoding='utf-8')
include = '    include /etc/nginx/snippets/laboratorio-unificado.conf;'
assert text.count(include) == 1
text = text.replace(include, include + '\n    include /etc/nginx/snippets/unificado-screen-access.conf;', 1)
for location in (
    'location = /unificado/pcp/api/usuarios {',
    'location ^~ /unificado/pcp/api/usuarios/ {',
    'location ^~ /unificado/pcp/api/ {',
):
    marker = '    ' + location
    assert text.count(marker) == 1
    text = text.replace(marker, marker + '\n        auth_request /unificado/screen-authorize;'
                        '\n        error_page 401 403 = @unificado_api_denied;', 1)
target.write_text(text, encoding='utf-8', newline='\n')
