"""Atualiza referências de assets versionados dentro de unificado/.

Uso: python scripts/bump_unificado.py 0.1.1
     python scripts/bump_unificado.py --check
"""

from __future__ import annotations

import argparse
from pathlib import Path
import re


ROOT = Path(__file__).resolve().parent.parent / "unificado"
ASSET_VERSION = re.compile(r"((?:[\w./-]+\.(?:css|js|json|webmanifest))\?v=)[\w.-]+")
OWN_SOURCE_SUFFIXES = {".html", ".css", ".js", ".json", ".webmanifest"}


def owned_files():
    for path in ROOT.rglob("*"):
        if path.is_file() and path.suffix in OWN_SOURCE_SUFFIXES and "vendor" not in path.relative_to(ROOT).parts:
            yield path


def current_versions():
    versions = set()
    for path in owned_files():
        text = path.read_text(encoding="utf-8")
        versions.update(match.group(0).split("?v=", 1)[1] for match in ASSET_VERSION.finditer(text))
    return versions


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("version", nargs="?", help="nova versão, por exemplo 0.1.1")
    parser.add_argument("--check", action="store_true", help="confere se as referências coincidem com VERSION")
    args = parser.parse_args()
    if args.check:
        expected = (ROOT / "VERSION").read_text(encoding="utf-8").strip()
        found = current_versions()
        if found != {expected}:
            parser.exit(1, f"Versões encontradas: {sorted(found)}; VERSION: {expected}\n")
        print(f"Todas as referências de assets estão em {expected}.")
        return
    if not args.version or not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9._-]*", args.version):
        parser.error("informe uma versão sem espaços")
    for path in owned_files():
        source = path.read_text(encoding="utf-8")
        updated = ASSET_VERSION.sub(lambda match: match.group(1) + args.version, source)
        if updated != source:
            path.write_text(updated, encoding="utf-8", newline="\n")
            print(path.relative_to(ROOT))
    (ROOT / "VERSION").write_text(args.version + "\n", encoding="utf-8", newline="\n")


if __name__ == "__main__":
    main()
