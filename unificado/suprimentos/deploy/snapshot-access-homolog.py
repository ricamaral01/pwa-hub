"""Captura o endpoint real /unified/screen-access/me com sessões efêmeras locais.

Executar no host de homologação, com as variáveis do serviço Mapa já carregadas.
O token e a chave nunca são gravados nem exibidos.
"""
from __future__ import annotations
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path.cwd()))
from app import app, connect, signer, COOKIE_NAME

destination = Path(sys.argv[1]).resolve()
with connect() as conn, conn.cursor() as cur:
    cur.execute("""SELECT id,perfil,updated_at FROM public.usuarios
                   WHERE ativo AND NOT primeiro_acesso AND deleted_at IS NULL
                   ORDER BY id""")
    users = cur.fetchall()

selected = []
for wanted in ("user-ricardo", "ricardo.teste"):
    match = next((u for u in users if u["id"] == wanted), None)
    if match:
        selected.append(match)
for role in ("GERENCIA", "GESTOR", "MONTADOR"):
    match = next((u for u in users if u["perfil"] == role and u not in selected), None)
    if match:
        selected.append(match)
for user in users:
    if len(selected) == 5:
        break
    if user not in selected:
        selected.append(user)
if len(selected) < 5:
    raise RuntimeError("Homologação não possui cinco usuários ativos para o snapshot")

snapshots = []
for user in selected:
    token = signer().dumps({"scope":"session", "id":user["id"],
                            "updated_at":user["updated_at"].isoformat()})
    with app.test_client() as client:
        client.set_cookie(COOKIE_NAME, token)
        response = client.get("/unified/screen-access/me")
        if response.status_code != 200 or not response.json.get("ok"):
            raise RuntimeError(f"Snapshot falhou para {user['id']}: HTTP {response.status_code}")
        body = response.json
        snapshots.append({"id":user["id"],"perfil":user["perfil"],
                          "screens":sorted(body["screens"]),
                          "suprimentos_enabled":body.get("suprimentos_enabled",False),
                          "suprimentos_flags":body.get("suprimentos_flags",{})})
destination.write_text(json.dumps(snapshots,ensure_ascii=False,indent=2),encoding="utf-8")
destination.chmod(0o600)
print(json.dumps([{"id":s["id"],"perfil":s["perfil"],"telas":len(s["screens"])}
                  for s in snapshots],ensure_ascii=False))
