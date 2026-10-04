"""Stage public test-only assets and auth files without touching the VPS."""

from pathlib import Path
import shutil

ROOT = Path(__file__).resolve().parents[1]
STAGE = ROOT / ".work-mapa-unificado" / "release"
PUBLIC = STAGE / "public" / "unificado"
API = STAGE / "mapa-api"


def main() -> None:
    PUBLIC.mkdir(parents=True, exist_ok=True)
    API.mkdir(parents=True, exist_ok=True)
    src = ROOT / "unificado"
    for name in ("index.html", "login.html", "VERSION"):
        shutil.copy2(src / name, PUBLIC / name)
    for name in ("shell", "assets", "vendor", "testar"):
        shutil.copytree(src / name, PUBLIC / name, dirs_exist_ok=True)
    shutil.copytree(ROOT / ".work-mapa-unificado" / "pcp-publish", PUBLIC / "pcp",
                    dirs_exist_ok=True)
    (PUBLIC / "mapa").mkdir(exist_ok=True)
    shutil.copy2(src / "mapa" / "index.html", PUBLIC / "mapa" / "index.html")
    shutil.copytree(ROOT / ".work-mapa-unificado" / "operacao",
                    PUBLIC / "mapa" / "operacao", dirs_exist_ok=True)
    for name in ("app.py", "unified_auth.py"):
        shutil.copy2(src / "mapa" / "api" / name, API / name)
    shutil.copy2(src / "testar" / "index.html", API / "testar-index.html")
    shutil.copy2(src / "VERSION", API / "VERSION")
    print(STAGE)


if __name__ == "__main__":
    main()
