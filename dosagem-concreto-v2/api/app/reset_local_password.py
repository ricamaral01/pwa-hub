"""Reset an existing local administrator from a one-time Argon2id hash file."""

import argparse
from pathlib import Path

from .db import get_sessionmaker
from .modelos import Auditoria, LocalCredencial, Usuario


def reset(email: str, hash_path: Path) -> None:
    email = email.strip().lower()
    password_hash = hash_path.read_text(encoding="ascii").strip()
    if not password_hash.startswith("$argon2id$"):
        raise ValueError("Expected an Argon2id password hash")

    with get_sessionmaker().begin() as session:
        user = session.get(Usuario, email, with_for_update=True)
        credential = session.get(LocalCredencial, email, with_for_update=True)
        if not user or not credential or not user.ativo or user.papel != "admin":
            raise ValueError("Active local administrator not found")
        credential.senha_hash = password_hash
        credential.trocar_senha = True
        credential.falhas = 0
        credential.bloqueado_ate = None
        session.add(Auditoria(
            email=email,
            acao="usuarios.senhaLocalRedefinida",
            tipo="usuarios",
            documento_id=email,
            depois={"trocar_senha": True},
        ))

    hash_path.unlink()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--email", required=True)
    parser.add_argument("--hash-file", type=Path, required=True)
    args = parser.parse_args()
    reset(args.email, args.hash_file)
    print("Local administrator password reset")
