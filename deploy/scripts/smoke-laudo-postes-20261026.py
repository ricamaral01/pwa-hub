import base64
import hashlib
import hmac
import json
import os
import shlex
import ssl
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path


environment, final_id, draft_id = sys.argv[1:4]
stage = environment == "stage"
env_file = Path("/etc/concrefer-unificado/laboratorio-homolog.env" if stage else "/etc/concrefer-unificado/laboratorio.env")
values = {}
for line in env_file.read_text().splitlines():
    if "=" in line and not line.startswith("#"):
        key, value = line.split("=", 1)
        values[key] = shlex.split(value)[0] if shlex.split(value) else ""
secret = values["LAB_GATEWAY_SIGNING_KEY"].encode()
port = 13065 if stage else 13064
origin = "https://concrefer.concretrack.com.br" + (":18446" if stage else "")
payload = {"id": "smoke-laudo", "name": "Smoke Laudo", "role": "admin", "exp": int(time.time()) + 25}
encoded = base64.urlsafe_b64encode(json.dumps(payload, separators=(",", ":")).encode()).rstrip(b"=").decode()
signature = base64.urlsafe_b64encode(hmac.new(secret, encoded.encode(), hashlib.sha256).digest()).rstrip(b"=").decode()
assertion = encoded + "." + signature
ctx = ssl._create_unverified_context()
out = Path("/tmp/laudo-postes-samples")
out.mkdir(exist_ok=True)


def fetch(url, headers=None, method="GET"):
    request = urllib.request.Request(url, headers=headers or {}, method=method)
    try:
        with urllib.request.urlopen(request, context=ctx, timeout=20) as response:
            return response.status, response.read(), response.headers
    except urllib.error.HTTPError as error:
        return error.code, error.read(), error.headers


for name, test_id in (("final", final_id), ("draft", draft_id)):
    code, pdf, headers = fetch(f"http://127.0.0.1:{port}/api/ensaios/{test_id}/laudo.pdf", {"X-Lab-Assertion": assertion})
    assert code == 200 and pdf.startswith(b"%PDF-"), (name, code, pdf[:100])
    (out / f"{environment}-{name}.pdf").write_bytes(pdf)
    print(name, "authenticated PDF", len(pdf), "bytes")

token = base64.urlsafe_b64encode(hmac.new(secret, f"postes-laudo-v1:{final_id}".encode(), hashlib.sha256).digest()).rstrip(b"=").decode()
url = f"{origin}/v/postes/{final_id}/{token}"
code, page, _ = fetch(url)
assert code == 200 and b"Baixar laudo em PDF" in page, (code, page[:120])
print("verification", code, url)
code, pdf, headers = fetch(url + "/laudo.pdf")
assert code == 200 and pdf.startswith(b"%PDF-"), (code, pdf[:100])
(out / f"{environment}-public.pdf").write_bytes(pdf)
print("public PDF", code, len(pdf), "bytes")
bad = f"{origin}/v/postes/{final_id}/bad-token"
assert fetch(bad)[0] == 404
draft_token = base64.urlsafe_b64encode(hmac.new(secret, f"postes-laudo-v1:{draft_id}".encode(), hashlib.sha256).digest()).rstrip(b"=").decode()
assert fetch(f"{origin}/v/postes/{draft_id}/{draft_token}")[0] == 404
print("invalid token and signed draft blocked")
if not stage:
    code, body, _ = fetch(f"http://127.0.0.1:{port}/api/ensaios/{draft_id}/finalizar",
                          {"X-Lab-Assertion": assertion}, method="POST")
    assert code == 409 and "Engastamento" in body.decode("utf-8"), (code, body[:200])
    print("existing draft remains pending and names Engastamento", code)
