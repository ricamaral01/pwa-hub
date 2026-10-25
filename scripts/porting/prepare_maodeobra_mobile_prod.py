"""Prepare a reviewed Mão de Obra production bundle without touching the server.

The inputs in --snapshot are read-only copies of the files currently on air.
Hash assertions prevent carrying an unnoticed production change into the bundle.
"""
from __future__ import annotations

import argparse
import hashlib
from pathlib import Path
import shutil

from build_maodeobra_overlay import build_page


REPO = Path(__file__).resolve().parents[2]
VERSION = "20261017-prod-v1"
EXPECTED = {
    "app.js": "60063664c199eee73646aef0598076ed9eb761ada1670a2513a78da5789edb24",
    "auth.js": "3c50c89dd2a05711dae8c580064ab8af13133ff7e91c64ef45e04eaa1f5f78d3",
    "page.html": "c9e5acd4812468fe4b6fbe4b5d5ffb42ad8cefc7ac1ea591a2e28b00fbb68922",
    "pcp.py": "62eeec087b0b9bc41c4dd0f667761ea253c268fc92696e9ac15b448f7da10f44",
    "model.py": "ca1dfa84dcd6c6ef49e3b79e49d154b3a3a478718c16db96756aa6e6dcd0e12b",
    "schema.py": "e6b8c1ddd05bab322837ed33254ba13a72830424f99d9939806acf5425b6e39b",
}


def replace_one(value: str, old: str, new: str) -> str:
    if value.count(old) != 1:
        raise ValueError(f"Expected exactly one match: {old[:60]!r}")
    return value.replace(old, new, 1)


def write(out: Path, relative: str, content: str) -> None:
    target = out / relative
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(content, encoding="utf-8", newline="\n")


def copy(out: Path, source: Path, relative: str) -> None:
    target = out / relative
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source, target)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--snapshot", type=Path, required=True)
    parser.add_argument("--out", type=Path, required=True)
    args = parser.parse_args()
    for name, expected in EXPECTED.items():
        actual = hashlib.sha256((args.snapshot / name).read_bytes()).hexdigest()
        if actual != expected:
            raise SystemExit(f"Production baseline changed: {name}: {actual}")

    out = args.out
    api_source = REPO / "unificado/pcp/backend/app"
    for source, relative in (
        (api_source / "api/routers/pcp.py", "backend/app/api/routers/pcp.py"),
        (api_source / "models/producao.py", "backend/app/models/producao.py"),
        (api_source / "schemas/producao.py", "backend/app/schemas/producao.py"),
        (REPO / "unificado/pcp/static/js/maodeobra-core.js", "public/unificado/pcp/static/js/maodeobra-core.js"),
        (REPO / "unificado/pcp/static/js/maodeobra-grupos.js", "public/unificado/pcp/static/js/maodeobra-grupos.js"),
        (REPO / "unificado/pcp/static/js/maodeobra-mobile.js", "public/unificado/pcp/static/js/maodeobra-mobile.js"),
        (REPO / "unificado/pcp/static/css/maodeobra-mobile.css", "public/unificado/pcp/static/css/maodeobra-mobile.css"),
    ):
        copy(out, source, relative)

    page = build_page(
        (args.snapshot / "page.html").read_text(encoding="utf-8"),
        (REPO / "unificado/pcp/maodeobra/index.html").read_text(encoding="utf-8"),
    )
    page = page.replace("20261017-confirm1", VERSION).replace("20261017-installer1", VERSION)
    write(out, "public/unificado/pcp/maodeobra/index.html", page)

    app = (args.snapshot / "app.js").read_text(encoding="utf-8")
    app = replace_one(app,
        "      throw new Error(err.detail || `Não foi possível concluir a operação no PCP (HTTP ${res.status}). Tente novamente; se persistir, avise o suporte.`);",
        "      const failure = new Error(err.detail || `Não foi possível concluir a operação no PCP (HTTP ${res.status}). Tente novamente; se persistir, avise o suporte.`);\n      failure.status = res.status;\n      throw failure;")
    app = replace_one(app, "  return new Date().toISOString().split('T')[0];",
        "  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', {\n    timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit',\n  }).formatToParts(new Date()).map(part => [part.type, part.value]));\n  return `${parts.year}-${parts.month}-${parts.day}`;")
    write(out, "public/unificado/pcp/static/js/app.js", app)

    auth = (args.snapshot / "auth.js").read_text(encoding="utf-8")
    marker = "  if (modules.includes('mapa') && /^mapa\\/operacao\\/\\?tela=[A-Z0-9_]+$/.test(requestedNext || '')) {"
    auth = replace_one(auth, marker,
        "  if (modules.includes('pcp') && requestedNext === 'm/maodeobra/?launch=1')\n    return new URL(requestedNext, UNIFICADO_ROOT);\n" + marker)
    write(out, "public/unificado/shell/auth.js", auth)

    pwa = REPO / "unificado/m/maodeobra"
    for name in ("index.html", "login.html", "entry.js", "entry.css", "manifest.webmanifest", "sw.js"):
        content = (pwa / name).read_text(encoding="utf-8")
        content = content.replace("20261017-installer1", VERSION)
        content = content.replace("20261017-installer2", VERSION)
        content = content.replace("20261017-confirm1", VERSION)
        if name == "sw.js":
            content = replace_one(content, "maodeobra-shell-20261017-prod-v1",
                                  "maodeobra-shell-prod-20261017-v1")
        if name == "index.html":
            content = replace_one(content, "Planejamento · Concrefer</p>",
                                  "Versão oficial · Concrefer</p>")
        write(out, f"public/unificado/m/maodeobra/{name}", content)
    for icon in (pwa / "icons").glob("*.png"):
        copy(out, icon, f"public/unificado/m/maodeobra/icons/{icon.name}")
    for migration in (REPO / "unificado/pcp/backend/migrations").glob("20261017_maodeobra_*.psql"):
        copy(out, migration, f"migrations/{migration.name}")

    for candidate in out.rglob("*"):
        if candidate.is_file() and candidate.suffix in {".js", ".html", ".css", ".webmanifest", ".py"}:
            content = candidate.read_text(encoding="utf-8")
            if any(value in content for value in ("18446", "homolog-next", "13154")):
                raise SystemExit(f"Test-only reference in {candidate}")
    print(f"Prepared {sum(file.is_file() for file in out.rglob('*'))} files in {out}")


if __name__ == "__main__":
    main()
