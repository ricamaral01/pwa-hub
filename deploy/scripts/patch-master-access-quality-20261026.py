"""Apply the 2026-10-26 master access/menu fix to a copied release tree.

Input is a directory containing the current production files by basename.
The script checks every expected anchor so it cannot silently patch another release.
"""

from pathlib import Path
import re
import sys


root = Path(sys.argv[1])


def edit(name, changes):
    path = root / name
    data = path.read_text(encoding="utf-8")
    for before, after in changes:
        count = data.count(before)
        if count != 1:
            raise SystemExit(f"{name}: expected one anchor, found {count}: {before[:72]!r}")
        data = data.replace(before, after, 1)
    path.write_text(data, encoding="utf-8", newline="\n")


masters_old = "'user-ricardo', 'marcelo', 'alex'"
masters_new = "'user-ricardo', 'marcelo', 'alex', 'philippe'"
edit("screen_access.py", [
    ("MASTER_USER_IDS = frozenset({MASTER_USER_ID, 'marcelo', 'alex'})",
     "MASTER_USER_IDS = frozenset({MASTER_USER_ID, 'marcelo', 'alex', 'philippe'})"),
    ("if screen['id'] == 'usinasCartaTraco':\n        return user['id'] == MASTER_USER_ID",
     "if screen['id'] == 'usinasCartaTraco':\n        return user['id'] in MASTER_USER_IDS"),
    ("return [row['id'] for row in CATALOG\n"
     "                if (not row['id'].startswith('cronoanalise.') or user['id'] == MASTER_USER_ID)\n"
     "                and (row['id'] != 'usinasCartaTraco' or user['id'] == MASTER_USER_ID)]",
     "return [row['id'] for row in CATALOG]"),
])
edit("app.py", [
    ("def crono_actions(user_id):\n    if user_id == MASTER_USER_ID:",
     "def crono_actions(user_id):\n    if user_id in MASTER_USER_IDS:"),
])
edit("shell.js", [
    (f"const masterIds = new Set([{masters_old}]);",
     f"const masterIds = new Set([{masters_new}]);"),
    ("const APP_VERSION = '1.0.95';", "const APP_VERSION = '1.0.97';"),
])

menu_path = root / "menu.config.js"
menu = menu_path.read_text(encoding="utf-8")
quality = re.search(
    r"(  qualidade: \{.*?groups: \[\{ label: .*?\n.*?id:'qualidadeCadastros'[^\n]*\n"
    r"    \] \})(\]\n  \},\n  usinas:)", menu, re.S)
if not quality:
    raise SystemExit("menu.config.js: quality group anchor not found")
addition = ",\n      { label: 'Certificados', items: [\n" \
           "        { id:'labCertificados', label:'Certificados de qualidade', path:'/unificado/laboratorio/certificados-qualidade/' },\n" \
           "        { id:'labTests', label:'Certificados de ensaios', path:'/unificado/laboratorio/novo/postes?tab=historico' }\n" \
           "      ] }"
menu = menu[:quality.start(2)] + addition + menu[quality.start(2):]
menu = menu.replace(
    "        { id: 'tratativa', mono: 'TD', label: 'Tratativa Defeitos', path: '/index.html', screen: 'TRATATIVA_DEFEITOS' }",
    "        { id: 'tratativa', mono: 'TD', label: 'Tratativa Defeitos', path: '/index.html', screen: 'TRATATIVA_DEFEITOS' },\n"
    "        { id: 'fechamentoDiario', label: 'Fechamento diário', path: '/unificado/relatorios/fechamento-diario/' }",
    1)
menu = menu.replace(
    "      { items: [{ id:'labHelp', label:'Como funciona', path:'?view=help' }] }",
    "      { label: 'Carta de traço', items: [\n"
    "        { id:'labCartaTraco', label:'Carta de traço e MCC', path:'carta-traco/' }\n"
    "      ] },\n"
    "      { label: 'Administração', items: [\n"
    "        { id:'labUsuarios', label:'Usuários', path:'novo/postes?tab=usuarios' }\n"
    "      ] },\n"
    "      { items: [{ id:'labHelp', label:'Como funciona', path:'?view=help' }] }",
    1)
menu = menu.replace(
    "      : item.id === 'tvFormas'\n      ? new URL('tv/formas/', UNIFICADO_BASE).href",
    "      : item.id === 'tvFormas'\n      ? new URL('tv/formas/', UNIFICADO_BASE).href\n"
    "      : item.id === 'fechamentoDiario'\n      ? new URL('relatorios/fechamento-diario/', UNIFICADO_BASE).href",
    1)
for required in ("id: 'fechamentoDiario'", "id:'labCartaTraco'", "id:'labUsuarios'", "item.id === 'fechamentoDiario'"):
    if required not in menu:
        raise SystemExit(f"menu.config.js: missing {required}")
menu_path.write_text(menu, encoding="utf-8", newline="\n")

menu_js = root / "menu.js"
data = menu_js.read_text(encoding="utf-8")
quality_marker = '  ] },\n  { id: "laboratorio", label:'
if data.count(quality_marker) != 1:
    raise SystemExit("menu.js: quality section anchor not unique")
data = data.replace(quality_marker,
    '    ,xe("CERTIFICADOS", [\n'
    '      ["labCertificados", "Certificados de qualidade", "laboratorio/certificados-qualidade/", "doc"],\n'
    '      ["labTests", "Certificados de ensaios", "laboratorio/novo/postes?tab=historico", "doc"]\n'
    '    ])\n' + quality_marker, 1)
data = data.replace(
    '      ["tratativa", "Tratativa Defeitos", Se("TRATATIVA_DEFEITOS"), "alert"]',
    '      ["tratativa", "Tratativa Defeitos", Se("TRATATIVA_DEFEITOS"), "alert"],\n'
    '      ["fechamentoDiario", "Fechamento diário", "relatorios/fechamento-diario/", "doc"]', 1)
lab_marker = '  { id: "laboratorio", label:'
lab_at = data.index(lab_marker)
cura = data.index('    xe("CURA', lab_at)
lab_add = '''    xe("CORPOS DE PROVA", [
      ["labCecEtiquetas", "Etiquetas QR", "laboratorio/cec/etiquetas/", "doc"],
      ["labCecLeitura", "Leitura de CP", "laboratorio/cec/leitura/", "flask"],
      ["labCecResultados", "Resultados dos corpos de prova", "laboratorio/cec/analise/resultado-cp.html", "map"]
    ]),
    xe("CONTROLE ESTATÍSTICO", [
      ["labCec", "Visão geral", "laboratorio/cec/", "map"],
      ["labCecAnalise", "Análise estatística", "laboratorio/cec/analise/", "map"],
      ["labCecRelatorio", "Relatório CEC", "laboratorio/cec/analise/relatorio.html", "doc"]
    ]),
    xe("DOSAGEM", [
      ["labDosagem", "Visão geral", "laboratorio/dosagem/", "flask"],
      ["labDosagemEmpacotamento", "Empacotamento", "laboratorio/dosagem/#/dosagem/empacotamento", "flask"],
      ["labDosagemVolume", "Volume", "laboratorio/dosagem/#/dosagem/volume", "flask"],
      ["labDosagemComparacao", "Comparação dos métodos", "laboratorio/dosagem/#/comparacao-metodos", "sliders"],
      ["labDosagemTracos", "Traços", "laboratorio/dosagem/#/tracos", "doc"],
      ["labDosagemMateriais", "Materiais", "laboratorio/dosagem/#/materiais", "database"],
      ["labDosagemFornecedores", "Fornecedores", "laboratorio/dosagem/#/fornecedores", "database"],
      ["labDosagemEnsaios", "Ensaios", "laboratorio/dosagem/#/ensaios", "flask"],
      ["labDosagemFerramentas", "Ferramentas", "laboratorio/dosagem/#/ferramentas", "sliders"],
      ["labDosagemCustos", "Custos", "laboratorio/dosagem/#/custos", "doc"],
      ["labDosagemReferencia", "Referência", "laboratorio/dosagem/#/referencia", "help"],
      ["labDosagemProducao", "Produção", "laboratorio/dosagem/#/producao-r1", "factory"],
      ["labDosagemImportacao", "Importação", "laboratorio/dosagem/#/importacao-r1", "database"],
      ["labDosagemConfig", "Configurações", "laboratorio/dosagem/#/config", "sliders"]
    ]),
    xe("CONCRETO FRESCO", [
      ["labSlump", "Registro de slump / flow", "laboratorio/slump", "thermometer"]
    ]),
    xe("USINA DE CAMPINAS", [
      ["labUsinasRelatorios", "Relatórios e custos", "laboratorio/usinas-relatorios/", "doc"]
    ]),
'''
data = data[:cura] + lab_add + data[cura:]
data = data.replace(
    '    xe("CRONO',
    '    xe("CARTA DE TRAÇO", [\n'
    '      ["labCartaTraco", "Carta de traço e MCC", "laboratorio/carta-traco/", "doc"]\n'
    '    ]),\n'
    '    xe("ADMINISTRAÇÃO", [\n'
    '      ["labUsuarios", "Usuários", "laboratorio/novo/postes?tab=usuarios", "users"]\n'
    '    ]),\n'
    '    xe("CRONO', 1)
for required in ('["fechamentoDiario"', '["labCartaTraco"', '["labUsuarios"'):
    if required not in data:
        raise SystemExit(f"menu.js: missing {required}")
menu_js.write_text(data, encoding="utf-8", newline="\n")

edit("router.js", [
    ("path === 'laboratorio/certificados-qualidade/' || path === 'laboratorio/usinas-relatorios/'",
     "path === 'laboratorio/certificados-qualidade/' || path === 'laboratorio/carta-traco/' || path === 'laboratorio/usinas-relatorios/'"),
])

users = root / "users-unificado.js"
data = users.read_text(encoding="utf-8")
if data.count(masters_old) != 2:
    raise SystemExit("users-unificado.js: expected two master lists")
users.write_text(data.replace(masters_old, masters_new), encoding="utf-8", newline="\n")

for name in ("sw.js", "index.html", "VERSION"):
    path = root / name
    data = path.read_text(encoding="utf-8")
    if "1.0.95" not in data:
        raise SystemExit(f"{name}: old version missing")
    path.write_text(data.replace("1.0.95", "1.0.97"), encoding="utf-8", newline="\n")
