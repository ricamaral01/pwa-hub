"""Compare the read-only real source with the named mirror, no row output."""

from pathlib import Path
import os
import sys

import psycopg
from psycopg import sql
from psycopg.rows import dict_row

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from sync_receitas import SOURCE_COLUMNS, SOURCE_QUERY, source_hash  # noqa: E402


with psycopg.connect(os.environ["USINAS_SOURCE_DATABASE_URL"], row_factory=dict_row,
                     options="-c default_transaction_read_only=on") as source:
    assert source.execute("SELECT current_database()").fetchone()["current_database"] == "supervisorio_db"
    source_rows = {row["id"]: row for row in source.execute(SOURCE_QUERY).fetchall()}

target_columns = ("origem_id",) + SOURCE_COLUMNS[1:] + ("_source_hash",)
query = sql.SQL("SELECT {} FROM usinas.receitas WHERE unidade_id='campinas' "
                "AND origem_banco='supervisorio_db'").format(
    sql.SQL(", ").join(map(sql.Identifier, target_columns))
)
target_dsn = os.environ.get("USINAS_TARGET_DATABASE_URL") or os.environ["USINAS_HOMOLOG_DATABASE_URL"]
expected_target = os.environ.get("USINAS_EXPECTED_TARGET_DB", "mapa_unificado_homolog_20261016")
with psycopg.connect(target_dsn, row_factory=dict_row) as target:
    assert target.execute("SELECT current_database()").fetchone()["current_database"] == expected_target
    mirror_rows = {row["origem_id"]: row for row in target.execute(query).fetchall()}
    status = target.execute("""
        SELECT last_success_at, source_count, mirror_count, last_error,
               EXTRACT(EPOCH FROM now()-last_success_at) AS lag_seconds
        FROM usinas.sync_status WHERE unidade_id='campinas'
          AND origem_banco='supervisorio_db' AND origem_tabela='tbl_receitas'
    """).fetchone()

missing = set(source_rows) - set(mirror_rows)
extra = set(mirror_rows) - set(source_rows)
mismatch = []
for row_id in set(source_rows) & set(mirror_rows):
    origin = source_rows[row_id]
    mirror = mirror_rows[row_id]
    if mirror["_source_hash"] != source_hash(origin) or any(
        mirror[column] != origin[column] for column in SOURCE_COLUMNS[1:]
    ):
        mismatch.append(row_id)
assert not missing and not extra and not mismatch
assert status and status["last_error"] is None
assert status["source_count"] == status["mirror_count"] == len(source_rows)
print(f"fonte={len(source_rows)} espelho={len(mirror_rows)} faltantes=0 extras=0 divergentes=0")
print(f"ultimo_ciclo_ha_segundos={float(status['lag_seconds']):.1f}")
