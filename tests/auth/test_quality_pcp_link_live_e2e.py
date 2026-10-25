"""Additive end-to-end test of the deployed PCP-to-Quality link."""
from __future__ import annotations

from http.cookiejar import CookieJar
import json
import os
from pathlib import Path
import secrets
import sys
from urllib.request import build_opener, HTTPCookieProcessor, Request
from unittest.mock import patch


LOGIN = "e2e-pcp-quality-e2e-probe"
FILE = Path("/etc/mapa-unificado/pcp-quality-e2e-probe.env")
BASE = "https://concrefer.concretrack.com.br"
if FILE.exists():
    raise RuntimeError("Synthetic E2E probe already exists")
for path in ("/etc/mapa-unificado/auth.env", "/etc/mapa-unificado/unified-auth.env"):
    for line in Path(path).read_text().splitlines():
        if line.strip() and not line.lstrip().startswith("#") and "=" in line:
            key, value = line.strip().split("=", 1)
            os.environ[key] = value.strip().strip('"').strip("'")
sys.path.insert(0, "/opt/concrefer-unificado/mapa-api")
import app as module  # noqa: E402
from unified_auth import PCP_HASHER, pcp_connect, link_for, verify_pcp  # noqa: E402


def pcp_row(user_id):
    with pcp_connect() as conn, conn.cursor() as cur:
        cur.execute("""SELECT username,nivel_acesso,senha_hash,trocar_senha_primeiro_acesso
          FROM public.usuarios WHERE id=%s""", (user_id,))
        return cur.fetchone()


password = secrets.token_urlsafe(24)
with pcp_connect() as conn, conn.cursor() as cur:
    cur.execute("""INSERT INTO public.usuarios
      (nome,username,email,senha_hash,nivel_acesso,ativo,trocar_senha_primeiro_acesso)
      VALUES (%s,%s,%s,%s,'CONSULTA',true,false) RETURNING id""",
      ("Conta Sintética PCP Qualidade E2E", LOGIN, LOGIN + "@local.invalid",
       PCP_HASHER.hash(password)))
    user_id = cur.fetchone()["id"]
fd = os.open(FILE, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
with os.fdopen(fd, "w") as stream:
    stream.write(f"PCP_TEST_ID={user_id}\nPCP_TEST_USER={LOGIN}\nPCP_TEST_PASSWORD={password}\n")
before = pcp_row(user_id)
assert verify_pcp(password, before["senha_hash"]) and link_for(pcp_id=user_id) is None

client = module.app.test_client()
with patch.object(module, "unified_user_admin", return_value={"id": module.MASTER_USER_ID}):
    catalog_response = client.get(f"/unified/users/pcp/{user_id}/screens")
    assert catalog_response.status_code == 200
    catalog = catalog_response.json["screens"]
    selected = [screen["id"] for screen in catalog if screen["checked"]]
    planning = set(selected)
    assert planning and all(screen["module"] == "planejamento" for screen in catalog if screen["id"] in planning)
    response = client.put(f"/unified/users/pcp/{user_id}/screens",
                          headers={"Origin": BASE},
                          json={"screens": selected + ["qualidadePainel"],
                                "name": "Conta Sintética PCP Qualidade E2E",
                                "map_role": "GERENCIA", "map_sector": "Todos"})
    assert response.status_code == 200 and response.json.get("linked") is True, (response.status_code, response.json)
after_link = pcp_row(user_id)
assert after_link == before
link = link_for(pcp_id=user_id)
assert link and link["mapa_login"] == f"unif-pcp-{user_id}"
with module.connect() as conn, conn.cursor() as cur:
    cur.execute("""SELECT screen_id FROM unificado_auth.user_screen_permissions
      WHERE user_id=%s AND allowed""", (link["mapa_login"],))
    screens = {row["screen_id"] for row in cur.fetchall()}
    cur.execute("""SELECT count(*) AS n FROM unificado_auth.user_action_permissions
      WHERE user_id=%s""", (link["mapa_login"],))
    action_count = cur.fetchone()["n"]
assert screens == planning | {"qualidadePainel"} and action_count == 0

opener = build_opener(HTTPCookieProcessor(CookieJar()))


def call(path, method="GET", payload=None):
    body = json.dumps(payload).encode() if payload is not None else None
    request = Request(BASE + path, body, method=method,
                      headers={"Content-Type": "application/json"} if body else {})
    with opener.open(request, timeout=20) as response:
        return response.status, json.load(response)


status, login = call("/unificado/mapa/api/unified/login", "POST",
                     {"username": LOGIN, "password": password})
assert status == 200 and login["modules"] == ["pcp", "mapa"]
after_login = pcp_row(user_id)
assert after_login == before
assert verify_pcp(password, after_login["senha_hash"])
assert link_for(pcp_id=user_id)["unified_password_set"] is True
status, bootstrap = call("/unificado/mapa/api/unified/qualidade-bootstrap", "POST")
assert status == 200 and bootstrap["ok"] is True
status, context = call("/unificado/qualidade/api/contexto")
assert status == 200 and context["user"]["id"] == link["mapa_login"]
assert context["user"]["actions"] == []
print(f"pcp_quality_link_live_e2e=PASS pcp_id={user_id} shadow={link['mapa_login']} "
      "pcp_hash_before_after_link_first_login=identical password_login=valid "
      f"pcp_screens={len(planning)} production_screens=0 quality_screens=1 "
      "quality_actions=0 bootstrap=200 context=200 synthetic_accounts_retained=true")
