"""Create/remove a short-lived GERENCIA account in the isolated Mapa DB."""

from __future__ import annotations

import argparse
import os
from pathlib import Path
import secrets
import sys


FILE = Path("/etc/mapa-unificado/auth-probe.env")
LOGIN = "e2e-gerencia-probe"


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("action", choices=("create", "cleanup"))
    parser.add_argument("--first-access", action="store_true")
    parser.add_argument("--short-existing", action="store_true")
    parser.add_argument("--name", default="Conta Sintética Gerência")
    args = parser.parse_args()
    action = args.action
    for line in Path("/etc/mapa-unificado/auth.env").read_text().splitlines():
        if line.strip() and not line.lstrip().startswith("#") and "=" in line:
            key, value = line.strip().split("=", 1)
            os.environ[key] = value.strip().strip('"').strip("'")
    sys.path.insert(0, "/opt/mapa-unificado-api")
    from app import connect, hasher

    if action == "create":
        if FILE.exists():
            raise RuntimeError("Probe credential already exists")
        password = secrets.token_hex(2) if args.short_existing else secrets.token_urlsafe(24)
        with connect() as conn, conn.cursor() as cursor:
            cursor.execute("""INSERT INTO public.usuarios
              (id,nome,perfil,senha_hash,ativo,setor,primeiro_acesso)
              VALUES (%s,%s,'GERENCIA',%s,true,'Todos',%s)""",
              (LOGIN, args.name, hasher.hash(password), args.first_access))
        fd = os.open(FILE, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
        with os.fdopen(fd, "w") as stream:
            stream.write(f"MAPA_TEST_USER={LOGIN}\nMAPA_TEST_PASSWORD={password}\n")
        print("mapa_auth_probe=created role=GERENCIA")
    else:
        with connect() as conn, conn.cursor() as cursor:
            cursor.execute("DELETE FROM public.usuarios WHERE id=%s", (LOGIN,))
            removed = cursor.rowcount
        FILE.unlink(missing_ok=True)
        print(f"mapa_auth_probe=removed count={removed}")


if __name__ == "__main__":
    main()
