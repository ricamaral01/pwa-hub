"""Second protection for the A1 backup key. No password or plaintext artifact is stored.

`prepare` prompts locally, unwraps the existing DPAPI key once and rewraps
that same key with scrypt + AES-256-GCM. `copy` transfers only the wrapper and
three already encrypted artifacts to root-only storage. `verify` prompts
locally and uses only the password wrapper; it never reads key.dpapi or calls
Windows DPAPI.
"""
from __future__ import annotations

import base64
import getpass
import hashlib
import io
import json
import os
import shlex
import subprocess
import sys
import tarfile
import time
from pathlib import Path

from cryptography.hazmat.primitives.ciphers.aead import AESGCM

PRIVATE = Path.home() / ".codex" / "private-backups" / "ged-a1-2026-10-15"
REMOTE = "/root/concrefer-backups/ged-a1-2026-10-15"
REMOTE_ENDPOINT = "2.25.163.32:22"
FILES = ("ged_concrefer.pg_dump.Fc.aesgcm", "backend_uploads.tar.aesgcm", "config_secrets.tar.aesgcm")
AAD = b"ged-a1-key-password-wrap-v1"


def ssh(*args: str, data: bytes | None = None) -> bytes:
    try:
        proc = subprocess.run(["ssh", "vps-staging", shlex.join(args)], input=data,
                              capture_output=True, timeout=180, check=True)
    except (subprocess.CalledProcessError, subprocess.TimeoutExpired, OSError) as exc:
        raise ConnectionError(f"{type(exc).__name__} em {REMOTE_ENDPOINT}") from None
    return proc.stdout


def decrypt_artifact(filename: str, key: bytes) -> bytes:
    blob = (PRIVATE / (filename + ".aesgcm")).read_bytes()
    return AESGCM(key).decrypt(blob[:12], blob[12:], filename.encode())


def wrap_key(key: bytes, password: str) -> bytes:
    salt, nonce = os.urandom(16), os.urandom(12)
    wrapping_key = hashlib.scrypt(password.encode(), salt=salt, n=2**17, r=8, p=1, dklen=32, maxmem=256*1024*1024)
    cipher = AESGCM(wrapping_key).encrypt(nonce, key, AAD)
    return json.dumps({"version": 1, "kdf": "scrypt", "n": 2**17, "r": 8, "p": 1,
                       "salt": base64.b64encode(salt).decode(),
                       "nonce": base64.b64encode(nonce).decode(),
                       "ciphertext": base64.b64encode(cipher).decode()}, sort_keys=True).encode()


def unwrap_key(password: str) -> bytes:
    payload = json.loads((PRIVATE / "key.password-wrap.json").read_bytes())
    if (payload["version"], payload["kdf"], payload["n"], payload["r"], payload["p"]) != (1, "scrypt", 2**17, 8, 1):
        raise ValueError("Parâmetros inesperados do invólucro da chave")
    salt = base64.b64decode(payload["salt"])
    nonce = base64.b64decode(payload["nonce"])
    wrapping_key = hashlib.scrypt(password.encode(), salt=salt, n=2**17, r=8, p=1, dklen=32, maxmem=256*1024*1024)
    return AESGCM(wrapping_key).decrypt(nonce, base64.b64decode(payload["ciphertext"]), AAD)


def prepare() -> None:
    password = getpass.getpass("Senha da segunda proteção A1: ")
    if password != getpass.getpass("Repita a senha: "):
        raise ValueError("Senhas diferentes")
    if len(password) < 20:
        raise ValueError("Use pelo menos 20 caracteres")
    sys.path.insert(0, str(PRIVATE))
    from a1_run import unprotect_key  # DPAPI is used only in this preparation step.
    key = unprotect_key()
    wrapper = PRIVATE / "key.password-wrap.json"
    if wrapper.exists():
        raise FileExistsError("Proteção por senha já existe; preservar a cópia atual")
    with wrapper.open("xb") as output:
        output.write(wrap_key(key, password))
    os.chmod(wrapper, 0o600)
    print("Proteção local criada. A senha não foi gravada; iniciar copy separadamente.")


def copy() -> None:
    wrapper = PRIVATE / "key.password-wrap.json"
    paths = (wrapper, *(PRIVATE / name for name in FILES))
    if any(not path.is_file() for path in paths):
        raise FileNotFoundError("Invólucro ou artefato cifrado A1 ausente")
    if ssh("id", "-u").decode().strip() != "0":
        raise PermissionError("A conexão VPS precisa usar root")
    ssh("install", "-d", "-m", "0700", REMOTE)
    for path in (wrapper, *(PRIVATE / name for name in FILES)):
        try:
            subprocess.run(["scp", str(path), f"vps-staging:{REMOTE}/{path.name}"],
                           capture_output=True, timeout=180, check=True)
        except (subprocess.CalledProcessError, subprocess.TimeoutExpired, OSError) as exc:
            raise ConnectionError(f"{type(exc).__name__} em {REMOTE_ENDPOINT}") from None
        ssh("chmod", "0600", f"{REMOTE}/{path.name}")
        local_sha = hashlib.sha256(path.read_bytes()).hexdigest()
        remote_sha = ssh("sha256sum", f"{REMOTE}/{path.name}").decode().split()[0]
        remote_mode = ssh("stat", "-c", "%a", f"{REMOTE}/{path.name}").decode().strip()
        if local_sha != remote_sha or remote_mode != "600":
            raise ValueError(f"Cópia remota divergente: {path.name}")
    if ssh("stat", "-c", "%a", REMOTE).decode().strip() != "700":
        raise ValueError("Diretório remoto A1 não está restrito a root")
    print("Invólucro e três artefatos cifrados copiados e conferidos; iniciar verify sem DPAPI.")


def verify() -> None:
    password = getpass.getpass("Senha da segunda proteção A1: ")
    key = unwrap_key(password)
    if len(key) != 32:
        raise ValueError("Chave inesperada")
    for filename in ("key.password-wrap.json", *FILES):
        local_sha = hashlib.sha256((PRIVATE / filename).read_bytes()).hexdigest()
        remote_sha = ssh("sha256sum", f"{REMOTE}/{filename}").decode().split()[0]
        if local_sha != remote_sha:
            raise ValueError(f"Cópia remota divergente: {filename}")
    dump = decrypt_artifact("ged_concrefer.pg_dump.Fc", key)
    uploads = decrypt_artifact("backend_uploads.tar", key)
    config = decrypt_artifact("config_secrets.tar", key)
    name = f"ged-a1-password-restore-{int(time.time())}"
    ssh("docker", "run", "-d", "--name", name, "--network", "none",
        "--tmpfs", "/var/lib/postgresql/data:rw,size=256m", "-e",
        "POSTGRES_HOST_AUTH_METHOD=trust", "postgres:16-alpine")
    try:
        ready = False
        for _ in range(60):
            try:
                ssh("docker", "exec", name, "pg_isready", "-U", "postgres")
                ready = True
                break
            except ConnectionError:
                time.sleep(1)
        if not ready:
            raise TimeoutError("PostgreSQL temporário não ficou pronto")
        ssh("docker", "exec", name, "createdb", "-U", "postgres", "restore_check")
        ssh("docker", "exec", "-i", name, "pg_restore", "-U", "postgres", "-d", "restore_check",
            "--no-owner", "--no-acl", "--exit-on-error", data=dump)
        table_count = ssh("docker", "exec", name, "psql", "-U", "postgres", "-d", "restore_check",
                          "-At", "-c", "select count(*) from information_schema.tables where table_schema='public' and table_type='BASE TABLE'").decode().strip()
    finally:
        ssh("docker", "rm", "-f", name)
    with tarfile.open(fileobj=io.BytesIO(uploads)) as tar:
        upload_count = sum(member.isfile() for member in tar)
    with tarfile.open(fileobj=io.BytesIO(config)) as tar:
        config_count = sum(member.isfile() for member in tar)
    if int(table_count) != 29 or upload_count != 52 or config_count < 2:
        raise ValueError(f"Restauração divergente: tabelas={table_count}, uploads={upload_count}, configuração={config_count}")
    print(f"Restauração sem DPAPI validada: {table_count} tabelas, {upload_count} uploads e {config_count} arquivos de configuração.")


if __name__ == "__main__":
    try:
        {"prepare": prepare, "copy": copy, "verify": verify}[sys.argv[1]]()
    except Exception as exc:
        print(f"Falha A1: {type(exc).__name__}" +
              (f" em {REMOTE_ENDPOINT}" if isinstance(exc, ConnectionError) else ""),
              file=sys.stderr)
        sys.exit(1)
