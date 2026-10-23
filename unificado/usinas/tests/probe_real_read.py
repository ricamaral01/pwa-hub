"""Read-only connectivity check. Prints only metadata, never row contents/secrets."""

from pathlib import Path
import os

import psycopg
from psycopg.rows import dict_row


for line in Path("/etc/concrefer/usinas-homolog.env").read_text().splitlines():
    if line and not line.startswith("#"):
        key, value = line.split("=", 1)
        os.environ[key] = value

with psycopg.connect(os.environ["USINAS_SOURCE_DATABASE_URL"], row_factory=dict_row) as source:
    row = source.execute("""
        SELECT current_database() AS db,
               current_setting('transaction_read_only') AS read_only,
               (SELECT ssl FROM pg_stat_ssl WHERE pid=pg_backend_pid()) AS ssl,
               has_table_privilege(current_user, 'public.tbl_receitas', 'SELECT') AS can_select,
               has_table_privilege(current_user, 'public.tbl_receitas', 'INSERT') AS can_insert,
               has_table_privilege(current_user, 'public.tbl_receitas', 'UPDATE') AS can_update,
               has_table_privilege(current_user, 'public.tbl_receitas', 'DELETE') AS can_delete,
               has_schema_privilege(current_user, 'public', 'CREATE') AS inherited_create,
               (SELECT count(*) FROM public.tbl_receitas) AS count
    """).fetchone()
    assert row["db"] == "supervisorio_db"
    assert row["read_only"] == "on"
    assert row["ssl"] and row["can_select"]
    assert not any(row[key] for key in ("can_insert", "can_update", "can_delete"))
    print("origem: SSL verificado, SELECT na tabela, DML negado, "
          f"CREATE herdado={row['inherited_create']}, linhas={row['count']}")

with psycopg.connect(os.environ["USINAS_HOMOLOG_DATABASE_URL"], row_factory=dict_row) as target:
    row = target.execute("""
        SELECT current_database() AS db,
               has_table_privilege(current_user, 'usinas.receitas', 'SELECT') AS can_select,
               has_table_privilege(current_user, 'usinas.receitas', 'INSERT') AS can_insert,
               has_schema_privilege(current_user, 'usinas_write', 'USAGE') AS can_outbox_insert
    """).fetchone()
    assert row["db"] == "mapa_unificado_homolog_20261016"
    assert row["can_select"] and row["can_insert"]
    assert not row["can_outbox_insert"]
    print("destino: banco homolog, DML no espelho, sem INSERT na outbox")
