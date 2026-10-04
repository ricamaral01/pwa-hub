"""Create/remove a short-lived PCP-only account in the isolated test DB."""

from __future__ import annotations

import argparse
import os
from pathlib import Path
import secrets
import sys


FILE = Path("/etc/mapa-unificado/pcp-auth-probe.env")
LOGIN = "e2e-pcp-probe"


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("action", choices=("create", "cleanup"))
    parser.add_argument("--first-access", action="store_true")
    parser.add_argument("--short-existing", action="store_true")
    parser.add_argument("--role", choices=("ADMIN", "PCP", "PRODUCAO", "CONSULTA"),
                        default="CONSULTA")
    args = parser.parse_args()
    action = args.action
    for path in ("/etc/mapa-unificado/auth.env", "/etc/mapa-unificado/unified-auth.env"):
        for line in Path(path).read_text().splitlines():
            if line.strip() and not line.lstrip().startswith("#") and "=" in line:
                key, value = line.strip().split("=", 1)
                os.environ[key] = value.strip().strip('"').strip("'")
    sys.path.insert(0, "/opt/concrefer-unificado/mapa-api")
    from unified_auth import PCP_HASHER, pcp_connect

    if action == "create":
        if FILE.exists():
            raise RuntimeError("Probe credential already exists")
        password = secrets.token_hex(2) if args.short_existing else secrets.token_urlsafe(24)
        with pcp_connect() as conn, conn.cursor() as cursor:
            cursor.execute("""INSERT INTO public.usuarios
              (nome,username,email,senha_hash,nivel_acesso,ativo,trocar_senha_primeiro_acesso)
              VALUES (%s,%s,%s,%s,%s,true,%s)""",
              ("Conta Sintética PCP", LOGIN, LOGIN + "@local.invalid",
               PCP_HASHER.hash(password), args.role, args.first_access))
        fd = os.open(FILE, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
        with os.fdopen(fd, "w") as stream:
            stream.write(f"PCP_TEST_USER={LOGIN}\nPCP_TEST_PASSWORD={password}\n")
        print(f"pcp_auth_probe=created role={args.role}")
    else:
        with pcp_connect() as conn, conn.cursor() as cursor:
            cursor.execute("DELETE FROM public.usuarios WHERE username=%s", (LOGIN,))
            removed = cursor.rowcount
        FILE.unlink(missing_ok=True)
        print(f"pcp_auth_probe=removed count={removed}")


if __name__ == "__main__":
    main()
