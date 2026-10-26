"""Build the scoped Suprimentos payload from a fresh production snapshot.

The input's aplicacao-teste directory must come from build-f8-clean-patches.py.
Only new module files and the six reviewed shared files enter this package.
"""
from __future__ import annotations

import shutil
import sys
from pathlib import Path


def main(snapshot: Path, source: Path, output: Path) -> None:
    snapshot = snapshot.resolve()
    source = source.resolve()
    output = output.resolve()
    if output.exists():
        raise SystemExit(f"Output already exists: {output}")
    output.mkdir(parents=True)
    overlay = output / "overlay"
    reviewed = snapshot / "aplicacao-teste"
    paths = {
        "unificado/mapa/api/app.py": "mapa-api/app.py",
        "unificado/mapa/api/screen_catalog.json": "mapa-api/screen_catalog.json",
        "unificado/shell/shell.js": "public/unificado/shell/shell.js",
        "unificado/shell/router.js": "public/unificado/shell/router.js",
        "unificado/shell/menu.config.js": "public/unificado/shell/menu.config.js",
        "unificado/shell/modelo-a/menu.js": "public/unificado/shell/modelo-a/menu.js",
    }
    for original, target in paths.items():
        dest = overlay / target
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(reviewed / original, dest)

    version = "1.0.95"
    for name in ("index.html", "sw.js"):
        body = (snapshot / name).read_text(encoding="utf-8")
        if "1.0.58" not in body:
            raise RuntimeError(f"Unexpected production version in {name}")
        dest = overlay / "public/unificado" / name
        dest.write_bytes(body.replace("1.0.58", version).encode("utf-8"))
    shell = overlay / "public/unificado/shell/shell.js"
    body = shell.read_text(encoding="utf-8")
    if "const APP_VERSION = '1.0.58';" not in body:
        raise RuntimeError("Unexpected APP_VERSION")
    shell.write_bytes(body.replace("const APP_VERSION = '1.0.58';",
                                   f"const APP_VERSION = '{version}';", 1).encode("utf-8"))
    (overlay / "public/unificado/VERSION").write_bytes((version + "\n").encode("utf-8"))

    module_source = source / "unificado/suprimentos"
    service = output / "module"
    for name in ("service", "migrations", "frontend", "painel", "solicitacoes",
                 "solicitacao", "nova", "fornecedores", "cadastros", "cotacoes",
                 "almoxarifado", "inventario", "recebimento", "analises", "pwa"):
        shutil.copytree(module_source / name, service / name,
                        ignore=shutil.ignore_patterns("__pycache__", "*.pyc"))
    pwa_sw = service / "pwa/sw.js"
    body = pwa_sw.read_text(encoding="utf-8")
    if "const CACHE = 'suprimentos-shell-s1-v1.0.72-r2';" not in body:
        raise RuntimeError("Unexpected PWA cache key")
    pwa_sw.write_bytes(body.replace("suprimentos-shell-s1-v1.0.72-r2",
                                    f"suprimentos-shell-s1-v{version}").encode("utf-8"))

    snippet = (snapshot / "snippet-stage.conf").read_text(encoding="utf-8")
    snippet = snippet.replace("/opt/concrefer-unificado/homolog-next/public",
                              "/opt/concrefer-unificado/public")
    snippet = snippet.replace(":13152", ":13052").replace(":13167", ":13267")
    snippet = snippet.replace("@unificado_api_unauth", "@suprimentos_api_unauth")
    snippet += '\n    location @suprimentos_api_unauth {\n' \
               '        default_type application/json;\n' \
               '        return 401 \'{"error":"Sessão necessária"}\';\n' \
               '    }\n'
    (output / "suprimentos-production.nginx.conf").write_bytes(snippet.encode("utf-8"))
    print("PRODUCTION_PACKAGE_READY", version, len(paths), "shared files")


if __name__ == "__main__":
    if len(sys.argv) != 4:
        raise SystemExit("usage: prepare-production-package.py <fresh-snapshot> <git-archive-source> <output>")
    main(*(Path(value) for value in sys.argv[1:]))
