"""Add Campinas read reports to the published Laboratory without replacing other releases."""

from pathlib import Path
import json
import shutil

BASE = Path('/opt/concrefer-unificado')
PUBLIC = BASE / 'public/unificado'
API = BASE / 'mapa-api'
LAB = BASE / 'laboratorio/service/server'
SUFFIX = '.bak-lab-usinas-reports-20261025'


def change(path, old, new):
    before = path.read_text(encoding='utf-8')
    if before.count(old) != 1:
        raise RuntimeError(f'Expected one anchor in {path}: {old[:72]!r}')
    after = before.replace(old, new, 1)
    backup = Path(str(path) + SUFFIX)
    if backup.exists():
        raise RuntimeError(f'Backup already exists: {backup}')
    shutil.copy2(path, backup)
    path.write_text(after, encoding='utf-8')
    print(path)


def replace_version(path, old, new):
    before = path.read_text(encoding='utf-8')
    if old not in before:
        raise RuntimeError(f'Missing version anchor in {path}: {old}')
    backup = Path(str(path) + SUFFIX)
    if not backup.exists():
        shutil.copy2(path, backup)
    path.write_text(before.replace(old, new), encoding='utf-8')
    print(path)


change(API / 'usinas_reporting.py',
       '"usinasInicio" not in screens',
       'not ({"usinasInicio", "labUsinasRelatorios"} & set(screens))')
change(API / 'screen_access.py',
       "    if path.startswith('/unificado/laboratorio/dosagem/'):\n",
       "    if path.startswith('/unificado/laboratorio/usinas-relatorios/'):\n"
       "        return BY_ID.get('labUsinasRelatorios')\n"
       "    if path.startswith('/unificado/laboratorio/dosagem/'):\n")
catalog = API / 'screen_catalog.json'
rows = json.loads(catalog.read_text(encoding='utf-8'))
if any(row['id'] == 'labUsinasRelatorios' for row in rows):
    raise RuntimeError('Catalog entry already exists')
before = catalog.read_text(encoding='utf-8')
backup = Path(str(catalog) + SUFFIX)
if backup.exists():
    raise RuntimeError(f'Backup already exists: {backup}')
shutil.copy2(catalog, backup)
entry = {'id': 'labUsinasRelatorios', 'module': 'laboratorio',
         'label': 'Relatórios e custos de Campinas',
         'path': '/unificado/laboratorio/usinas-relatorios/',
         'query': '', 'screen': None, 'require': None}
catalog.write_text(before.rstrip()[:-1].rstrip() + ',\n  ' +
                   json.dumps(entry, ensure_ascii=False, separators=(',', ':')) + '\n]\n',
                   encoding='utf-8')
print(catalog)
change(PUBLIC / 'shell/menu.config.js',
       "      { label: 'Cura térmica', items: [\n",
       "      { label: 'Usina de Campinas', items: [\n"
       "        { id:'labUsinasRelatorios', label:'Relatórios e custos', path:'usinas-relatorios/' }\n"
       "      ] },\n      { label: 'Cura térmica', items: [\n")
change(PUBLIC / 'shell/modelo-a/menu.js',
       '    xe("CURA TÉRMICA", [\n',
       '    xe("USINA DE CAMPINAS", [\n'
       '      ["labUsinasRelatorios", "Relatórios e custos", "laboratorio/usinas-relatorios/", "doc"]\n'
       '    ]),\n    xe("CURA TÉRMICA", [\n')
change(PUBLIC / 'shell/router.js',
       "path === 'laboratorio/dosagem/' ||",
       "path === 'laboratorio/usinas-relatorios/' || path === 'laboratorio/dosagem/' ||")
change(LAB / 'app.py',
       "    @app.get('/postes')\n",
       "    @app.get('/usinas-relatorios/')\n"
       "    def usinas_relatorios_page():\n"
       "        return FileResponse(ROOT / 'server' / 'static' / 'usinas-relatorios' / 'index.html', media_type='text/html; charset=utf-8', headers={'Cache-Control': 'no-store'})\n\n"
       "    @app.get('/usinas-relatorios/{asset}')\n"
       "    def usinas_relatorios_asset(asset: str):\n"
       "        if asset not in {'native-areas.js', 'native-areas.css'}:\n"
       "            raise HTTPException(404)\n"
       "        return FileResponse(ROOT / 'server' / 'static' / 'usinas-relatorios' / asset)\n\n"
       "    @app.get('/postes')\n")
replace_version(PUBLIC / 'index.html', '1.0.46-pederneiras', '1.0.49-lab-reports')
replace_version(PUBLIC / 'shell/modelo-a-loader.js', '1.0.46-pederneiras', '1.0.49-lab-reports')
replace_version(PUBLIC / 'sw.js', '1.0.46-pederneiras', '1.0.49-lab-reports')
replace_version(PUBLIC / 'sw.js', "const CACHE = 'concrefer-unificado-shell-v1.0.48'", "const CACHE = 'concrefer-unificado-shell-v1.0.49'")
change(PUBLIC / 'usinas/index.html', 'native-areas.js?v=3', 'native-areas.js?v=4')
