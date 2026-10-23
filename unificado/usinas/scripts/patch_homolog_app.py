"""Register the Usinas mirror read route in the isolated homolog Mapa API."""

from pathlib import Path
import shutil
import sys


path = Path(sys.argv[1])
assert path.name == "app.py" and "homolog-next/mapa-api" in str(path), path
backup = path.with_name("app.py.bak-usinas-20261022")
marker = "from usina_integration import register as register_usina_integration\nregister_usina_integration(app)\n"
addition = "\nfrom usinas_receitas import register as register_usinas_receitas\nregister_usinas_receitas(app, connect, authenticated_user, screen_access_state)\n"
source = path.read_text(encoding="utf-8")
if addition.strip() in source:
    print("Usinas already registered")
    sys.exit(0)
if source.count(marker) != 1 or backup.exists():
    raise RuntimeError("Registration anchor or backup state unexpected")
shutil.copy2(path, backup)
path.write_text(source.replace(marker, marker + addition), encoding="utf-8")
print("Usinas mirror route registered; backup:", backup)
