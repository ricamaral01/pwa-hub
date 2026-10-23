"""Read-only preflight against the authoritative Campinas recipe table.

This module never dispatches a legacy API request. A successful preflight is
necessary for a new recipe, but not sufficient to make the unchanged legacy
POST atomic or idempotent.
"""

from __future__ import annotations

import re

import psycopg
from psycopg.rows import dict_row


def validate_name(name: str) -> str:
    if not isinstance(name, str):
        raise ValueError("Nome do traço inválido")
    display = re.sub(r"\s+", " ", name.strip())
    if not display or len(display) > 160:
        raise ValueError("Nome do traço deve ter entre 1 e 160 caracteres")
    return display


def recipe_key_matches(source_dsn: str, name: str,
                       expected_source_db: str = "supervisorio_db") -> list[dict]:
    """Return authoritative rows with the same case/space normalized name."""
    display = validate_name(name)
    with psycopg.connect(source_dsn, row_factory=dict_row, connect_timeout=5,
                         options="-c default_transaction_read_only=on") as conn:
        with conn.transaction():
            conn.execute("SET TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY")
            database = conn.execute("SELECT current_database() AS name").fetchone()["name"]
            if database != expected_source_db:
                raise RuntimeError("Banco de origem inesperado")
            return conn.execute("""
                SELECT id, nome_traco, revisao_grupo, revisao_numero, ativa
                FROM public.tbl_receitas
                WHERE upper(regexp_replace(btrim(nome_traco),'[[:space:]]+',' ','g'))
                    = upper(regexp_replace(btrim(%s),'[[:space:]]+',' ','g'))
                ORDER BY revisao_numero DESC, id DESC
            """, (display,)).fetchall()


def check_new_recipe_key(source_dsn: str, name: str,
                         expected_source_db: str = "supervisorio_db") -> dict:
    """Reject new groups if a name already exists in any revision or group."""
    matches = recipe_key_matches(source_dsn, name, expected_source_db)
    return {"available": not matches, "existing_ids": [row["id"] for row in matches]}
