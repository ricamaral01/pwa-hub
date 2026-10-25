"""Localhost-only API smoke with a disposable signed gateway identity."""

import base64
import hashlib
import hmac
import json
import subprocess
import time
import urllib.request
import uuid
from pathlib import Path


def main() -> None:
    env = Path("/etc/concrefer-unificado/dosagem-native.env").read_text()
    key = next(line.split("=", 1)[1].strip() for line in env.splitlines()
               if line.startswith("LAB_GATEWAY_SIGNING_KEY="))
    claims = {"id": "native-smoke", "name": "Teste Dosagem", "role": "tecnico",
              "dosagem": True, "dosagem_role": "laboratorista", "exp": int(time.time()) + 20}
    payload = base64.urlsafe_b64encode(json.dumps(claims, separators=(",", ":")).encode()).rstrip(b"=").decode()
    signature = base64.urlsafe_b64encode(hmac.new(key.encode(), payload.encode(), hashlib.sha256).digest()).rstrip(b"=").decode()
    assertion = payload + "." + signature
    base = "http://127.0.0.1:13067/native/api/v1/"
    request = urllib.request.Request(base + "auth/sessao", headers={"X-Lab-Assertion": assertion})
    with urllib.request.urlopen(request, timeout=10) as response:
        session = json.load(response)
        assert response.status == 200 and session["papel"] == "laboratorista"
    request_id = str(uuid.uuid4())
    body = json.dumps({"acao": "tracos.listar", "requestId": request_id, "dados": {}}).encode()
    request = urllib.request.Request(base + "rpc", data=body, headers={
        "X-Lab-Assertion": assertion, "X-Requested-With": "dosagem",
        "Idempotency-Key": request_id, "Content-Type": "application/json"})
    with urllib.request.urlopen(request, timeout=10) as response:
        result = json.load(response)
        assert response.status == 200 and result["ok"] and isinstance(result["dados"], list)
    print("Native session: 200; RPC tracos.listar: 200")
    sql = "DELETE FROM dosagem.usuarios WHERE email='unificado-native-smoke@concretrack.local';"
    subprocess.run(["runuser", "-u", "postgres", "--", "psql", "-v", "ON_ERROR_STOP=1",
                    "-d", "mapa_unificado_teste", "-c", sql], check=True, stdout=subprocess.DEVNULL)
    print("Disposable test identity removed")


if __name__ == "__main__":
    main()
