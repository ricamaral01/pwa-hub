"""Check the auth service's isolated PCP DB grant without exposing the DSN."""

from pathlib import Path
import sys

import psycopg


def main() -> None:
    raw = [line.partition("=")[2] for line in
           Path("/etc/mapa-unificado/unified-auth.env").read_text().splitlines()
           if line.startswith("UNIFICADO_PCP_DATABASE_URL=")]
    assert len(raw) == 1
    dsn = raw[0].strip().strip('"').strip("'")
    for prefix in ("postgresql+psycopg://", "postgresql+psycopg2://"):
        if dsn.startswith(prefix):
            dsn = "postgresql://" + dsn[len(prefix):]
    with psycopg.connect(dsn, connect_timeout=5) as connection:
        with connection.cursor() as cursor:
            cursor.execute("SELECT count(*) FROM public.usuarios")
            total = cursor.fetchone()[0]
    print(f"pcp_test_auth_db=ok users={total}")


if __name__ == "__main__":
    main()
