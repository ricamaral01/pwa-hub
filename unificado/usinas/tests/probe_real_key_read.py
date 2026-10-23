"""Verify duplicate-key preflight on the official source without printing names."""

import os

import psycopg

from write_preflight import check_new_recipe_key


source_dsn = os.environ["USINAS_SOURCE_DATABASE_URL"]
with psycopg.connect(source_dsn, connect_timeout=5,
                     options="-c default_transaction_read_only=on") as conn:
    existing = conn.execute(
        "SELECT nome_traco FROM public.tbl_receitas ORDER BY id LIMIT 1"
    ).fetchone()[0]

check = check_new_recipe_key(source_dsn, existing)
assert not check["available"] and check["existing_ids"]
print("Chave existente detectada na origem: OK")

missing = check_new_recipe_key(source_dsn, "__USINAS_PREFLIGHT_DOES_NOT_EXIST_20261022__")
assert missing == {"available": True, "existing_ids": []}
print("Chave ausente confirmada na origem: OK")
