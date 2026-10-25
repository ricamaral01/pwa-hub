"""Additive test of candidate PCP-to-Quality password adoption in test DBs."""
from __future__ import annotations

import importlib.util
import os
from pathlib import Path
import secrets


for path in ("/etc/mapa-unificado/auth.env", "/etc/mapa-unificado/unified-auth.env"):
    for line in Path(path).read_text().splitlines():
        if line.strip() and not line.lstrip().startswith("#") and "=" in line:
            key, value = line.strip().split("=", 1)
            os.environ[key] = value.strip().strip('"').strip("'")

spec = importlib.util.spec_from_file_location("candidate_unified_auth",
                                               "/root/qualidade-b1/unified_auth_candidate.py")
auth = importlib.util.module_from_spec(spec)
assert spec.loader is not None
spec.loader.exec_module(auth)

password = secrets.token_urlsafe(24)
login = "e2e-quality-adopt-" + secrets.token_hex(4)
with auth.pcp_connect() as conn, conn.cursor() as cur:
    cur.execute("""INSERT INTO public.usuarios
      (nome,username,email,senha_hash,nivel_acesso,ativo,trocar_senha_primeiro_acesso)
      VALUES (%s,%s,%s,%s,'CONSULTA',true,false) RETURNING id,senha_hash""",
      ("Teste Adoção Qualidade", login, login + "@local.invalid", auth.PCP_HASHER.hash(password)))
    pcp = cur.fetchone()
shadow = f"unif-pcp-{pcp['id']}"
with auth.map_connect() as conn, conn.cursor() as cur:
    cur.execute("""INSERT INTO public.usuarios
      (id,nome,perfil,senha_hash,ativo,setor,primeiro_acesso)
      VALUES (%s,'Teste Adoção Qualidade','GERENCIA',%s,true,'Todos',false)""",
      (shadow, auth.MAPA_HASHER.hash(secrets.token_urlsafe(24))))
link_id = auth.confirm_link(pcp["id"], shadow, mapa_base=True)
try:
    auth.adopt_pcp_password(link_id, "wrong-password")
    raise AssertionError("Wrong password was accepted")
except ValueError:
    pass
with auth.pcp_connect() as conn, conn.cursor() as cur:
    cur.execute("SELECT senha_hash,trocar_senha_primeiro_acesso FROM public.usuarios WHERE id=%s",
                (pcp["id"],))
    before = cur.fetchone()
assert before["senha_hash"] == pcp["senha_hash"] and before["trocar_senha_primeiro_acesso"] is False
auth.adopt_pcp_password(link_id, password)
with auth.pcp_connect() as conn, conn.cursor() as cur:
    cur.execute("SELECT senha_hash,trocar_senha_primeiro_acesso FROM public.usuarios WHERE id=%s",
                (pcp["id"],))
    after = cur.fetchone()
assert after == before
link = auth.link_for(pcp_id=pcp["id"])
assert link["unified_password_set"] and not link["requires_reset"]
assert link["pcp_hash"] == pcp["senha_hash"]
assert auth.check_link_password(link, password) == (True, True)
with auth.map_connect() as conn, conn.cursor() as cur:
    cur.execute("SELECT senha_hash,primeiro_acesso FROM public.usuarios WHERE id=%s", (shadow,))
    mapa = cur.fetchone()
assert mapa["senha_hash"] == link["mapa_hash"] and mapa["primeiro_acesso"] is False
print(f"quality_adopt_candidate=PASS pcp_id={pcp['id']} shadow={shadow} "
      "wrong_password=denied pcp_hash_and_first_access=unchanged mapa_hash=adopted "
      "linked_login_password=valid synthetic_accounts_retained=true")
