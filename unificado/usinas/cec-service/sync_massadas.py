"""Mirror Campinas massadas into the new CEC database without writing to origin."""

from __future__ import annotations

import os
import sys

import psycopg
from psycopg import sql


SOURCE = os.environ["USINAS_SOURCE_DATABASE_URL"]
TARGET = os.environ["DATABASE_URL"]
TABLE = "public.tbl_massadas"


def columns(cursor):
    cursor.execute(
        """SELECT column_name, data_type, udt_name
           FROM information_schema.columns
           WHERE table_schema = 'public' AND table_name = 'tbl_massadas'
           ORDER BY ordinal_position"""
    )
    return cursor.fetchall()


def sync():
    source_options = {
        "connect_timeout": 10,
        "options": "-c default_transaction_read_only=on",
    }
    if os.environ.get("CEC_SOURCE_CA"):
        source_options["sslrootcert"] = os.environ["CEC_SOURCE_CA"]
    with psycopg.connect(SOURCE, **source_options) as origin:
        with origin.cursor() as source_cursor:
            source_cursor.execute("SET TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY")
            source_cursor.execute("SET LOCAL statement_timeout = '60s'")
            source_columns = columns(source_cursor)
            source_cursor.execute("SELECT * FROM public.tbl_massadas ORDER BY id")
            source_rows = source_cursor.fetchall()

        if not source_rows:
            raise RuntimeError("Source returned zero massadas; mirror left untouched")

        with psycopg.connect(TARGET, connect_timeout=10) as target:
            with target.cursor() as cursor:
                cursor.execute("SET LOCAL lock_timeout = '5s'")
                cursor.execute("SET LOCAL statement_timeout = '90s'")
                cursor.execute("SELECT pg_try_advisory_xact_lock(621023, 1)")
                if not cursor.fetchone()[0]:
                    raise RuntimeError("Another massadas sync is running")

                target_columns = columns(cursor)
                if source_columns != target_columns:
                    raise RuntimeError("Massadas columns or types differ between VPSs")

                cursor.execute("SELECT count(*) FROM public.tbl_massadas")
                previous_count = cursor.fetchone()[0]
                if previous_count and len(source_rows) < previous_count * 0.95:
                    raise RuntimeError("Source row count fell by more than 5%; mirror left untouched")

                names = [row[0] for row in source_columns]
                fields = sql.SQL(", ").join(map(sql.Identifier, names))
                update_names = [name for name in names if name != "id"]
                changed = sql.SQL(", ").join(
                    sql.SQL("{0} = EXCLUDED.{0}").format(sql.Identifier(name))
                    for name in update_names
                )
                current_values = sql.SQL(", ").join(
                    sql.SQL("current.{0}").format(sql.Identifier(name))
                    for name in update_names
                )
                incoming_values = sql.SQL(", ").join(
                    sql.SQL("EXCLUDED.{0}").format(sql.Identifier(name))
                    for name in update_names
                )

                cursor.execute(
                    "CREATE TEMP TABLE massadas_stage "
                    "(LIKE public.tbl_massadas) ON COMMIT DROP"
                )
                with cursor.copy(
                    sql.SQL("COPY massadas_stage ({}) FROM STDIN").format(fields)
                ) as copy:
                    for row in source_rows:
                        copy.write_row(row)
                cursor.execute("CREATE UNIQUE INDEX ON massadas_stage (id)")
                cursor.execute(
                    sql.SQL(
                        "INSERT INTO public.tbl_massadas AS current ({fields}) "
                        "SELECT {fields} FROM massadas_stage WHERE true "
                        "ON CONFLICT (id) DO UPDATE SET {changed} "
                        "WHERE ({current_values}) IS DISTINCT FROM ({incoming_values})"
                    ).format(
                        fields=fields,
                        changed=changed,
                        current_values=current_values,
                        incoming_values=incoming_values,
                    )
                )
                inserted_or_updated = cursor.rowcount
                cursor.execute(
                    "DELETE FROM public.tbl_massadas AS current "
                    "WHERE NOT EXISTS (SELECT 1 FROM massadas_stage WHERE id = current.id)"
                )
                deleted = cursor.rowcount
                cursor.execute(
                    "SELECT count(*), max(id), max(data) FROM public.tbl_massadas"
                )
                count, max_id, max_data = cursor.fetchone()
                if count != len(source_rows):
                    raise RuntimeError("Post-sync count differs; transaction rolled back")
                cursor.execute(
                    """INSERT INTO public.cec_massadas_snapshot
                       (id, imported_at, source_count, source_max_id, source_max_data)
                       VALUES (1, now(), %s, %s, %s)
                       ON CONFLICT (id) DO UPDATE SET
                         imported_at = EXCLUDED.imported_at,
                         source_count = EXCLUDED.source_count,
                         source_max_id = EXCLUDED.source_max_id,
                         source_max_data = EXCLUDED.source_max_data""",
                    (count, max_id, max_data),
                )
            target.commit()
    print(
        f"massadas sync: source={len(source_rows)} target={count} "
        f"changed={inserted_or_updated} deleted={deleted} max_id={max_id}",
        flush=True,
    )


if __name__ == "__main__":
    try:
        sync()
    except Exception as exc:
        print(f"massadas sync failed: {type(exc).__name__}: {exc}", file=sys.stderr)
        raise SystemExit(1)
