"""Read-only checks for the production screen and unit-access rules."""
import os
import subprocess
import sys

pid = subprocess.check_output(
    ["systemctl", "show", "-p", "MainPID", "--value", "mapa-unificado-auth.service"],
    text=True,
).strip()
os.environ.update(
    entry.decode().split("=", 1)
    for entry in open(f"/proc/{pid}/environ", "rb").read().split(b"\0")
    if b"=" in entry
)
sys.path.insert(0, "/opt/concrefer-unificado/mapa-api")
from app import required_planning_role, unit_allows_screen
from screen_access import allowed_screens, screen_for_uri

assert required_planning_role({"rbrApontamento"}) == "PRODUCAO"
assert unit_allows_screen("ribeirao", "rbrApontamento")
assert not unit_allows_screen("pederneiras", "rbrApontamento")
assert unit_allows_screen("pederneiras", "pdrApontamento")
assert not unit_allows_screen("ribeirao", "pdrApontamento")
assert screen_for_uri("/unificado/producao/ribeirao/app/")["id"] == "rbrApontamento"
assert screen_for_uri("/unificado/producao/ribeirao/mao-de-obra/app/")["id"] == "rbrMaoDeObra"
for user_id in ("user-ricardo", "marcelo", "alex", "alex51", "philippe"):
    user = {"id": user_id, "perfil": "GERENCIA", "nome": user_id}
    assert "rbrApontamento" in allowed_screens(user, None, {}, frozenset())
print("Gateway Ribeirão unit rules and master access: OK")
