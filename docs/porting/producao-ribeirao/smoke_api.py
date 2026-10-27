"""Read-only production API smoke check using short-lived local tokens."""
from __future__ import annotations

import json
import subprocess
import urllib.error
import urllib.request
from datetime import datetime, timedelta, timezone

from jose import jwt

pid = subprocess.check_output(
    ["systemctl", "show", "-p", "MainPID", "--value", "pcp-unificado-test.service"],
    text=True,
).strip()
environment = dict(
    entry.decode().split("=", 1)
    for entry in open(f"/proc/{pid}/environ", "rb").read().split(b"\0")
    if b"=" in entry
)
secret = environment["SECRET_KEY"]
base = "http://127.0.0.1:13054/api/producao"


def get(user_id: int, unit: str, resource: str):
    token = jwt.encode(
        {"sub": str(user_id), "exp": datetime.now(timezone.utc) + timedelta(minutes=2),
         "session_epoch_ms": int(datetime.now(timezone.utc).timestamp() * 1000)},
        secret,
        algorithm="HS256",
    )
    request = urllib.request.Request(
        f"{base}/{unit}/{resource}", headers={"Authorization": f"Bearer {token}"}
    )
    try:
        with urllib.request.urlopen(request, timeout=10) as response:
            return response.status, json.load(response)
    except urllib.error.HTTPError as exc:
        return exc.code, json.loads(exc.read() or b"{}")


for user_id in (10, 14, 15, 17):
    product_status, products = get(user_id, "ribeirao", "produtos")
    area_status, areas = get(user_id, "ribeirao", "areas")
    print(user_id, "products", product_status, len(products.get("produtos", [])),
          "areas", area_status, len(areas.get("areas", [])),
          products.get("detail") if product_status != 200 else "")
    assert product_status == area_status == 200
    assert len(products["produtos"]) == 99
    assert len(areas["areas"]) == 5

status, _ = get(149, "ribeirao", "produtos")
print("Pederneiras operator denied Ribeirão:", status)
assert status == 403
status, products = get(149, "pederneiras", "produtos")
print("Pederneiras operator products:", status, len(products.get("produtos", [])))
assert status == 200 and len(products["produtos"]) == 112
