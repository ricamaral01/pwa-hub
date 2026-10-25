"""Aplica somente os acréscimos S0–S1 à casca ativa de :18446.

Entrada: cópia lida da homologação. Saída: arquivos temporários a publicar.
Cada âncora é verificada; uma divergência aborta sem escrever na VPS.
"""
from __future__ import annotations
import json
import re
import sys
from pathlib import Path

remote = Path(sys.argv[1]).resolve()
out = Path(sys.argv[2]).resolve()
repo = Path(__file__).resolve().parents[3]
out.mkdir(parents=True, exist_ok=True)

def source(path):
    return (repo / path).read_text(encoding="utf-8")

def read(name):
    return (remote / name).read_text(encoding="utf-8")

def save(name, data):
    (out / name).write_text(data, encoding="utf-8", newline="\n")

def one(data, old, new):
    count = data.count(old)
    if count != 1:
        raise RuntimeError(f"Âncora esperada uma vez; ocorrências={count}: {old[:90]!r}")
    return data.replace(old, new, 1)

# Gateway: apenas as chamadas da flag, corpo do endpoint e extensão Suprimentos.
app = read("app.py")
app = one(app,
    "    return allowed_screens(user, planning_role, overrides, lab_users), planning_role",
    "    allowed = allowed_screens(user, planning_role, overrides, lab_users)\n"
    "    if any(SCREENS_BY_ID[item]['module'] == 'suprimentos' for item in allowed) and not supply_flags().get('S1'):\n"
    "        allowed = [item for item in allowed if SCREENS_BY_ID[item]['module'] != 'suprimentos']\n"
    "    return allowed, planning_role")
app = one(app,
    "    response = jsonify(ok=True, screens=allowed, preview_modules=preview_modules)",
    "    suprimentos_enabled = any(SCREENS_BY_ID[item]['module'] == 'suprimentos' for item in allowed)\n"
    "    response = jsonify(ok=True, screens=allowed, preview_modules=preview_modules,\n"
    "                       suprimentos_flags=supply_flags() if suprimentos_enabled else {},\n"
    "                       suprimentos_enabled=suprimentos_enabled)")
app = one(app,
    '    response.delete_cookie(LAB_COOKIE_NAME, path="/unificado/laboratorio/")\n    return response',
    '    response.delete_cookie(LAB_COOKIE_NAME, path="/unificado/laboratorio/")\n'
    '    response.delete_cookie(SUPRIMENTOS_COOKIE_NAME, path="/api/suprimentos/")\n'
    '    response.delete_cookie(SUPRIMENTOS_COOKIE_NAME, path="/unificado/suprimentos/")\n'
    '    response.delete_cookie(SUPRIMENTOS_REFRESH_COOKIE_NAME, path="/unificado/suprimentos/")\n'
    '    return response')
local_app = source("unificado/mapa/api/app.py")
extension = local_app.split("# Suprimentos: extensão isolada do gateway.", 1)[1].split("\nfrom usina_integration import", 1)[0]
app += "\n\n# Suprimentos: extensão isolada do gateway." + extension + "\n"
save("app.py", app)

# Catálogo: acrescenta cinco telas sem reordenar ou excluir as já publicadas.
catalog = json.loads(read("screen_catalog.json"))
new_screens = [row for row in json.loads(source("unificado/mapa/api/screen_catalog.json")) if row["module"] == "suprimentos"]
existing_ids = {row["id"] for row in catalog}
if any(row["id"] in existing_ids for row in new_screens):
    raise RuntimeError("ID de tela de Suprimentos já está no catálogo remoto")
catalog.extend(new_screens)
save("screen_catalog.json", json.dumps(catalog,ensure_ascii=False,indent=2)+"\n")

access = read("screen_access.py")
access = one(access, "    if module == 'qualidade':\n        return bool(user.get('id'))",
             "    if module == 'qualidade':\n        return bool(user.get('id'))\n"
             "    if module == 'suprimentos':\n        return bool(user.get('id'))")
access = one(access, "row['module'] not in {'laboratorio', 'qualidade'}",
             "row['module'] not in {'laboratorio', 'qualidade', 'suprimentos'}")
access = one(access, "    if path.startswith('/unificado/pcp/api/usuarios'):",
    "    if path.startswith('/unificado/suprimentos/'):\n"
    "        if path.startswith('/unificado/suprimentos/pwa/') or path.startswith('/unificado/suprimentos/solicitacao/'):\n"
    "            return BY_ID.get('suprimentosSolicitacoes')\n"
    "        return next((row for row in CATALOG if row['module'] == 'suprimentos'\n"
    "                     and row['path'].rstrip('/') == path.rstrip('/')), None)\n"
    "    if path.startswith('/unificado/pcp/api/usuarios'):")
access = one(access, "'qualidade':'/unificado/qualidade/'}[candidate['module']]",
             "'qualidade':'/unificado/qualidade/',\n                    'suprimentos':'/unificado/suprimentos/'}[candidate['module']]")
save("screen_access.py", access)

menu = read("menu.config.js")
menu = one(menu, "const USINAS_BASE = new URL('usinas/', UNIFICADO_BASE);",
           "const USINAS_BASE = new URL('usinas/', UNIFICADO_BASE);\nconst SUPRIMENTOS_BASE = new URL('suprimentos/', UNIFICADO_BASE);")
local_menu = source("unificado/shell/menu.config.js")
block = local_menu.split("  suprimentos: {",1)[1].split("\n};\n\nconst MENU_ITEMS",1)[0]
menu = one(menu, "  }\n};\n\nconst MENU_ITEMS",
           "  },\n  suprimentos: {"+block+"\n};\n\nconst MENU_ITEMS")
menu = one(menu, "    url: module === 'usinas'\n      ? new URL(item.path, USINAS_BASE).href",
           "    url: module === 'usinas'\n      ? new URL(item.path, USINAS_BASE).href\n"
           "      : module === 'suprimentos'\n      ? new URL(item.path, SUPRIMENTOS_BASE).href")
save("menu.config.js", menu)

shell = read("shell.js")
shell = one(shell,"let hasGedAccess = false;", "let hasGedAccess = false;\nlet suprimentosFlags = {};")
shell = one(shell,
    "module === 'planejamento' ? hasPcp : module === 'producao' || module === 'usinas' ? hasMapa : hasLab) && moduleHasScreens(module);",
    "module === 'planejamento' ? hasPcp : module === 'producao' || module === 'usinas' ? hasMapa :\n"
    "   module === 'suprimentos' ? hasMapa && suprimentosFlags.S1 === true : hasLab) &&\n"
    "   (module !== 'suprimentos' || suprimentosFlags.S1 === true) && moduleHasScreens(module);")
shell = one(shell,"  previewModules = result.preview_modules === true;\n  hasGedAccess =",
            "  previewModules = result.preview_modules === true;\n  suprimentosFlags = result.suprimentos_flags || {};\n  hasGedAccess =")
shell = one(shell,"  const route = MENU_ITEMS[item.id] || item;\n  if (route.dosagemAdmin",
            "  const route = MENU_ITEMS[item.id] || item;\n"
            "  if (route.module === 'suprimentos' && (!suprimentosFlags.S1 || route.futurePhase && !suprimentosFlags[route.futurePhase])) return false;\n"
            "  if (route.dosagemAdmin")
shell = one(shell,"  if (route.module === 'usinas') return hasMapa;",
            "  if (route.module === 'usinas') return hasMapa;\n  if (route.module === 'suprimentos') return hasMapa;")
if shell.count("key === 'usinas' ? 'US' : 'LB'") != 2:
    raise RuntimeError("As duas âncoras do símbolo de módulo mudaram")
shell = shell.replace("key === 'usinas' ? 'US' : 'LB'",
                      "key === 'usinas' ? 'US' : key === 'suprimentos' ? 'SP' : 'LB'")
shell = one(shell,"key === 'usinas' ? 'Usinas' : 'Lab.'",
            "key === 'usinas' ? 'Usinas' : key === 'suprimentos' ? 'Supri.' : 'Lab.'")
home_card = '''  if (canAccessModule('suprimentos')) {
    const link = document.createElement('a');
    link.className = 'opening-module';
    link.dataset.module = 'suprimentos';
    link.href = new URL('?view=suprimentos/painel/', UNIFICADO_BASE).href;
    link.innerHTML = `<span class="opening-module-copy"><span class="opening-module-number">07 / MÓDULO</span><span><strong class="opening-module-title">Suprimentos</strong><small>Solicitações e almoxarifado geral</small></span></span>${ICONS.arrow}`;
    target.append(link);
  }
'''
shell = one(shell,"  for (const [module, number, title, description, url, icon] of [",
            home_card+"  for (const [module, number, title, description, url, icon] of [")
shell = one(shell,"const APP_VERSION = '1.0.58';", "const APP_VERSION = '1.0.59';")
save("shell.js",shell)

router = read("router.js")
router = one(router,"    return null;\n  }\n\n  function screenFor",
    "    if (/^suprimentos\\/(?:painel|solicitacoes|solicitacao|nova|fornecedores|cadastros)\\/$/.test(path))\n"
    "      return {url, module:'suprimentos', path};\n    return null;\n  }\n\n  function screenFor")
router = one(router,"    if (route.module === 'qualidade' && route.path.startsWith('qualidade/nc/')) return 'qualidadeTratativa';",
    "    if (route.module === 'qualidade' && route.path.startsWith('qualidade/nc/')) return 'qualidadeTratativa';\n"
    "    if (route.module === 'suprimentos' && route.path === 'suprimentos/solicitacao/') return 'suprimentosSolicitacoes';")
router = one(router,"    if (route.module === 'qualidade' && !hasMapa) return;",
    "    if (route.module === 'qualidade' && !hasMapa) return;\n    if (route.module === 'suprimentos' && !hasMapa) return;")
router = one(router,"      if (!response.ok) { if (ticket === pending) deny(); return; }\n    }\n    if (ticket !== pending) return;",
    "      if (!response.ok) { if (ticket === pending) deny(); return; }\n    }\n"
    "    if (route.module === 'suprimentos') {\n"
    "      const response = await fetch(root + 'mapa/api/unified/suprimentos-bootstrap', {\n"
    "        method:'POST', credentials:'same-origin', cache:'no-store'\n"
    "      });\n      if (!response.ok) { if (ticket === pending) deny(); return; }\n"
    "    }\n    if (ticket !== pending) return;")
save("router.js",router)

users = read("users-unificado.js")
users = one(users,"['qualidade', 'Qualidade']", "['qualidade', 'Qualidade'], ['suprimentos', 'Suprimentos']")
save("users-unificado.js",users)

css = read("shared-menu.css")
css += "\n" + "\n".join((
  'body.unificado-shared-menu #sidebar .module-button[data-short="SP"] .shared-module-dot{background:#2DD4BF}',
  'body.unificado-shared-menu #sidebar .module-button[data-module="suprimentos"].is-active{background:#2DD4BF;color:#0B1730}',
  'body.unificado-shared-menu #sidebar[data-module="suprimentos"] .group-title{color:#2DD4BF}',
  'body.unificado-shared-menu #sidebar[data-module="suprimentos"] .nav-link.is-active .mono{background:#2DD4BF;color:#0B1730}',
)) + "\n"
save("shared-menu.css",css)

# O bundle React ativo tem identificadores minificados próprios. Preservá-lo e
# acrescentar somente cor e definição de módulo extraídas da fonte compilada.
bundle = read("menu.js")
bundle = one(bundle,'  ged: "#9B7BF0"\n}, ji =', '  ged: "#9B7BF0",\n  suprimentos: "#2DD4BF"\n}, ji =')
compiled = source("unificado/shell/modelo-a/menu.js")
supply_bundle = compiled.split('  { id: "suprimentos", label: "Suprimentos"',1)[1].split('\n], qf = [',1)[0]
supply_bundle = ('  { id: "suprimentos", label: "Suprimentos"'+supply_bundle).replace('cn.suprimentos','Dn.suprimentos').replace('pe(','xe(')
bundle = one(bundle,"  ] }\n], qf = [", "  ] },\n"+supply_bundle+"\n], qf = [")
save("menu.js",bundle)

index = read("index.html")
index = index.replace("?v=1.0.58", "?v=1.0.59")
index = one(index,'shell/shared-menu.css?v=1.0.36-usinas','shell/shared-menu.css?v=1.0.59-suprimentos')
save("index.html",index)
sw = one(read("sw.js"),"concrefer-unificado-shell-v1.0.58","concrefer-unificado-shell-v1.0.59")
save("sw.js",sw)
save("VERSION","1.0.59\n")

print("overlay preparado: " + ", ".join(sorted(p.name for p in out.iterdir())))
