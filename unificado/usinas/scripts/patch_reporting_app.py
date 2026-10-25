"""Register read-only Campinas reports in the live Mapa API with a backup."""

from pathlib import Path
import shutil


path = Path("/opt/concrefer-unificado/mapa-api/app.py")
backup = path.with_name("app.py.bak-usinas-reporting-20261025")
anchor = (
    "from usinas_legacy_read import register as register_usinas_legacy_read\n"
    "register_usinas_legacy_read(app, authenticated_user, screen_access_state)\n"
)
addition = (
    "from usinas_reporting import register as register_usinas_reporting\n"
    "register_usinas_reporting(app, connect, authenticated_user, screen_access_state)\n"
)
source = path.read_text(encoding="utf-8")
if addition in source:
    print("Reporting route already registered")
elif source.count(anchor) != 1 or backup.exists():
    raise RuntimeError("Unexpected app state; no patch applied")
else:
    shutil.copy2(path, backup)
    path.write_text(source.replace(anchor, anchor + addition), encoding="utf-8")
    print("Reporting route registered; prior app backed up")
