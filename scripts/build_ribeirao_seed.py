"""Extract only Ribeirão's product catalog from the supplied TSV export.

Usage: python scripts/build_ribeirao_seed.py "Pasted text.txt"
The daily production and labor cells are deliberately ignored.
"""
from __future__ import annotations

import csv
import sys
from pathlib import Path

OUTPUT = Path(__file__).resolve().parents[1] / "docs/porting/producao-ribeirao/seed/seed_produtos_ribeirao.csv"


def family(number: int) -> str:
    if number <= 28:
        return "Padrão"
    if number <= 32:
        return "Econômico"
    if number <= 42 or number >= 74:
        return "Duplo T"
    if number <= 44:
        return "Coluna"
    if number <= 50:
        return "Acessórios"
    return "Circular"


def main(source: Path) -> None:
    lines = [line.split("\t") for line in source.read_text(encoding="utf-8-sig").splitlines()]
    start = next(i for i, row in enumerate(lines) if row[0].strip() == "Descrição Poste Duplo T") + 1
    end = next(i for i in range(start, len(lines)) if lines[i][0].strip() == "Total")
    products = lines[start:end]
    if len(products) != 99:
        raise ValueError(f"Expected 99 product rows, found {len(products)}")
    codes = [row[1].strip() for row in products if row[1].strip()]
    if len(codes) != len(set(codes)):
        raise ValueError("Duplicate product codes")
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.writer(handle, delimiter=";")
        writer.writerow(("familia", "letra", "descricao", "cod_pro", "cod_sma", "pendencia"))
        for number, row in enumerate(products, 1):
            description, code, sma = (cell.strip() for cell in row[:3])
            if not description:
                raise ValueError(f"Product row {number} has no description")
            issues = []
            if not code:
                issues.append("Código Pro não informado na planilha")
            if code == "13.683":
                issues.append("Código Pro preservado como 13.683; confirmar formatação")
            writer.writerow((family(number), "", description, code, sma, "; ".join(issues)))
    print(f"Wrote {len(products)} products to {OUTPUT}")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit("Usage: python scripts/build_ribeirao_seed.py SOURCE.tsv")
    main(Path(sys.argv[1]))
