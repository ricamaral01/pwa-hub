"""Create/remove one short-lived role account in the isolated Mapa DB."""

from __future__ import annotations

import argparse
import os
from pathlib import Path
import secrets
import sys


FILE = Path("/etc/mapa-unificado/auth-probe.env")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("action", choices=("create", "cleanup"))
    parser.add_argument("--first-access", action="store_true")
    parser.add_argument("--short-existing", action="store_true")
    parser.add_argument("--role", choices=("GERENCIA", "GESTOR", "APONTADOR", "MONTADOR"),
                        default="GERENCIA")
    parser.add_argument("--sector", default="Todos")
    parser.add_argument("--name", default="")
    args = parser.parse_args()
    action = args.action
    for line in Path("/etc/mapa-unificado/auth.env").read_text().splitlines():
        if line.strip() and not line.lstrip().startswith("#") and "=" in line:
            key, value = line.strip().split("=", 1)
            os.environ[key] = value.strip().strip('"').strip("'")
    sys.path.insert(0, "/opt/concrefer-unificado/mapa-api")
    from app import connect, hasher

    if action == "create":
        if FILE.exists():
            raise RuntimeError("Probe credential already exists")
        login = f"e2e-{args.role.lower()}-probe"
        name = args.name or f"Conta Sintética {args.role.title()}"
        password = secrets.token_hex(2) if args.short_existing else secrets.token_urlsafe(24)
        with connect() as conn, conn.cursor() as cursor:
            cursor.execute("""INSERT INTO public.usuarios
              (id,nome,perfil,senha_hash,ativo,setor,primeiro_acesso)
              VALUES (%s,%s,%s,%s,true,%s,%s)""",
              (login, name, args.role, hasher.hash(password), args.sector,
               args.first_access))
        fd = os.open(FILE, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
        with os.fdopen(fd, "w") as stream:
            stream.write(f"MAPA_TEST_USER={login}\nMAPA_TEST_PASSWORD={password}\n")
        print(f"mapa_auth_probe=created role={args.role}")
    else:
        if not FILE.exists():
            print("mapa_auth_probe=removed count=0")
            return
        lines = dict(line.split("=", 1) for line in FILE.read_text().splitlines() if "=" in line)
        login = lines.get("MAPA_TEST_USER", "")
        if not login.startswith("e2e-") or not login.endswith("-probe"):
            raise RuntimeError("Unexpected probe login")
        with connect() as conn, conn.cursor() as cursor:
            cursor.execute("DELETE FROM public.usuarios WHERE id=%s", (login,))
            removed = cursor.rowcount
        FILE.unlink(missing_ok=True)
        print(f"mapa_auth_probe=removed count={removed}")


if __name__ == "__main__":
    main()
