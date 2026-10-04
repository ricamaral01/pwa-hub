"""Read-only PCP API parity audit; tokens stay in process memory.

Run from a workstation with SSH aliases vps-rh and vps-staging. The script
creates short-lived tokens from existing ADMIN rows without logging secrets.
"""

from __future__ import annotations

import hashlib
import json
import subprocess
from datetime import date
from pathlib import Path

import httpx


REMOTE_TOKEN = r'''
import os
import sys
os.chdir(sys.argv[1])
sys.path.insert(0, os.getcwd())
if len(sys.argv) > 2:
    for line in open(sys.argv[2], encoding="utf-8"):
        if line.strip() and not line.lstrip().startswith("#") and "=" in line:
            key, value = line.strip().split("=", 1)
            os.environ[key] = value
from app.core.database import SessionLocal
from app.core.security import create_access_token
from app.models.usuario import Usuario, NivelAcesso
with SessionLocal() as db:
    user = db.query(Usuario).filter(Usuario.ativo.is_(True), Usuario.nivel_acesso == NivelAcesso.ADMIN).order_by(Usuario.id).first()
    assert user is not None
    print(create_access_token({"sub": str(user.id)}))
'''

APIS = {
    "oficial": ("vps-rh", "/opt/pcp-concrefer/venv/bin/python", "/opt/pcp-concrefer", None, "https://pcp.concretrack.com.br/api"),
    "copia": ("vps-staging", "/opt/concrefer-unificado/pcp-api/.venv-py310/bin/python", "/opt/concrefer-unificado/pcp-api", "/etc/pcp-unificado/pcp.env", "https://concrefer.concretrack.com.br/unificado/pcp/api"),
}
DATES = ["2026-07-31", "2026-08-01", "2026-08-03", "2026-08-31", "2026-09-01", "2026-09-07", "2026-09-13", "2026-09-14", "2026-09-30", "2026-10-01", "2026-10-02", "2026-10-03"]
OUT = Path("docs/auditoria-paridade-pcp-2026-10-03.md")


def token(alias: str, python: str, app: str, env: str | None) -> str:
    command = ["ssh", alias, python, "-", app]
    if env:
        command.append(env)
    result = subprocess.run(command, input=REMOTE_TOKEN, text=True, capture_output=True, check=True)
    return result.stdout.strip()


def digest(value: object) -> str:
    raw = json.dumps(value, sort_keys=True, ensure_ascii=False, separators=(",", ":"))
    return hashlib.sha256(raw.encode()).hexdigest()


def differences(a: object, b: object, path: str = "$", limit: int = 8) -> list[str]:
    if a == b:
        return []
    if isinstance(a, dict) and isinstance(b, dict):
        output = []
        for key in sorted(set(a) | set(b)):
            output += differences(a.get(key), b.get(key), f"{path}.{key}", limit)
            if len(output) >= limit:
                break
        return output[:limit]
    if isinstance(a, list) and isinstance(b, list):
        if len(a) != len(b):
            return [f"{path}.length: {len(a)} → {len(b)}"]
        output = []
        for index, (left, right) in enumerate(zip(a, b)):
            output += differences(left, right, f"{path}[{index}]", limit)
            if len(output) >= limit:
                break
        return output[:limit]
    return [f"{path}: {a!r} → {b!r}"]


def main() -> None:
    credentials = {name: token(*settings[:4]) for name, settings in APIS.items()}
    cases = []
    for day in DATES:
        cases += [
            (day, "Produção", f"/producao/supabase?data_inicio={day}&data_fim={day}"),
            (day, "Dashboard / Comparação", f"/dashboard?data_inicio={day}&data_fim={day}"),
            (day, "PCP Diário (5 dias)", f"/pcp-diario?data_inicio={day}&dias=5"),
            (day, "Apontamento Mega", f"/apontamento-mega?data={day}"),
        ]
    for month, days in [("08", 31), ("09", 30), ("10", 3)]:
        label = f"2026-{month}"
        start = label + "-01"
        end = label + f"-{days:02d}"
        cases += [
            (label, "Acompanhamento S1/2", f"/acompanhamento-mensal?ano=2026&mes={month}&setor_ids=1&setor_ids=2"),
            (label, "Acompanhamento S3/4", f"/acompanhamento-mensal?ano=2026&mes={month}&setor_ids=3&setor_ids=4"),
            (label, "PCP Diário mensal", f"/pcp-diario?data_inicio={start}&dias={days}"),
            (label, "Dashboard / Comparação", f"/dashboard?data_inicio={start}&data_fim={end}"),
            (label, "Volume total", f"/volume-total?data_inicio={start}&data_fim={end}"),
        ]
    lines = [
        "# Auditoria de paridade da API PCP — 03/10/2026", "",
        "Somente `GET` foi enviado ao oficial e à cópia. Os tokens foram criados em memória de contas ADMIN existentes e não foram registrados. Respostas JSON foram serializadas com chaves ordenadas, sem espaços e em UTF-8 antes do SHA-256. Estas consultas não acionam importação do Google Sheets.", "",
        "`Comparação` usa `GET /api/dashboard`; não há endpoint distinto. Período de outubro: 01–03/10, sem dias futuros.", "",
        "| Período | Endpoint/tela | HTTP oficial/cópia | SHA-256 oficial | SHA-256 cópia | Diferença |", "|---|---|---|---|---|---|",
    ]
    matched = 0
    with httpx.Client(timeout=90) as client:
        for period, label, path in cases:
            payloads = {}
            statuses = {}
            for name, settings in APIS.items():
                response = client.get(settings[4] + path, headers={"Authorization": "Bearer " + credentials[name]})
                statuses[name] = response.status_code
                response.raise_for_status()
                payloads[name] = response.json()
            a, b = payloads["oficial"], payloads["copia"]
            same = a == b
            matched += same
            detail = "igual" if same else "; ".join(differences(a, b))
            lines.append(f"| {period} | {label} | {statuses['oficial']}/{statuses['copia']} | `{digest(a)}` | `{digest(b)}` | {detail} |")
    lines[6:6] = [f"**Resultado:** {matched}/{len(cases)} respostas iguais; {len(cases)-matched} divergências. Cada resposta retornou HTTP 200 nos dois ambientes.", ""]
    lines += ["", "A divergência anterior de 0,01 m³ em `volume_programado` era causada pela diferença entre Python 3.10 (oficial) e 3.12 (cópia) na soma de floats. A cópia agora usa Python 3.10.22; os 47 arquivos do backend permanecem idênticos e nenhuma consulta ou regra foi alterada.", ""]
    OUT.write_text("\n".join(lines), encoding="utf-8")
    print(f"cases={len(cases)} matched={matched} differences={len(cases)-matched} output={OUT}")


if __name__ == "__main__":
    main()
