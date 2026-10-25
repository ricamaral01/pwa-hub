"""One bounded HTTP probe of an exact 50 MiB valid PDF and a +1 byte file."""
from pathlib import Path
import json
import requests

BASE = "https://concrefer.concretrack.com.br/unificado/ged/api"
DOC = "13c37107-bff7-456f-8eb3-baf0276eec57"
PDF = Path("/root/ged-a5-20261015/valid-50.pdf")
ENV = Path("/etc/ged-a5-probe.env")


def main() -> None:
    account = dict(line.split("=", 1) for line in ENV.read_text().splitlines() if "=" in line)
    session = requests.Session()
    login = session.post(BASE + "/auth/login", json={
        "username": account["ADMIN_MASTER_USER"],
        "password": account["ADMIN_MASTER_PASSWORD"]}, timeout=15)
    assert login.status_code == 200, f"login status {login.status_code}"
    auth = {"Authorization": "Bearer " + login.json()["token"]}
    source = PDF.read_bytes()
    assert len(source) == 50 * 1024 * 1024
    results = []
    for label, payload, expected in (("exact_50", source, 201), ("plus_one", source + b"\n", 400)):
        response = session.post(BASE + f"/documents/{DOC}/upload", headers=auth,
                                files={"file": (f"a5-valid-{label}.pdf", payload, "application/pdf")},
                                timeout=45)
        try:
            body = response.json()
        except ValueError:
            body = {}
        results.append({"case": label, "bytes": len(payload), "status": response.status_code,
                        "version_id": body.get("id") if response.status_code == 201 else None,
                        "error": body.get("error") if response.status_code != 201 else None})
        if response.status_code != expected:
            print(json.dumps(results))
            raise SystemExit(1)
    print(json.dumps(results))


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"valid PDF HTTP probe failed: {type(error).__name__}")
        raise SystemExit(1) from None
