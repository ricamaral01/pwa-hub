"""Provision one explicitly requested local administrator from a one-time hash file.

Run as the ctdosagem service account. The plaintext password never enters a
release, shell argument, log, or database record.
"""

import argparse
from pathlib import Path

from sqlalchemy import select

from .db import get_sessionmaker
from .modelos import LocalCredencial, Usuario


def provision(email: str, name: str, hash_path: Path) -> bool:
    email = email.strip().lower()
    if not email or "@" not in email:
        raise ValueError("Invalid email")
    if not hash_path.exists():
        return False  # A completed one-shot service may run again after reboot.
    password_hash = hash_path.read_text(encoding="ascii").strip()
    if not password_hash.startswith("$argon2id$"):
        raise ValueError("Expected an Argon2id password hash")
    created = False
    with get_sessionmaker().begin() as session:
        if session.scalar(select(Usuario.email).where(Usuario.email == email)):
            existing = session.get(LocalCredencial, email)
            if not existing or existing.senha_hash != password_hash:
                raise ValueError("Account already exists; refusing to overwrite it")
        else:
            session.add(Usuario(email=email, nome=name, papel="admin", unidades=["*"], ativo=True))
            session.flush()
            session.add(LocalCredencial(email=email, senha_hash=password_hash, trocar_senha=True))
            created = True
    hash_path.unlink()
    return created


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--email", required=True)
    parser.add_argument("--name", required=True)
    parser.add_argument("--hash-file", type=Path, required=True)
    args = parser.parse_args()
    print("Local administrator created" if provision(args.email, args.name, args.hash_file) else "Already provisioned")
