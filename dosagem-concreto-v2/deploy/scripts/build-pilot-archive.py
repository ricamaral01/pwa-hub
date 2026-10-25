"""Bundle only built pilot artifacts; no secrets or local virtualenv."""
from pathlib import Path
import tarfile

root = Path(__file__).resolve().parents[2]
archive = root / "pilot-release.tar.gz"
sources = {
    "web": root / "dist",
    "api/app": root / "api/app",
    "api/migrations": root / "api/migrations",
    "api/vendor": root / "api/vendor",
    "api/alembic.ini": root / "api/alembic.ini",
    "api/pyproject.toml": root / "api/pyproject.toml",
    "deploy/systemd": root / "deploy/systemd",
    "deploy/nginx": root / "deploy/nginx",
    "deploy/scripts/ensure-pilot-env.sh": root / "deploy/scripts/ensure-pilot-env.sh",
    "deploy/scripts/backup.sh": root / "deploy/scripts/backup.sh",
    "deploy/scripts/prepare-db.sh": root / "deploy/scripts/prepare-db.sh",
    "deploy/scripts/post-deploy-smoke.py": root / "deploy/scripts/post-deploy-smoke.py",
    "deploy/scripts/run-pilot-smoke.sh": root / "deploy/scripts/run-pilot-smoke.sh",
    "api/golden/principal-4.1.json": root / "shared/golden/principal-4.1.json",
    "api/golden/alternative-4.1.json": root / "shared/golden/alternative-4.1.json",
    "deploy/scripts/rollback-code.sh": root / "deploy/scripts/rollback-code.sh",
    "deploy/scripts/verificar-migracoes.py": root / "deploy/scripts/verificar-migracoes.py",
}

with tarfile.open(archive, "w:gz") as out:
    for target, source in sources.items():
        files = [source] if source.is_file() else [p for p in source.rglob("*") if p.is_file()]
        for file in files:
            if "__pycache__" in file.parts or file.suffix == ".pyc":
                continue
            name = Path(target) / file.relative_to(source) if source.is_dir() else Path(target)
            info = out.gettarinfo(str(file), arcname=str(name).replace("\\", "/"))
            info.mode = 0o755 if file.suffix == ".sh" else 0o644
            with file.open("rb") as data:
                out.addfile(info, data)
print(archive)
