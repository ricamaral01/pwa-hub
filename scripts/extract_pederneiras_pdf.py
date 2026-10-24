"""Extract a verification fixture from the printed LT-PRO-04 October PDF.

The printed page has 112 product rows at a regular 4.24 pt interval. Each
value is assigned from its PDF x/y coordinate, never from missing spaces in
the extracted text. Row totals must match. The footer is reported separately
because the supplied printout itself contains discrepant formula values.
"""
from __future__ import annotations

import argparse
import csv
from pathlib import Path

import pdfplumber

ROW_TOP = 53.4
ROW_STEP = 4.235
DAY_X = 309.8
DAY_STEP = 9.67
PRODUCT_ROWS = 112


def parse(pdf: Path):
    with pdfplumber.open(pdf) as doc:
        if len(doc.pages) != 1:
            raise ValueError("Esperado PDF de uma página")
        words = doc.pages[0].extract_words(x_tolerance=1, y_tolerance=2)
    rows = [{"descricao": [], "cod_pro": "", "cod_sma": "", "total_pdf": None,
             "dias": [0] * 31} for _ in range(PRODUCT_ROWS)]
    footer = [None] * 31
    footer_total = None
    for word in words:
        x, y, value = word["x0"], word["top"], word["text"]
        if abs(y - 526.9) < 1.0 and x >= 307:
            if x >= 607:
                footer_total = int(value)
            else:
                day = round((x - DAY_X) / DAY_STEP)
                if 0 <= day < 31:
                    footer[day] = int(value)
            continue
        row_index = round((y - ROW_TOP) / ROW_STEP)
        if not 0 <= row_index < PRODUCT_ROWS or abs(y - (ROW_TOP + row_index * ROW_STEP)) > 1.2:
            continue
        row = rows[row_index]
        if x < 279:
            row["descricao"].append(value)
        elif 279 <= x < 294:
            row["cod_pro"] += value
        elif 294 <= x < 307:
            row["cod_sma"] += value
        elif 307 <= x < 607:
            day = round((x - DAY_X) / DAY_STEP)
            if 0 <= day < 31 and value.isdigit():
                row["dias"][day] += int(value)
        elif x >= 607 and value.isdigit():
            row["total_pdf"] = int(value)
    for i, row in enumerate(rows, 1):
        row["descricao"] = " ".join(row["descricao"])
        if not row["descricao"]:
            raise ValueError(f"Linha {i} ilegível")
        # The three AAT rows are printed without a total cell.
        if row["total_pdf"] is None and not any(row["dias"]):
            row["total_pdf"] = 0
        if row["total_pdf"] is None:
            raise ValueError(f"Linha {i} sem total impresso")
        total = sum(row["dias"])
        if total != row["total_pdf"]:
            raise ValueError(f"Linha {i} ({row['cod_pro']}): células={total}, impresso={row['total_pdf']}")
    computed_footer = [sum(row["dias"][i] for row in rows) for i in range(31)]
    return rows, computed_footer, footer, footer_total


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("pdf", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    rows, calculated, footer, total = parse(args.pdf)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open("w", encoding="utf-8", newline="") as stream:
        writer = csv.writer(stream, delimiter=";")
        writer.writerow(["descricao", "cod_pro", "cod_sma", *[f"2026-10-{d:02d}" for d in range(1, 32)], "total_pdf"])
        for row in rows:
            writer.writerow([row["descricao"], row["cod_pro"], row["cod_sma"], *row["dias"], row["total_pdf"]])
    print(f"{len(rows)} produtos; soma das células: {sum(calculated)}; rodapé impresso: {total}")
    print("Divergências diárias:", [(i + 1, calculated[i], footer[i])
                                    for i in range(31) if calculated[i] != footer[i]])


if __name__ == "__main__":
    main()
