"""Carry only the read-only source credential to a separate prod sync env."""

from pathlib import Path
import os
import grp


source = Path("/etc/concrefer/usinas-homolog.env")
target = Path("/etc/concrefer/usinas-prod.env")
if target.exists():
    raise RuntimeError("Ambiente de produção já existe; não substituir")
lines = source.read_text(encoding="utf-8").splitlines()
source_dsn = [line for line in lines if line.startswith("USINAS_SOURCE_DATABASE_URL=")]
if len(source_dsn) != 1:
    raise RuntimeError("Credencial de leitura da origem não encontrada")
content = "\n".join([
    source_dsn[0],
    "USINAS_TARGET_DATABASE_URL=dbname=mapa_unificado_teste",
    "USINAS_EXPECTED_SOURCE_DB=supervisorio_db",
    "USINAS_EXPECTED_TARGET_DB=mapa_unificado_teste",
    "",
])
fd = os.open(target, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o640)
with os.fdopen(fd, "w", encoding="utf-8") as handle:
    handle.write(content)
os.chown(target, 0, grp.getgrnam("usinas-sync").gr_gid)
print("Ambiente de produção criado sem exibir credenciais")
