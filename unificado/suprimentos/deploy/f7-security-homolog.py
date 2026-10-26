"""Leitura de configuração sensível de homologação sem revelar valores."""
from __future__ import annotations

import json
import os
import pwd
import stat
from pathlib import Path

if os.environ.get("SUPRIMENTOS_ENVIRONMENT") != "homolog":
    raise RuntimeError("Somente homologação")
root = Path(os.environ["SUPRIMENTOS_UPLOAD_DIR"]).resolve()
public = Path(os.environ["SUPRIMENTOS_PUBLIC_DIR"]).resolve()
if not root.is_dir() or root == public or public in root.parents:
    raise RuntimeError("Anexos ausentes ou sob webroot")
mode = stat.S_IMODE(root.stat().st_mode)
if mode & 0o007:
    raise RuntimeError("Diretório de anexos acessível por outros")
owner = pwd.getpwuid(root.stat().st_uid).pw_name
if owner != "concrefer-suprimentos":
    raise RuntimeError("Dono de anexos diferente do usuário de serviço")
print("F7_PRIVATE_STORAGE_OK", json.dumps({"fora_do_webroot": True,
      "modo_octal": oct(mode), "dono_servico": True}))
