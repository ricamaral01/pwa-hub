"""Build the PCP labour candidate without carrying unrelated local router edits.

The router already has independent changes in this workspace. This overlay
copies only the labour routes and three small imports/conversions onto the
published router supplied as --base.
"""

from __future__ import annotations

import argparse
from pathlib import Path


def section(text: str, start: str, end: str) -> str:
    left = text.index(start)
    right = text.index(end, left)
    return text[left:right]


def replace_once(text: str, old: str, new: str) -> str:
    if text.count(old) != 1:
        raise ValueError(f"Expected one occurrence, found {text.count(old)}: {old[:70]}")
    return text.replace(old, new, 1)


def build(base: str, source: str) -> str:
    result = base
    for old, new in (
        ("MaoDeObra, MaoDeObraRateio, AtividadeMaoDeObra", "MaoDeObra, MaoDeObraDia, MaoDeObraRateio, AtividadeMaoDeObra"),
        ("    MaoDeObraLoteCreate,\n", "    MaoDeObraLoteCreate,\n    MaoDeObraGrupoLoteCreate,\n"),
        ("    ArividadeMaoDeObraOut,\n", "    ArividadeMaoDeObraOut,\n    AtividadeMaoDeObraUpdate,\n"),
        ("d.isoformat(): int(db.query(func.coalesce(func.sum(MaoDeObra.quantidade_pessoas), 0))", "d.isoformat(): float(db.query(func.coalesce(func.sum(MaoDeObra.quantidade_pessoas), 0))"),
    ):
        result = replace_once(result, old, new)

    for start, end in (
        ('@router.post("/maodeobra"', '@router.delete("/maodeobra/{mdo_id}"'),
        ('@router.get("/atividades-maodeobra"', '# ─── Rateio de MOI'),
    ):
        result = replace_once(result, section(result, start, end), section(source, start, end))
    rateio_start = '@router.post("/maodeobra-com-rateio"'
    rateio_end = '@router.get("/maodeobra-com-rateio/{mdo_id}"'
    result = replace_once(
        result,
        section(result, rateio_start, rateio_end),
        section(source, rateio_start, rateio_end),
    )
    return result


def build_page(base: str, source: str) -> str:
    marker = '  <meta charset="UTF-8" />'
    if base.count(marker) != 1 or source.count(marker) != 1:
        raise ValueError("PCP page head marker changed")
    return base[:base.index(marker)] + source[source.index(marker):]


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base", type=Path, required=True)
    parser.add_argument("--source", type=Path, required=True)
    parser.add_argument("--out", type=Path, required=True)
    parser.add_argument("--kind", choices=("router", "page"), default="router")
    args = parser.parse_args()
    args.out.write_text(
        (build_page if args.kind == "page" else build)(
            args.base.read_text(encoding="utf-8"), args.source.read_text(encoding="utf-8")
        ),
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()
