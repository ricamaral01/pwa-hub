"""Compare the read-only Usina massadas source with the isolated Mapa bridge."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path
import urllib.request


def get(url: str, *, cookie: str | None = None) -> tuple[int, bytes]:
    headers = {"Cookie": cookie} if cookie else {}
    with urllib.request.urlopen(urllib.request.Request(url, headers=headers), timeout=20) as response:
        return response.status, response.read()


def main() -> None:
    account = dict(line.split("=", 1) for line in
                   Path("/etc/mapa-unificado/auth-probe.env").read_text().splitlines()
                   if "=" in line)
    data = json.dumps({"name": account["MAPA_TEST_USER"],
                       "password": account["MAPA_TEST_PASSWORD"]}).encode()
    request = urllib.request.Request("http://127.0.0.1:13052/login", data=data,
                                     headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(request, timeout=15) as response:
        cookie = response.headers["Set-Cookie"].split(";", 1)[0]
    cases = [
        ("massadas", "https://dautomacao.com/api/usina/massadas", "/usina/massadas"),
        ("leituras_qr_csv",
         "https://docs.google.com/spreadsheets/d/1CdQhQ0AJ4mWJqAgnP371ez4r-P7ESX5KuTHI96nI0g8/export?format=csv&gid=0",
         "/usina/leituras-qr.csv?format=csv&gid=0"),
    ]
    for name, source, path in cases:
        original = get(source)
        copied = get("http://127.0.0.1:13052" + path, cookie=cookie)
        hashes = [hashlib.sha256(body).hexdigest() for _, body in (original, copied)]
        print(f"{name}_status={original[0]}/{copied[0]} hashes={hashes[0]}/{hashes[1]}")
        if original != copied:
            raise SystemExit(1)


if __name__ == "__main__":
    main()
