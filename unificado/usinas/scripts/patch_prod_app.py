"""Add the read-only Usinas route to the official Mapa API, with backup."""

from pathlib import Path
import shutil


path = Path("/opt/concrefer-unificado/mapa-api/app.py")
backup = path.with_name("app.py.bak-usinas-read-20261022")
anchor = "from usina_integration import register as register_usina_integration\nregister_usina_integration(app)\n"
addition = "\nfrom usinas_receitas import register as register_usinas_receitas\nregister_usinas_receitas(app, connect, authenticated_user, screen_access_state)\n"
source = path.read_text(encoding="utf-8")
if addition.strip() in source:
    raise SystemExit("Rota já registrada; nenhuma alteração")
if source.count(anchor) != 1 or backup.exists():
    raise RuntimeError("Âncora ou backup em estado inesperado")
shutil.copy2(path, backup)
path.write_text(source.replace(anchor, anchor + addition), encoding="utf-8")
print("Rota de leitura registrada; backup preservado")
