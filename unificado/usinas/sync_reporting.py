"""Copy the Campinas report inputs from a read-only source to the new VPS.

Run ``--schema-sql`` first and apply its output as a database administrator.
The recurring job only needs DML on the ten tables and sync_status.
"""

from __future__ import annotations

import argparse
import os
import sys

import psycopg
from psycopg import sql


TABLES = (
    "tbl_config_traco_campo",
    "tbl_est_config_massada",
    "tbl_est_custos_ajustes",
    "tbl_est_materiais",
    "tbl_est_movimentos",
    "tbl_massadas",
    "tbl_nao_conformidades_apontadas",
    "tbl_paradas_apontadas",
    "tbl_qrcp",
    "tbl_receitas",
)
SOURCE_DB = "supervisorio_db"
TARGET_DB = "mapa_unificado_teste"
SCHEMA = "usinas_reporting"


def columns(cursor, table):
    cursor.execute(
        """SELECT a.attname, pg_catalog.format_type(a.atttypid, a.atttypmod),
                  a.attnotnull
           FROM pg_catalog.pg_attribute a
           JOIN pg_catalog.pg_class c ON c.oid = a.attrelid
           JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
           WHERE n.nspname = 'public' AND c.relname = %s
             AND a.attnum > 0 AND NOT a.attisdropped
           ORDER BY a.attnum""",
        (table,),
    )
    result = cursor.fetchall()
    if not result or result[0][0] != "id" or not any(row[0] == "id" for row in result):
        raise RuntimeError(f"Unexpected schema for {table}")
    return result


def source_connection(dsn):
    conn = psycopg.connect(
        dsn, autocommit=True, connect_timeout=10,
        options="-c default_transaction_read_only=on"
    )
    if conn.execute("SELECT current_database()").fetchone()[0] != SOURCE_DB:
        conn.close()
        raise RuntimeError("Wrong source database")
    return conn


def target_connection(dsn):
    conn = psycopg.connect(dsn, autocommit=True, connect_timeout=10)
    if conn.execute("SELECT current_database()").fetchone()[0] != TARGET_DB:
        conn.close()
        raise RuntimeError("Wrong target database")
    return conn


def schema_sql(source_dsn):
    lines = [
        "BEGIN;",
        "DO $$ BEGIN IF current_database() <> 'mapa_unificado_teste' "
        "THEN RAISE EXCEPTION 'Wrong reporting target'; END IF; END $$;",
        f"CREATE SCHEMA IF NOT EXISTS {SCHEMA};",
        f"REVOKE ALL ON SCHEMA {SCHEMA} FROM PUBLIC;",
    ]
    with source_connection(source_dsn) as source:
        with source.cursor() as cursor:
            for table in TABLES:
                defs = columns(cursor, table)
                fields = ",\n    ".join(
                    f'"{name}" {kind}' + (" NOT NULL" if required else "")
                    for name, kind, required in defs
                )
                lines.append(
                    f"CREATE TABLE IF NOT EXISTS {SCHEMA}.{table} (\n"
                    f"    {fields},\n    PRIMARY KEY (id)\n);"
                )
                lines.append(
                    f"GRANT SELECT, INSERT, UPDATE, DELETE ON {SCHEMA}.{table} TO \"usinas-sync\";"
                )
                lines.append(f"GRANT SELECT ON {SCHEMA}.{table} TO mapa_api_login;")
    lines.extend(
        [
            f"GRANT USAGE ON SCHEMA {SCHEMA} TO \"usinas-sync\", mapa_api_login;",
            "COMMIT;",
        ]
    )
    return "\n".join(lines)


def sync_once(source_dsn, target_dsn):
    results = []
    with source_connection(source_dsn) as source, target_connection(target_dsn) as target:
        with source.transaction(), target.transaction():
            source.execute("SET TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY")
            target.execute("SET LOCAL lock_timeout = '5s'")
            locked = target.execute(
                "SELECT pg_try_advisory_xact_lock(hashtext('usinas.reporting.campinas'))"
            ).fetchone()[0]
            if not locked:
                return {"status": "already_running"}
            for table in TABLES:
                with source.cursor() as origin, target.cursor() as mirror:
                    source_columns = columns(origin, table)
                    names = [item[0] for item in source_columns]
                    mirror.execute(
                        """SELECT a.attname, pg_catalog.format_type(a.atttypid, a.atttypmod), a.attnotnull
                           FROM pg_catalog.pg_attribute a
                           JOIN pg_catalog.pg_class c ON c.oid=a.attrelid
                           JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
                           WHERE n.nspname=%s AND c.relname=%s AND a.attnum>0
                             AND NOT a.attisdropped ORDER BY a.attnum""",
                        (SCHEMA, table),
                    )
                    if mirror.fetchall() != source_columns:
                        raise RuntimeError(f"Schema mismatch: {table}")
                    fields = sql.SQL(", ").join(map(sql.Identifier, names))
                    origin.execute(
                        sql.SQL("SELECT {} FROM public.{} ORDER BY id").format(
                            fields, sql.Identifier(table)
                        )
                    )
                    rows = origin.fetchall()
                    mirror.execute(
                        sql.SQL("SELECT count(*) FROM {}.{}").format(
                            sql.Identifier(SCHEMA), sql.Identifier(table)
                        )
                    )
                    previous = mirror.fetchone()[0]
                    if previous and len(rows) < previous * 0.95:
                        raise RuntimeError(f"Unexpected row loss: {table}")
                    stage = "reporting_stage_" + table
                    mirror.execute(
                        sql.SQL("CREATE TEMP TABLE {} (LIKE {}.{}) ON COMMIT DROP").format(
                            sql.Identifier(stage), sql.Identifier(SCHEMA), sql.Identifier(table)
                        )
                    )
                    if rows:
                        with mirror.copy(
                            sql.SQL("COPY {} ({}) FROM STDIN").format(
                                sql.Identifier(stage), fields
                            )
                        ) as copy:
                            for row in rows:
                                copy.write_row(row)
                    mutable = [name for name in names if name != "id"]
                    updates = sql.SQL(", ").join(
                        sql.SQL("{} = EXCLUDED.{}").format(
                            sql.Identifier(name), sql.Identifier(name)
                        ) for name in mutable
                    )
                    old_values = sql.SQL(", ").join(
                        sql.SQL("current.{}").format(sql.Identifier(name))
                        for name in mutable
                    )
                    new_values = sql.SQL(", ").join(
                        sql.SQL("EXCLUDED.{}").format(sql.Identifier(name))
                        for name in mutable
                    )
                    mirror.execute(
                        sql.SQL(
                            "INSERT INTO {}.{} AS current ({}) SELECT {} FROM {} WHERE true "
                            "ON CONFLICT (id) DO UPDATE SET {} "
                            "WHERE ({}) IS DISTINCT FROM ({})"
                        ).format(
                            sql.Identifier(SCHEMA), sql.Identifier(table), fields,
                            fields, sql.Identifier(stage), updates, old_values, new_values,
                        )
                    )
                    mirror.execute(
                        sql.SQL(
                            "DELETE FROM {}.{} AS current WHERE NOT EXISTS "
                            "(SELECT 1 FROM {} AS stage WHERE stage.id=current.id)"
                        ).format(
                            sql.Identifier(SCHEMA), sql.Identifier(table), sql.Identifier(stage)
                        )
                    )
                    mirror.execute(
                        sql.SQL("SELECT count(*) FROM {}.{}").format(
                            sql.Identifier(SCHEMA), sql.Identifier(table)
                        )
                    )
                    count = mirror.fetchone()[0]
                    if count != len(rows):
                        raise RuntimeError(f"Count mismatch: {table}")
                    mirror.execute(
                        """INSERT INTO usinas.sync_status
                           (unidade_id,origem_banco,origem_tabela,last_success_at,
                            source_count,mirror_count,last_error,updated_at)
                           VALUES ('campinas','supervisorio_db',%s,now(),%s,%s,NULL,now())
                           ON CONFLICT (unidade_id,origem_banco,origem_tabela)
                           DO UPDATE SET last_success_at=EXCLUDED.last_success_at,
                             source_count=EXCLUDED.source_count,
                             mirror_count=EXCLUDED.mirror_count,
                             last_error=NULL,updated_at=now()""",
                        (f"reporting.{table}", len(rows), count),
                    )
                    results.append((table, count))
    return {"status": "ok", "tables": results}


def verify_once(source_dsn, target_dsn):
    """Compare every copied value; return counts without exposing report data."""
    counts = []
    with source_connection(source_dsn) as source, target_connection(target_dsn) as target:
        for table in TABLES:
            with source.cursor() as origin, target.cursor() as mirror:
                names = [item[0] for item in columns(origin, table)]
                fields = sql.SQL(", ").join(map(sql.Identifier, names))
                origin.execute(
                    sql.SQL("SELECT {} FROM public.{} ORDER BY id").format(
                        fields, sql.Identifier(table)
                    )
                )
                mirror.execute(
                    sql.SQL("SELECT {} FROM {}.{} ORDER BY id").format(
                        fields, sql.Identifier(SCHEMA), sql.Identifier(table)
                    )
                )
                source_rows, mirror_rows = origin.fetchall(), mirror.fetchall()
                if source_rows != mirror_rows:
                    raise RuntimeError(f"Mirror differs from source: {table}")
                counts.append((table, len(source_rows)))
    return {"status": "matching", "tables": counts}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--schema-sql", action="store_true")
    parser.add_argument("--verify", action="store_true")
    args = parser.parse_args()
    source = os.environ["USINAS_SOURCE_DATABASE_URL"]
    if args.schema_sql:
        print(schema_sql(source))
    else:
        target = os.environ.get("USINAS_TARGET_DATABASE_URL") or os.environ["USINAS_HOMOLOG_DATABASE_URL"]
        print(verify_once(source, target) if args.verify else sync_once(source, target))


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"reporting sync failed: {type(exc).__name__}: {exc}", file=sys.stderr)
        raise SystemExit(1)
