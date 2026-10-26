"""Signed read-only check for the CP lookup with an incomplete certificate draft."""
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


def main() -> None:
    port = int(sys.argv[1])
    env_file = Path(sys.argv[2])
    secret = next(
        shlex.split(line.partition("=")[2])[0]
        for line in env_file.read_text(encoding="utf-8").splitlines()
        if line.startswith("LAB_GATEWAY_SIGNING_KEY=")
    )
    assert len(secret) >= 32
    actor = {"id": "smoke-cq", "name": "Smoke CQ", "role": "admin", "exp": int(time.time()) + 25}
    encoded = base64.urlsafe_b64encode(json.dumps(actor, separators=(",", ":")).encode()).rstrip(b"=").decode()
    signature = base64.urlsafe_b64encode(
        hmac.new(secret.encode(), encoded.encode(), hashlib.sha256).digest()
    ).rstrip(b"=").decode()
    headers = {"Content-Type": "application/json", "X-Lab-Assertion": encoded + "." + signature}
    body = {"itens": [{"modelo": "C 10X800", "altura_m": 10, "carga_dan": 800,
                       "peso_kg": 1090, "quantidade": 10, "data_producao": "2026-10-13"}]}
    request = Request(f"http://127.0.0.1:{port}/api/resultados", data=json.dumps(body).encode(),
                      headers=headers, method="POST")
    with urlopen(request, timeout=25) as response:
        result = json.load(response)
    assert result["rows"][0]["data_producao"] == "2026-10-13"
    assert len(result["rows"]) == 1
    for path, marker in (("/", b"app.js?v=1.0.105"), ("/app.js", b"function apiError")):
        with urlopen(Request(f"http://127.0.0.1:{port}{path}", headers=headers), timeout=10) as response:
            assert marker in response.read()
    print(f"SMOKE_OK port={port} rows=1 without client or issuance fields")


if __name__ == "__main__":
    main()
