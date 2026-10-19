"""Apply the Etiquetas Padrão 1/2 and SC 3 restriction to a staged copy.

Usage: python3 filtra-setores.py STAGE_DIR
STAGE_DIR contains api/pcp.py, public/etiquetas/index.html,
public/etiquetas-sc/index.html and public/static/js/etiquetas.js.
"""
from pathlib import Path
import re
import sys


root = Path(sys.argv[1]).resolve()


def replace_once(path, old, new):
    data = path.read_bytes()
    count = data.count(old)
    if count != 1:
        raise SystemExit(f'{path}: expected one {old!r}, found {count}')
    path.write_bytes(data.replace(old, new))


api = root / 'api/pcp.py'
replace_once(api,
             b'query = db.query(Programacao).filter(Programacao.data == data)',
             b'query = db.query(Programacao).filter(Programacao.data == data, Programacao.setor_id.in_((1, 2)))')

standard = root / 'public/etiquetas/index.html'
replace_once(standard, b'<option value="">Todos</option>',
             b'<option value="">Todos (setores 1 e 2)</option>')
data = standard.read_bytes()
for sector in (3, 4):
    pattern = rb'[ \t]*<option value="' + str(sector).encode() + rb'">Setor ' + str(sector).encode() + rb'</option>\r?\n'
    data, count = re.subn(pattern, b'', data)
    if count != 1:
        raise SystemExit(f'{standard}: expected one Setor {sector} option, found {count}')
standard.write_bytes(data)
data = standard.read_bytes()
version_pattern = rb'(/unificado/pcp/static/js/etiquetas\.js\?v=)[^"\r\n]+'
data, count = re.subn(version_pattern, rb'\g<1>0.6.8-setores', data)
if count != 1:
    raise SystemExit(f'{standard}: expected one etiquetas.js version, found {count}')
standard.write_bytes(data)

sc = root / 'public/etiquetas-sc/index.html'
if sc.read_bytes().count(b'<select id="f-setor" class="form-select form-select-sm" disabled><option value="3">Setor 3</option></select>') != 1:
    raise SystemExit(f'{sc}: SC selector is not fixed to Setor 3')

js = root / 'public/static/js/etiquetas.js'
content = js.read_bytes()
modern = b'return API.get(`/api/etiquetas-padrao/programacao?${qs}`);'
old = b"return (await Promise.all(['1', '2', '3', '4'].map(s => API.get(`/api/programacao?${buildQuery(s)}`)))).flat();"
if content.count(modern) == 1:
    replace_once(js, modern,
                 b'return (await API.get(`/api/etiquetas-padrao/programacao?${qs}`)).filter(row => [1, 2].includes(Number(row.setor_id)));')
elif content.count(old) == 1:
    replace_once(js, old,
                 b"return (await Promise.all(['1', '2'].map(s => API.get(`/api/programacao?${buildQuery(s)}`)))).flat();")
    replace_once(js,
                 b'if (setor) return API.get(`/api/programacao?${buildQuery(setor)}`);',
                 b"if (setor) return ['1', '2'].includes(setor) ? API.get(`/api/programacao?${buildQuery(setor)}`) : [];")
else:
    raise SystemExit(f'{js}: unknown standard-label loader')

print('Padrão: setores 1/2; SC: setor 3', root)
