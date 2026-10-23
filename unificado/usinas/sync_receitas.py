"""Read-only origin -> Campinas recipe mirror for an explicitly named target.

The source connection is read-only at PostgreSQL level. The destination must
exactly match ``USINAS_EXPECTED_TARGET_DB``. No legacy API call or origin write
is performed here.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import time
from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

import psycopg
from psycopg import sql
from psycopg.rows import dict_row


SOURCE_COLUMNS = (
    "id", "nome", "agregado1", "agregado2", "agregado3", "agregado4",
    "agregado5", "agregado6", "agregado7", "cimento1", "cimento2",
    "cimento3", "cimento4", "agua", "aditivo1", "aditivo2", "aditivo3",
    "ativa", "alterado", "nome_traco", "cimento", "adicao_1",
    "adicao_2", "areia_1", "areia_2", "areia_3", "brita_1", "brita_2",
    "aditivo_1", "aditivo_2", "ac", "r24h", "r3", "r7", "r28",
    "created_at", "revisao_grupo", "revisao_numero", "revisao_origem_id",
    "observacao_revisao", "revisado_em", "alterado_por",
)
TARGET_COLUMNS = ("unidade_id", "origem_banco", "origem_id") + SOURCE_COLUMNS[1:] + ("_source_hash",)
SOURCE_QUERY = sql.SQL("SELECT {} FROM public.tbl_receitas").format(
    sql.SQL(", ").join(map(sql.Identifier, SOURCE_COLUMNS))
)
UPSERT = sql.SQL("""
    INSERT INTO usinas.receitas ({columns}) VALUES ({values})
    ON CONFLICT (unidade_id, origem_banco, origem_id) DO UPDATE SET
        {updates}, ingested_at = now()
    WHERE usinas.receitas._source_hash IS DISTINCT FROM EXCLUDED._source_hash
""").format(
    columns=sql.SQL(", ").join(map(sql.Identifier, TARGET_COLUMNS)),
    values=sql.SQL(", ").join(sql.Placeholder() for _ in TARGET_COLUMNS),
    updates=sql.SQL(", ").join(
        sql.SQL("{} = EXCLUDED.{}").format(sql.Identifier(c), sql.Identifier(c))
        for c in TARGET_COLUMNS[3:]
    ),
)


def _canonical(value):
    if isinstance(value, Decimal):
        if not value.is_finite():
            raise ValueError("Numeric non-finite na origem")
        return format(value.normalize(), "f")
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    if isinstance(value, UUID):
        return str(value)
    return value


def source_hash(row: dict) -> str:
    if set(row) != set(SOURCE_COLUMNS):
        raise ValueError("Colunas da origem diferem do contrato tbl_receitas")
    canonical = {key: _canonical(row[key]) for key in SOURCE_COLUMNS}
    payload = json.dumps(canonical, sort_keys=True, ensure_ascii=False, separators=(",", ":"))
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def sync_once(source_dsn: str, target_dsn: str, ids: list[int] | None = None,
              expected_source_db: str = "supervisorio_db",
              expected_target_db: str = "mapa_unificado_homolog_20261016") -> dict:
    if ids is not None and (not ids or any(value < 1 for value in ids)):
        raise ValueError("IDs de refresh devem ser positivos")
    with psycopg.connect(target_dsn, autocommit=True, row_factory=dict_row,
                         connect_timeout=5) as target:
        db = target.execute("SELECT current_database() AS name").fetchone()["name"]
        if db != expected_target_db:
            raise RuntimeError("Destino recusado: banco diferente do configurado")
        with target.transaction():
            locked = target.execute(
                "SELECT pg_try_advisory_xact_lock(hashtext('usinas.receitas.campinas')) AS ok"
            ).fetchone()["ok"]
            if not locked:
                return {"status": "em_execucao"}
            with psycopg.connect(source_dsn, autocommit=True, row_factory=dict_row,
                                 connect_timeout=5,
                                 options="-c default_transaction_read_only=on") as source:
                with source.transaction():
                    source.execute("SET TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY")
                    source_db = source.execute("SELECT current_database() AS name").fetchone()["name"]
                    if source_db != expected_source_db:
                        raise RuntimeError("Origem recusada: banco diferente do configurado")
                    source_columns = {
                        item["column_name"] for item in source.execute("""
                            SELECT column_name FROM information_schema.columns
                            WHERE table_schema='public' AND table_name='tbl_receitas'
                        """).fetchall()
                    }
                    if source_columns != set(SOURCE_COLUMNS):
                        raise RuntimeError("Contrato de colunas da origem mudou")
                    query = SOURCE_QUERY
                    params = None
                    if ids is not None:
                        query = query + sql.SQL(" WHERE id = ANY(%s)")
                        params = (ids,)
                    rows = source.execute(query, params).fetchall()
            for row in rows:
                values = ("campinas", "supervisorio_db", row["id"])
                values += tuple(row[col] for col in SOURCE_COLUMNS[1:])
                values += (source_hash(row),)
                target.execute(UPSERT, values)
            found_ids = [row["id"] for row in rows]
            if ids is None:
                previous = target.execute(
                    "SELECT count(*) AS n FROM usinas.receitas "
                    "WHERE unidade_id='campinas' AND origem_banco='supervisorio_db'"
                ).fetchone()["n"]
                if not rows and previous:
                    raise RuntimeError("Snapshot vazio inesperado; espelho preservado")
                target.execute(
                    "DELETE FROM usinas.receitas WHERE unidade_id='campinas' "
                    "AND origem_banco='supervisorio_db' AND NOT (origem_id = ANY(%s))",
                    (found_ids,),
                )
                mirror_count = target.execute(
                    "SELECT count(*) AS n FROM usinas.receitas "
                    "WHERE unidade_id='campinas' AND origem_banco='supervisorio_db'"
                ).fetchone()["n"]
                if mirror_count != len(rows):
                    raise RuntimeError("Contagem divergente; transacao revertida")
                target.execute("""
                    INSERT INTO usinas.sync_status
                        (unidade_id, origem_banco, origem_tabela, last_success_at,
                         source_count, mirror_count, last_error, updated_at)
                    VALUES ('campinas','supervisorio_db','tbl_receitas',now(),%s,%s,NULL,now())
                    ON CONFLICT (unidade_id, origem_banco, origem_tabela)
                    DO UPDATE SET last_success_at=EXCLUDED.last_success_at,
                                  source_count=EXCLUDED.source_count,
                                  mirror_count=EXCLUDED.mirror_count,
                                  last_error=NULL, updated_at=now()
                """, (len(rows), mirror_count))
            else:
                target.execute(
                    "DELETE FROM usinas.receitas WHERE unidade_id='campinas' "
                    "AND origem_banco='supervisorio_db' AND origem_id = ANY(%s) "
                    "AND NOT (origem_id = ANY(%s))", (ids, found_ids)
                )
            return {"status": "ok", "source_count": len(rows), "refresh_ids": ids}


def record_failure(target_dsn: str, error_type: str,
                   expected_target_db: str = "mapa_unificado_homolog_20261016") -> None:
    """Mark a failed cycle without logging exception text or connection secrets."""
    with psycopg.connect(target_dsn, connect_timeout=5) as target:
        db = target.execute("SELECT current_database()").fetchone()[0]
        if db != expected_target_db:
            raise RuntimeError("Destino recusado: banco diferente do configurado")
        target.execute("""
            INSERT INTO usinas.sync_status
                (unidade_id, origem_banco, origem_tabela, last_error, updated_at)
            VALUES ('campinas','supervisorio_db','tbl_receitas',%s,now())
            ON CONFLICT (unidade_id, origem_banco, origem_tabela)
            DO UPDATE SET last_error=EXCLUDED.last_error, updated_at=now()
        """, (error_type,))


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--once", action="store_true", help="uma rodada de espelhamento")
    parser.add_argument("--ids", type=int, nargs="+", help="refresh imediato dos IDs")
    args = parser.parse_args()
    if args.ids and not args.once:
        parser.error("--ids requer --once")
    source_dsn = os.environ["USINAS_SOURCE_DATABASE_URL"]
    target_dsn = os.environ.get("USINAS_TARGET_DATABASE_URL") or os.environ["USINAS_HOMOLOG_DATABASE_URL"]
    expected_target_db = os.environ.get("USINAS_EXPECTED_TARGET_DB", "mapa_unificado_homolog_20261016")
    while True:
        started_at = time.monotonic()
        try:
            result = sync_once(source_dsn, target_dsn, args.ids,
                               os.environ.get("USINAS_EXPECTED_SOURCE_DB", "supervisorio_db"),
                               expected_target_db)
            print(json.dumps(result), flush=True)
        except (psycopg.Error, RuntimeError, ValueError) as exc:
            # No DSN, SQL payload or secret in operational output.
            error_type = type(exc).__name__
            try:
                record_failure(target_dsn, error_type, expected_target_db)
            except (psycopg.Error, RuntimeError):
                pass  # target may also be unavailable; the caller still gets an error
            print(json.dumps({"status": "erro", "tipo": error_type}), flush=True)
            if args.once:
                raise SystemExit(1) from None
        if args.once:
            return
        time.sleep(max(0.0, 60.0 - (time.monotonic() - started_at)))


if __name__ == "__main__":
    main()
