"""Repair product labels imported as cp1252 although the seed is UTF-8.

Revision ID: a6c_20261030
Revises: a6b_20261029
"""
from __future__ import annotations

import csv
from pathlib import Path

from alembic import op
from sqlalchemy import text

revision = "a6c_20261030"
down_revision = "a6b_20261029"
branch_labels = None
depends_on = None


def _rows():
    seed = Path(__file__).resolve().parents[2] / "data" / "aco_produto_seed.csv"
    with seed.open(encoding="utf-8", newline="") as source:
        yield from csv.DictReader(source)


def _damaged(value: str) -> str:
    return value.encode("utf-8").decode("cp1252")


def _apply(reverse: bool) -> None:
    bind = op.get_bind()
    for row in _rows():
        params = {"codigo": int(row["codigo"])}
        for column in ("grupo_consumo", "descricao"):
            original = row[column]
            damaged = _damaged(original)
            if original == damaged:
                continue
            params.update(old=original if reverse else damaged,
                          new=damaged if reverse else original)
            bind.execute(text(f"""UPDATE armacao.aco_produto SET {column}=:new
                                WHERE codigo=:codigo AND {column}=:old"""), params)


def upgrade() -> None:
    _apply(False)


def downgrade() -> None:
    _apply(True)
