"""Add a signed Dosagem role claim to the live Unificado gateway."""

from datetime import datetime, timezone
from pathlib import Path


path = Path('/opt/concrefer-unificado/mapa-api/app.py')
source = path.read_text()
before = '            "dosagem": "labDosagem" in allowed and screen is not None and screen["id"] == "labDosagem",\n'
after = before + ('            "dosagem_role": "admin" if user["id"] in MASTER_USER_IDS else\n'
                  '                            "engenheiro" if role in {"admin", "engenheiro"} else "laboratorista",\n')
if source.count(before) != 1:
    raise RuntimeError('Gateway claim patch does not match exactly once')
stamp = datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')
path.with_name(path.name + f'.before-dosagem-role-{stamp}').write_text(source)
path.write_text(source.replace(before, after, 1))
print('Dosagem role claim installed')
