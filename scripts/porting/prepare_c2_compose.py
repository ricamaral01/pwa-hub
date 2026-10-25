"""Prepare the C2 Compose candidate without printing configuration values."""
from __future__ import annotations

import os
import re
from pathlib import Path


SOURCE = Path("/opt/ged_concrefer/docker-compose.yml")
TARGET = Path("/root/ged-c2-20261015/docker-compose.yml")
ACTIVE = Path("/root/ged-c2-20261015/docker-compose.readonly.yml")
IMAGES = {
    "backend": ("ged-concrefer-backend:a5-pdf-isolated", "ged-concrefer-backend:c2-prepared"),
    "frontend": ("ged-concrefer-frontend:a5-pdf-warning-v3", "ged-concrefer-frontend:c2-prepared"),
}


def main() -> None:
    source = SOURCE.read_text(encoding="utf-8")
    updated = source
    for service, (before, after) in IMAGES.items():
        match = re.search(rf"(?ms)^  {service}:\n(.*?)(?=^  [a-z_]+:|\Z)", updated)
        if not match:
            raise ValueError("Serviço esperado ausente")
        block = match.group(0)
        if block.count(f"image: {before}") != 1 or block.count("    environment:\n") != 1:
            raise ValueError("Imagem ou seção de ambiente divergiu")
        if "GED_RNC_READONLY" in block:
            raise ValueError("Chave C2 já presente; revisar antes de gerar candidato")
        block = block.replace(f"image: {before}", f"image: {after}")
        block = block.replace("    environment:\n", '    environment:\n      GED_RNC_READONLY: "${GED_RNC_READONLY:-0}"\n', 1)
        updated = updated[:match.start()] + block + updated[match.end():]
    if updated == source:
        raise ValueError("Candidato sem alterações")
    TARGET.write_text(updated, encoding="utf-8")
    os.chmod(TARGET, 0o600)
    readonly = updated.replace('GED_RNC_READONLY: "${GED_RNC_READONLY:-0}"', 'GED_RNC_READONLY: "1"')
    if readonly == updated or readonly.count('GED_RNC_READONLY: "1"') != 2:
        raise ValueError("Compose C2 ativo incompleto")
    ACTIVE.write_text(readonly, encoding="utf-8")
    os.chmod(ACTIVE, 0o600)
    print("Dois candidatos Compose C2 preparados: chave 0 e chave 1 persistente.")


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"Falha ao preparar Compose C2: {type(error).__name__}")
        raise SystemExit(1) from None
