"""Print only database/user from the running production Mapa process DSN."""

import os
import subprocess

from psycopg.conninfo import conninfo_to_dict

pid = subprocess.check_output(
    ["systemctl", "show", "-p", "MainPID", "--value", "mapa-unificado-auth.service"],
    text=True,
).strip()
environ = dict(item.split(b"=", 1) for item in open(f"/proc/{pid}/environ", "rb").read().split(b"\0") if b"=" in item)
dsn = environ[b"MAPA_AUTH_DATABASE_URL"].decode()
parsed = conninfo_to_dict(dsn)
print("database", parsed.get("dbname") or parsed.get("database"))
print("user", parsed.get("user"))
