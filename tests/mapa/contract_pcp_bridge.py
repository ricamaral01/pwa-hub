"""Read PCP programming and round-trip a synthetic Mandril record in test PCP."""

from __future__ import annotations

import json
from pathlib import Path
import subprocess
import urllib.error
import urllib.parse
import urllib.request


DATE = "2099-01-17"
FORMA = "SC52"
BASE = "http://127.0.0.1:13052"


def main() -> None:
    account = dict(line.split("=", 1) for line in
                   Path("/etc/mapa-unificado/auth-probe.env").read_text().splitlines()
                   if "=" in line)
    login = urllib.request.Request(BASE + "/login", method="POST",
                                  headers={"Content-Type": "application/json"},
                                  data=json.dumps({"name": account["MAPA_TEST_USER"],
                                                   "password": account["MAPA_TEST_PASSWORD"]}).encode())
    with urllib.request.urlopen(login, timeout=15) as response:
        cookie = response.headers["Set-Cookie"].split(";", 1)[0]
    def call(method: str, path: str, body=None):
        headers = {"Cookie": cookie, "Origin": "https://concrefer.concretrack.com.br",
                   "Content-Type": "application/json"}
        request = urllib.request.Request(BASE + path, method=method, headers=headers,
                                         data=json.dumps(body).encode() if body is not None else None)
        try:
            with urllib.request.urlopen(request, timeout=20) as response:
                return response.status, json.loads(response.read() or b"null")
        except urllib.error.HTTPError as error:
            return error.code, json.loads(error.read() or b"null")
    results = {}
    try:
        status, rows = call("GET", "/pcp/programacao?setor_id=3&data_inicio=2026-10-02&data_fim=2026-10-02")
        results["programacao_read"] = status == 200 and isinstance(rows, list)
        status, body = call("POST", "/pcp/saques-mandril", {
            "data": DATE, "codigo_forma": FORMA,
            "data_hora_saque": DATE + "T12:00:00-03:00",
        })
        results["mandril_create"] = status == 200 and body.get("codigo_forma") == FORMA
        status, rows = call("GET", "/pcp/saques-mandril?data=" + DATE)
        results["mandril_read"] = status == 200 and any(row.get("codigo_forma") == FORMA for row in rows)
        status, _ = call("DELETE", "/pcp/saques-mandril?data=" + DATE + "&codigo_forma=" + FORMA)
        results["mandril_delete"] = status == 204
        status, rows = call("GET", "/pcp/saques-mandril?data=" + DATE)
        results["mandril_inactive"] = status == 200 and not rows
    finally:
        sql = "DELETE FROM public.saques_mandril WHERE data=DATE '2099-01-17' AND codigo_forma='SC52'"
        cleanup = subprocess.run(["runuser", "-u", "postgres", "--", "psql", "-d",
                                  "pcp_unificado_teste", "-Atc", sql], capture_output=True, text=True)
        results["cleanup"] = cleanup.returncode == 0 and "DELETE" in cleanup.stdout
    print("pcp_bridge_contract=" + ",".join(f"{key}:{'ok' if value else 'FAIL'}"
                                              for key, value in results.items()))
    if not all(results.values()):
        raise SystemExit(1)


if __name__ == "__main__":
    main()
