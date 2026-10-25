"""Reject destructive statements from `alembic upgrade --sql` before deployment."""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path


def normalized_sql(sql: str) -> str:
    # PL/pgSQL function bodies are data in CREATE FUNCTION, not migration DML.
    sql = re.sub(r"(\$[A-Za-z_]*\$).*?\1", " ", sql, flags=re.DOTALL)
    sql = re.sub(r"/\*.*?\*/|--[^\n]*", " ", sql, flags=re.DOTALL)
    sql = re.sub(r"'(?:''|[^'])*'", "''", sql)
    return sql


def violations(sql: str) -> list[str]:
    clean = normalized_sql(sql)
    patterns = {
        "DROP": r"\bDROP\s+(?:TABLE|COLUMN|INDEX|CONSTRAINT|SEQUENCE|VIEW|FUNCTION|TRIGGER|SCHEMA)\b",
        "RENAME": r"\bRENAME\s+(?:COLUMN|TABLE|TO)\b",
        "TRUNCATE": r"\bTRUNCATE\b",
        "DELETE": r"\bDELETE\s+FROM\b",
        "ALTER TYPE": r"\bALTER\s+(?:TABLE\s+\S+\s+)?COLUMN\s+\S+\s+TYPE\b",
        "SET NOT NULL": r"\bALTER\s+(?:TABLE\s+\S+\s+)?COLUMN\s+\S+\s+SET\s+NOT\s+NULL\b",
    }
    found = [name for name, pattern in patterns.items() if re.search(pattern, clean, flags=re.IGNORECASE)]
    # Alembic's own version row update is constrained by version_num.
    without_version = re.sub(r"\bUPDATE\s+alembic_version\s+SET\b[^;]*;", " ", clean, flags=re.IGNORECASE)
    if re.search(r"\bUPDATE\s+\S+\s+SET\b", without_version, flags=re.IGNORECASE):
        found.append("UPDATE")
    return found


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("sql", nargs="?", help="Alembic SQL file; stdin when omitted")
    args = parser.parse_args()
    sql = Path(args.sql).read_text(encoding="utf-8") if args.sql else sys.stdin.read()
    if not sql.strip():
        print("Migração reprovada: SQL Alembic vazio", file=sys.stderr)
        return 1
    found = violations(sql)
    if found:
        print("Migração reprovada: " + ", ".join(found), file=sys.stderr)
        return 1
    print("Migração aditiva: OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
