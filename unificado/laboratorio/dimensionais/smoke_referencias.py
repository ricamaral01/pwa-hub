"""Read-only internal smoke of the installed pole reference API.

Runs on the new VPS as root. Never prints the gateway signing key or assertion.
"""
from __future__ import annotations

import base64
import hashlib
import hmac
import json
from pathlib import Path
import shlex
import sys
import time
from urllib.request import Request, urlopen


def signing_key(path: Path) -> str:
    for line in path.read_text(encoding="utf-8").splitlines():
        if line.startswith("LAB_GATEWAY_SIGNING_KEY="):
            value = line.partition("=")[2].strip()
            return shlex.split(value)[0] if value else ""
    raise RuntimeError("Gateway signing key not configured")


def main() -> None:
    port = int(sys.argv[1])
    secret = signing_key(Path(sys.argv[2]))
    if len(secret) < 32:
        raise RuntimeError("Gateway signing key invalid")
    payload = {"id": "smoke-a1a2", "name": "Smoke A1 A2", "role": "admin",
               "exp": int(time.time()) + 20}
    encoded = base64.urlsafe_b64encode(json.dumps(payload, separators=(",", ":")).encode()).rstrip(b"=").decode()
    signature = base64.urlsafe_b64encode(hmac.new(secret.encode(), encoded.encode(), hashlib.sha256).digest()).rstrip(b"=").decode()
    header = {"X-Lab-Assertion": encoded + "." + signature}

    def fetch(path: str):
        request = Request(f"http://127.0.0.1:{port}{path}", headers=header)
        with urlopen(request, timeout=10) as response:
            return json.load(response)

    models = fetch("/api/postes")
    criteria = fetch("/api/criterios")
    assert len(models) >= 173, len(models)
    by_key = {(m["tipo"], m["face"], m["conicidade"],
               float(m["altura_m"]), float(m["resistencia_daN"])): m for m in models}
    assert by_key[("C", "C", "A", 9.0, 150.0)]["dimensoes_nominais"]["diametro_base"] == 320
    assert by_key[("C", "C", "B", 9.0, 150.0)]["dimensoes_nominais"]["diametro_base"] == 275
    assert by_key[("DT", "B", "A", 9.0, 300.0)]["dimensoes_nominais"]["largura_base"] == 392
    assert by_key[("DT", "A", "A", 9.0, 150.0)]["dimensoes_nominais"]["comprimento"] == 9000
    assert criteria[0]["valores"]["dimensional"]["usar_nominais_modelo"] is True
    print(f"SMOKE_OK models={len(models)} criterion={criteria[0]['versao']}")


if __name__ == "__main__":
    main()
