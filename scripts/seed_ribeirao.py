"""Seed Ribeirão products and labor areas without importing historical entries.

Dry run is the default. --apply requires DATABASE_URL and empty unit catalogs.
"""
from __future__ import annotations

import argparse
import csv
import os
from decimal import Decimal
from pathlib import Path

SEED = Path(__file__).resolve().parents[1] / "docs/porting/producao-ribeirao/seed/seed_produtos_ribeirao.csv"
UNIT_ID = 3
AREAS = (
    ("Usina de Concreto", "MOI"),
    ("Produção", "MOD"),
    ("Fabricação Armação", "MOI"),
    ("Fabricação Estribo", "MOI"),
    ("Sacador núcleo", "MOD"),
)


def read_rows(seed_path: Path = SEED):
    with seed_path.open(encoding="utf-8-sig", newline="") as handle:
        rows = list(csv.DictReader(handle, delimiter=";"))
    expected = {"familia", "letra", "descricao", "cod_pro", "cod_sma", "pendencia"}
    if len(rows) != 99 or set(rows[0]) != expected:
        raise ValueError("Unexpected Ribeirão seed format or product count")
    codes = [row["cod_pro"] for row in rows if row["cod_pro"]]
    if len(codes) != len(set(codes)):
        raise ValueError("Duplicate product code")
    return rows


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true")
    parser.add_argument("--seed", type=Path, default=SEED)
    args = parser.parse_args()
    rows = read_rows(args.seed)
    print(f"Ribeirão: {len(rows)} products, {len(AREAS)} labor areas; no daily entries")
    if not args.apply:
        return
    url = os.environ.get("DATABASE_URL")
    if not url:
        raise RuntimeError("DATABASE_URL required for --apply")
    import psycopg2

    with psycopg2.connect(url) as connection:
        with connection.cursor() as cursor:
            cursor.execute("SELECT id,passo_homens FROM producao.unidade WHERE codigo='ribeirao' FOR UPDATE")
            unit = cursor.fetchone()
            if not unit or unit[0] != UNIT_ID or unit[1] != Decimal("0.01"):
                raise RuntimeError("Ribeirão unit or labor step is not configured")
            cursor.execute("SELECT count(*) FROM producao.produto WHERE unidade_id=%s", (UNIT_ID,))
            if cursor.fetchone()[0]:
                raise RuntimeError("Ribeirão product catalog is not empty")
            cursor.execute("SELECT count(*) FROM public.atividades_mao_de_obra WHERE unidade_id=%s", (UNIT_ID,))
            if cursor.fetchone()[0]:
                raise RuntimeError("Ribeirão labor areas are not empty")
            for row in rows:
                cursor.execute("""
                  INSERT INTO producao.produto
                    (unidade_id,familia,letra,descricao,cod_pro,cod_sma,volume_m3,pendencia)
                  VALUES (%s,%s,%s,%s,%s,%s,NULL,%s)
                """, (UNIT_ID, row["familia"], row["letra"] or None, row["descricao"],
                      row["cod_pro"] or None, row["cod_sma"] or None, row["pendencia"] or None))
            for position, (name, kind) in enumerate(AREAS, 1):
                cursor.execute("""
                  INSERT INTO public.atividades_mao_de_obra
                    (unidade_id,descricao,tipo,grupo_setor,ordem,ativo)
                  VALUES (%s,%s,%s,%s,%s,true)
                """, (UNIT_ID, name, kind, "03", position))
    print("Catalog and areas saved")


if __name__ == "__main__":
    main()
