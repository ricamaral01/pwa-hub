"""One-time provisioning for Dosagem inside the Unificado PostgreSQL instance.

Run as root on the new VPS after reviewing database and gateway paths.
Never prints generated credentials.
"""

from pathlib import Path
from urllib.parse import quote
import os
import secrets
import subprocess


DATABASE = "mapa_unificado_teste"
ROLE = "dosagem_native_app"
ENV = Path("/etc/concrefer-unificado/dosagem-native.env")
GATEWAY_ENV = Path("/etc/concrefer-unificado/lab-map.env")


def run_psql(sql: str) -> None:
    subprocess.run(["runuser", "-u", "postgres", "--", "psql", "-v", "ON_ERROR_STOP=1", "-d", DATABASE],
                   input=sql, text=True, check=True, stdout=subprocess.DEVNULL)


def env_value(path: Path, key: str) -> str:
    for line in path.read_text().splitlines():
        if line.startswith(key + "="):
            return line.split("=", 1)[1].strip().strip('"\'')
    raise RuntimeError(f"Missing {key} in {path}")


def main() -> None:
    if os.geteuid() != 0:
        raise RuntimeError("Run as root")
    if ENV.exists():
        raise RuntimeError(f"Refusing to replace existing {ENV}")
    gateway_key = env_value(GATEWAY_ENV, "LAB_GATEWAY_SIGNING_KEY")
    if len(gateway_key) < 32:
        raise RuntimeError("Gateway signing key is too short")
    password = secrets.token_urlsafe(36)
    run_psql(f"CREATE ROLE {ROLE} LOGIN PASSWORD '{password}';\n"
             f"GRANT CONNECT ON DATABASE {DATABASE} TO {ROLE};\n"
             f"CREATE SCHEMA dosagem AUTHORIZATION {ROLE};\n")
    ENV.parent.mkdir(parents=True, exist_ok=True)
    db_url = f"postgresql+psycopg://{ROLE}:{quote(password)}@127.0.0.1:5432/{DATABASE}"
    ENV.write_text(f"AMBIENTE=prod\nDATABASE_URL={db_url}\nDATABASE_SCHEMA=dosagem\n"
                   f"LAB_GATEWAY_SIGNING_KEY={gateway_key}\nMODO_PILOTO=false\n")
    ENV.chmod(0o600)
    print(f"Created schema dosagem in {DATABASE} and protected service environment")


if __name__ == "__main__":
    main()
