"""Apply the approved Campinas reference row to an allowed Quality database.

Run as the local postgres OS user on the destination VPS. This helper prints no
connection details, environment, credentials, or row contents.
"""
from __future__ import annotations

import os
import sys

from alembic import command
from alembic.config import Config


ALLOWED = {"qualidade_freeze_rehearsal_20261015", "qualidade"}


def main() -> None:
    if len(sys.argv) != 2 or sys.argv[1] not in ALLOWED:
        raise ValueError("Banco fora da lista permitida")
    database = sys.argv[1]
    os.environ.pop("QUALIDADE_MIGRATION_DATABASE_URL", None)
    config = Config("/opt/qualidade/migrations/alembic.ini")
    config.set_main_option("script_location", "/opt/qualidade/migrations")
    config.set_main_option(
        "sqlalchemy.url", f"postgresql+psycopg:///{database}?host=/var/run/postgresql"
    )
    command.upgrade(config, "20261015_04")
    print("Migration Campinas aplicada")


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        cause = getattr(error, "orig", error)
        sqlstate = getattr(cause, "sqlstate", "unknown")
        constraint = getattr(getattr(cause, "diag", None), "constraint_name", "unknown")
        print(f"Falha da migration: {type(error).__name__}; SQLSTATE={sqlstate}; constraint={constraint}", file=sys.stderr)
        raise SystemExit(1) from None
