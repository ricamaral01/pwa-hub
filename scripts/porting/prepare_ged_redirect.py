"""Build the A6 vhost candidate from a read-only copy of the old GED vhost."""
from __future__ import annotations

import hashlib
from pathlib import Path


SOURCE = Path(".codex-tmp/ged-old-vhost-before-cut.conf")
FRAGMENT = Path("infra/ged/nginx-old-domain-a6-302.conf")
TARGET = Path("infra/ged/nginx-old-domain-a6-candidate.conf")


def main() -> None:
    old = SOURCE.read_text(encoding="utf-8")
    lines = old.splitlines(keepends=True)
    starts = [i for i, line in enumerate(lines) if line.startswith("    location ")]
    expected = ["/.well-known/acme-challenge/", "/uploads/", "/api", "/"]
    if len(starts) != 4 or any(expected[i] not in lines[start] for i, start in enumerate(starts)):
        raise ValueError("Locations do vhost antigo divergiram")
    start = starts[0]
    depth = 0
    end = None
    for i in range(starts[-1], len(lines)):
        depth += lines[i].count("{") - lines[i].count("}")
        if depth == 0:
            end = i + 1
            break
    if end is None:
        raise ValueError("Bloco final de location incompleto")
    fragment = FRAGMENT.read_text(encoding="utf-8")
    fragment = "".join("    " + line if line.strip() else line for line in fragment.splitlines(keepends=True)
                       if not line.lstrip().startswith("#"))
    result = "".join(lines[:start]) + fragment + "".join(lines[end:])
    if result.count("server_name ged.concretrack.com.br;") != 2 or result.count("return 302 ") < 4:
        raise ValueError("Vhost candidato incompleto")
    TARGET.write_text(result, encoding="utf-8")
    print("Vhost 302 candidato preparado; SHA-256 bruto da origem=" + hashlib.sha256(SOURCE.read_bytes()).hexdigest())


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"Falha no preparo do vhost: {type(error).__name__}")
        raise SystemExit(1) from None
