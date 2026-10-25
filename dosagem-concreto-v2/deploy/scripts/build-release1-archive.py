"""Package the already built official Release 1 without credentials or local runtimes."""
from pathlib import Path
import hashlib
import tarfile

root = Path(__file__).resolve().parents[2]
archive = root / "release1-20261022.tar.gz"
sources = {
    "web": root / "dist",
    "api/app": root / "api/app",
    "api/migrations": root / "api/migrations",
    "api/vendor": root / "api/vendor",
    "api/alembic.ini": root / "api/alembic.ini",
    "api/pyproject.toml": root / "api/pyproject.toml",
    "api/golden/principal-4.1.json": root / "shared/golden/principal-4.1.json",
    "api/golden/alternative-4.1.json": root / "shared/golden/alternative-4.1.json",
    "deploy/systemd/concretrack-dosagem-api.service": root / "deploy/systemd-official/concretrack-dosagem-api.service",
    "deploy/systemd/concretrack-dosagem-backup.service": root / "deploy/systemd/concretrack-dosagem-backup.service",
    "deploy/systemd/concretrack-dosagem-backup.timer": root / "deploy/systemd/concretrack-dosagem-backup.timer",
    "deploy/nginx": root / "deploy/nginx",
    "deploy/scripts": root / "deploy/scripts",
}

with tarfile.open(archive, "w:gz") as out:
    for target, source in sources.items():
        if not source.exists():
            raise FileNotFoundError(source)
        files = [source] if source.is_file() else sorted(p for p in source.rglob("*") if p.is_file())
        for file in files:
            if "__pycache__" in file.parts or file.suffix == ".pyc":
                continue
            name = Path(target) / file.relative_to(source) if source.is_dir() else Path(target)
            info = out.gettarinfo(str(file), arcname=name.as_posix())
            info.mode = 0o755 if file.suffix == ".sh" else 0o644
            with file.open("rb") as data:
                out.addfile(info, data)
print(f"{archive} sha256={hashlib.sha256(archive.read_bytes()).hexdigest()}")
