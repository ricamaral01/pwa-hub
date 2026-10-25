"""Provision the private reports database role and root-owned environment file.

Run as root on the new VPS. The generated password stays off command lines and logs.
"""

from __future__ import annotations

import os
import grp
from pathlib import Path
import secrets
import subprocess


ENV_FILE = Path("/etc/concrefer/usinas-reporting.env")


def main():
    if os.geteuid() != 0:
        raise SystemExit("Run as root")
    if ENV_FILE.exists():
        print("Reporting environment already exists; no change")
        return
    password = secrets.token_hex(32)
    sql = f"""
BEGIN;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='usinas_reporting_ro') THEN
    CREATE ROLE usinas_reporting_ro LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT;
  END IF;
END $$;
ALTER ROLE usinas_reporting_ro PASSWORD '{password}';
ALTER ROLE usinas_reporting_ro SET default_transaction_read_only=on;
GRANT CONNECT ON DATABASE mapa_unificado_teste TO usinas_reporting_ro;
GRANT USAGE ON SCHEMA usinas_reporting TO usinas_reporting_ro;
GRANT SELECT ON ALL TABLES IN SCHEMA usinas_reporting TO usinas_reporting_ro;
GRANT SELECT ON usinas.sync_status TO usinas_reporting_ro;
COMMIT;
"""
    subprocess.run(
        ["runuser", "-u", "postgres", "--", "psql", "-X", "-q",
         "-v", "ON_ERROR_STOP=1", "-d", "mapa_unificado_teste"],
        input=sql, text=True, check=True, capture_output=True,
    )
    ENV_FILE.parent.mkdir(mode=0o750, parents=True, exist_ok=True)
    flags = os.O_WRONLY | os.O_CREAT | os.O_EXCL
    fd = os.open(ENV_FILE, flags, 0o640)
    os.fchown(fd, 0, grp.getgrnam("usinas-reports").gr_gid)
    with os.fdopen(fd, "w", encoding="utf-8") as file:
        file.write(
            "USINAS_REPORTING_DATABASE_URL="
            f"postgresql://usinas_reporting_ro:{password}@127.0.0.1:5432/mapa_unificado_teste\n"
        )
    print("Reporting role and environment created")


if __name__ == "__main__":
    main()
