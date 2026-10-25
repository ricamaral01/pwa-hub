"""Apply only the Modelo A integration to a copy of the live 1.0.11 shell.

Input files must be a fresh read of production. Assertions deliberately stop the
release if that baseline changes. The approved React/CSS bundle is copied as is.
"""

from pathlib import Path
import shutil
import sys


ROOT = Path(__file__).resolve().parents[2]
BASE = Path(sys.argv[1]).resolve()
OUT = Path(sys.argv[2]).resolve()


def replace_once(data: str, old: str, new: str, label: str) -> str:
    count = data.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected one anchor, found {count}")
    return data.replace(old, new, 1)


if (BASE / "VERSION").read_text(encoding="utf-8").strip() != "1.0.11":
    raise SystemExit("Unexpected production shell version")
shutil.copytree(BASE, OUT, dirs_exist_ok=True)

candidate = (ROOT / "unificado/shell/shell.js").read_text(encoding="utf-8")
bridge_start = candidate.index("window.UnificadoSidebarModelA = Object.freeze({")
bridge_end = candidate.index("document.querySelector('.user-pill strong')", bridge_start)
bridge = candidate[bridge_start:bridge_end]
bridge = replace_once(bridge, "  snapshot: () => {\n", "  snapshot: () => {\n    const hasGedAccess = previewModules && hasMapa;\n", "GED bridge")

shell_file = OUT / "shell/shell.js"
shell = shell_file.read_text(encoding="utf-8")
shell = replace_once(shell,
    "document.body.classList.toggle('unificado-shared-menu', sharedMenuAllowed());",
    "const modelASidebarAllowed = () => sharedMenuAllowed();\n"
    "document.body.classList.toggle('unificado-model-a', modelASidebarAllowed());\n"
    "document.body.classList.toggle('unificado-shared-menu', sharedMenuAllowed());", "mode")
shell = replace_once(shell, "const APP_VERSION = '1.0.11';", "const APP_VERSION = '1.0.13';", "version")
shell = replace_once(shell, "  button.disabled = true;\n  button.textContent = 'Atualizando…';",
    "  const label = button.querySelector('.sb-label') || button;\n"
    "  const originalLabel = label.textContent;\n"
    "  button.disabled = true;\n  label.textContent = 'Atualizando…';", "update button")
shell = replace_once(shell, "    button.textContent = 'Falha ao atualizar';",
    "    label.textContent = 'Falha ao atualizar';", "update failure")
shell = replace_once(shell,
    "    setTimeout(() => { button.textContent = '↻ Atualizar aplicativo'; button.disabled = false; }, 4000);",
    "    setTimeout(() => { label.textContent = originalLabel; button.disabled = false; }, 4000);", "update reset")
shell = replace_once(shell, "function renderSidebar() {\n  sidebar.dataset.module = currentModule;",
    "function renderSidebar() {\n"
    "  document.body.classList.toggle('unificado-model-a', modelASidebarAllowed());\n"
    "  if (modelASidebarAllowed()) {\n"
    "    document.querySelector('.shared-menu-scrim')?.remove();\n"
    "    dispatchEvent(new Event('unificado-sidebar-model-a-update'));\n"
    "    return;\n"
    "  }\n"
    "  sidebar.dataset.module = currentModule;", "sidebar renderer")
shell = replace_once(shell, "const displayUser = hasPcp ? pcpUser : mapaUser;\n",
    "const displayUser = hasPcp ? pcpUser : mapaUser;\n" + bridge, "bridge mount")
shell_file.write_text(shell, encoding="utf-8", newline="\n")

router_file = OUT / "shell/router.js"
router = router_file.read_text(encoding="utf-8")
router = replace_once(router, "  function syncGedMenu(route = activeGed) {",
    "  function updateModelAPath(view = '') {\n"
    "    window.UnificadoSidebarActivePath = root + (view ? '?view=' + encodeURIComponent(view) : '');\n"
    "    dispatchEvent(new Event('unificado-sidebar-model-a-update'));\n"
    "  }\n\n"
    "  function syncGedMenu(route = activeGed) {", "route helper")
router = replace_once(router, "    activeGed = route;\n    document.querySelectorAll('#sidebar .is-active')",
    "    activeGed = route;\n    document.body.classList.add('unificado-ged-active');\n"
    "    document.querySelectorAll('#sidebar .is-active')", "GED module")
router = replace_once(router,
    "        tasks:'Tarefas', calibrations:'Calibrações'})[route];\n",
    "        tasks:'Tarefas', calibrations:'Calibrações'})[route];\n"
    "    updateModelAPath('ged/' + route);\n", "GED route")
router = replace_once(router,
    "    activeGed = null;\n    expectedGedRoute = null;\n    const moduleChanged = currentModule !== route.module;",
    "    activeGed = null;\n    expectedGedRoute = null;\n"
    "    document.body.classList.remove('unificado-ged-active');\n"
    "    const moduleChanged = currentModule !== route.module;", "ordinary route")
router = replace_once(router,
    "    if (push) history.pushState({view: route.path + route.url.search}, '', root + '?view=' + encodeURIComponent(route.path + route.url.search));\n",
    "    if (push) history.pushState({view: route.path + route.url.search}, '', root + '?view=' + encodeURIComponent(route.path + route.url.search));\n"
    "    updateModelAPath(route.path + route.url.search);\n", "active ordinary path")
router = replace_once(router,
    "  function home(push = true) {\n    ++pending;\n    activeGed = null;\n    expectedGedRoute = null;",
    "  function home(push = true) {\n    ++pending;\n    activeGed = null;\n    expectedGedRoute = null;\n"
    "    document.body.classList.remove('unificado-ged-active');", "home module")
router = replace_once(router, "    if (push) history.pushState({}, '', root);\n",
    "    if (push) history.pushState({}, '', root);\n    updateModelAPath();\n", "home path")
router_file.write_text(router, encoding="utf-8", newline="\n")

for relative in ["index.html", "sw.js", "VERSION"]:
    shutil.copy2(ROOT / "unificado" / relative, OUT / relative)
for relative in ["modelo-a-host.css", "modelo-a-loader.js", "modelo-a/menu.css", "modelo-a/menu.js"]:
    destination = OUT / "shell" / relative
    destination.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(ROOT / "unificado/shell" / relative, destination)
print("Modelo A overlay built from live production shell 1.0.11")
