"""Load the provisional Pederneiras catalog after the production unit migration.

Dry run is the default. --apply requires an empty Pederneiras catalog and an
explicit DATABASE_URL. Product volumes remain NULL until validated.
"""
from __future__ import annotations

import argparse
import csv
import os
from collections import Counter
from pathlib import Path

SEED = Path(__file__).resolve().parents[1] / "docs/porting/producao-pederneiras/seed/seed_produtos_pederneiras.csv"
UNIT_ID = 2


def read_rows():
    with SEED.open(encoding="utf-8-sig", newline="") as handle:
        rows = list(csv.DictReader(handle, delimiter=";"))
    expected = {"familia", "letra", "descricao", "cod_pro", "cod_sma", "pendencia"}
    if not rows or set(rows[0]) != expected:
        raise ValueError("Cabeçalho do seed inesperado")
    for row in rows:
        if not row["familia"].strip() or not row["descricao"].strip():
            raise ValueError("Produto sem família ou descrição")
    codes = [row["cod_pro"].strip() for row in rows if row["cod_pro"].strip()]
    if len(codes) != len(set(codes)):
        raise ValueError("Códigos Pro duplicados")
    return rows


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true", help="Insere no banco indicado por DATABASE_URL")
    args = parser.parse_args()
    rows = read_rows()
    letters = Counter(row["letra"].strip() for row in rows if row["letra"].strip())
    print(f"Produtos: {len(rows)}; pendências: {sum(bool(row['pendencia'].strip()) for row in rows)}")
    print(f"Letras duplicadas: {', '.join(key for key, count in letters.items() if count > 1) or 'nenhuma'}")
    print("Volume: não informado no CSV; será NULL em todos os produtos")
    if not args.apply:
        print("Simulação: nenhuma gravação feita")
        return
    database_url = os.environ.get("DATABASE_URL")
    if not database_url:
        raise RuntimeError("DATABASE_URL obrigatório para --apply")
    import psycopg2

    with psycopg2.connect(database_url) as connection:
        with connection.cursor() as cursor:
            cursor.execute("SELECT id FROM producao.unidade WHERE id=%s AND codigo=%s", (UNIT_ID, "pederneiras"))
            if not cursor.fetchone():
                raise RuntimeError("Unidade Pederneiras não encontrada")
            cursor.execute("SELECT count(*) FROM producao.produto WHERE unidade_id=%s", (UNIT_ID,))
            if cursor.fetchone()[0]:
                raise RuntimeError("Catálogo já possui produtos; importação inicial cancelada")
            for row in rows:
                cursor.execute("""
                    INSERT INTO producao.produto
                    (unidade_id,familia,letra,descricao,cod_pro,cod_sma,volume_m3,pendencia)
                    VALUES (%s,%s,%s,%s,%s,%s,NULL,%s)
                """, (UNIT_ID, row["familia"].strip(), row["letra"].strip() or None,
                      row["descricao"].strip(), row["cod_pro"].strip() or None,
                      row["cod_sma"].strip() or None, row["pendencia"].strip() or None))
            cursor.execute("""
                INSERT INTO producao.meta_producao
                    (unidade_id,ano_mes,dias_uteis,pcs_dia,meta_postes_homem)
                VALUES (%s,%s,%s,%s,%s)
                ON CONFLICT (unidade_id,ano_mes) DO NOTHING
            """, (UNIT_ID, "2026-10", 23, 64, 5.9))
    print("Produtos e meta de outubro/2026 gravados; áreas aguardam classificação confirmada")


if __name__ == "__main__":
    main()
