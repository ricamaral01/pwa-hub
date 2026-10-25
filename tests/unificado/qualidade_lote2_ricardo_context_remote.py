"""Read-only check against the deployed Unificado identity code and database."""
from __future__ import annotations

import json
import os
from pathlib import Path
import sys

for path in ("/etc/mapa-unificado/auth.env", "/etc/mapa-unificado/writer.env",
             "/etc/mapa-unificado/unified-auth.env", "/etc/concrefer-unificado/lab-map.env"):
    for line in Path(path).read_text().splitlines():
        if line.strip() and not line.lstrip().startswith("#") and "=" in line:
            key, value = line.strip().split("=", 1)
            os.environ[key] = value.strip().strip('"').strip("'")
sys.path.insert(0, "/opt/concrefer-unificado/mapa-api")
import app as module  # noqa: E402

with module.connect() as conn, conn.cursor() as cur:
    cur.execute("""SELECT id,nome,perfil,ativo,primeiro_acesso,updated_at
                   FROM public.usuarios WHERE id=%s AND deleted_at IS NULL""",
                (module.MASTER_USER_ID,))
    user = cur.fetchone()
assert user and user["id"] == "user-ricardo" and user["ativo"] and not user["primeiro_acesso"]
screens, _ = module.screen_access_state(user)
actions = module.quality_actions(user["id"])
areas = module.quality_areas(user["id"])
assert set(actions) == set(module.QUALITY_ACTION_IDS) and len(actions) == 9
assert set(areas) == set(module.QUALITY_AREA_CODES) and len(areas) == 20
catalog = module.SCREEN_CATALOG
assert set(screens) == {item["id"] for item in catalog}
print(json.dumps({"ricardo_context": "PASS", "screens": len(screens),
                  "actions": len(actions), "areas": len(areas), "implicit_superuser": True}))

with module.connect() as conn, conn.cursor() as cur:
    cur.execute("""SELECT id,nome,perfil,ativo,primeiro_acesso,updated_at FROM public.usuarios
                   WHERE ativo AND deleted_at IS NULL AND id <> %s AND id NOT LIKE 'e2e-%%'
                     AND id NOT LIKE 'unif-pcp-%%' AND id <> 'ricardo.teste'
                   ORDER BY id""", (module.MASTER_USER_ID,))
    candidates = cur.fetchall()
ordinary = next((candidate for candidate in candidates
                 if not any(item.startswith("qualidade") for item in module.screen_access_state(candidate)[0])), None)
assert ordinary is not None
ordinary_screens, _ = module.screen_access_state(ordinary)
ordinary_preview = (ordinary["id"] == module.MASTER_USER_ID or
                    ordinary["id"].startswith(("e2e-", "unif-pcp-")) or
                    ordinary["id"] == "ricardo.teste")
assert not ordinary_preview and not any(item.startswith("qualidade") for item in ordinary_screens)
print(json.dumps({"ordinary_session_rule": "PASS", "preview_modules": False,
                  "quality_screens": 0, "identity_disclosed": False}))
