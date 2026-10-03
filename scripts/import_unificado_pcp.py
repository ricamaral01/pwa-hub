"""Importa uma cópia revisável do frontend PCP para unificado/pcp/.

Uso: python scripts/import_unificado_pcp.py .work-unificado-pcp-source
O diretório de origem deve conter as pastas pages/ e static/ exportadas da VPS.
"""

from __future__ import annotations

import argparse
from pathlib import Path
import re
import shutil


ROOT = Path(__file__).resolve().parent.parent
DEST = ROOT / "unificado" / "pcp"
EXPECTED = {
    "acompanhamento-mensal", "acompanhamento-mensal-setor-34", "apontamento-mega",
    "comparacao", "dashboard", "etiquetas", "etiquetas-armaduras", "etiquetas-sc",
    "formas-por-setor", "maodeobra", "maodeobra-rateio", "pcp-diario", "primeiro-acesso",
    "producao", "programacao", "programacao-alex", "programacao-circular-s3",
    "programacao-circular-s4", "programacao-final", "relatorio-producao",
    "relatorio-programacao-s3", "relatorio-programacao-s4", "teste-programacao", "usuarios",
}
REPLACEMENTS = {
    "https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css": "/unificado/vendor/bootstrap/bootstrap.min.css",
    "https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js": "/unificado/vendor/bootstrap/bootstrap.bundle.min.js",
    "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css": "/unificado/vendor/bootstrap-icons/bootstrap-icons.css",
    "https://cdn.jsdelivr.net/npm/chart.js@4.4.4/dist/chart.umd.min.js": "/unificado/vendor/chart.js/chart.umd.js",
    "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js": "/unificado/vendor/xlsx/xlsx.full.min.js",
    "/pages/login.html": "/unificado/login.html",
    "/pages/": "/unificado/pcp/",
    "/static/": "/unificado/pcp/static/",
}
FONT_LINK = re.compile(r"\s*<link[^>]+href=\"https://fonts\.googleapis\.com/[^\"]+\"[^>]*>", re.I)


def transform(text: str, *, html: bool) -> str:
    for old, new in REPLACEMENTS.items():
        text = text.replace(old, new)
    if html:
        text = FONT_LINK.sub("", text)
        guard = '  <script src="/unificado/pcp/readonly-guard.js"></script>\n'
        if "</head>" not in text.lower():
            raise ValueError("Página sem </head>")
        text = re.sub(r"</head>", guard + "</head>", text, count=1, flags=re.I)
    return text


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path)
    args = parser.parse_args()
    source = args.source.resolve()
    pages, static = source / "pages", source / "static"
    actual = {path.name for path in pages.iterdir() if path.is_dir()}
    if actual != EXPECTED:
        parser.error(f"Conjunto de páginas inesperado; faltam {sorted(EXPECTED-actual)}, sobram {sorted(actual-EXPECTED)}")
    if not static.is_dir():
        parser.error("A pasta static/ não existe")
    for page in sorted(EXPECTED):
        src = pages / page / "index.html"
        if not src.is_file():
            parser.error(f"Falta {src}")
        target = DEST / page / "index.html"
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(transform(src.read_text(encoding="utf-8"), html=True), encoding="utf-8", newline="\n")
    for src in static.rglob("*"):
        if not src.is_file() or ".bak" in src.name or src.name.startswith("msgbox"):
            continue
        target = DEST / "static" / src.relative_to(static)
        target.parent.mkdir(parents=True, exist_ok=True)
        if src.suffix in {".js", ".css"}:
            target.write_text(transform(src.read_text(encoding="utf-8"), html=False), encoding="utf-8", newline="\n")
        else:
            shutil.copy2(src, target)
    print(f"Importadas {len(EXPECTED)} páginas em {DEST}")


if __name__ == "__main__":
    main()
