"""Package only the unified navigation files; never replace module logic or data."""

from pathlib import Path
import tarfile


ROOT = Path(__file__).resolve().parents[1]
VERSION = (ROOT / "unificado" / "VERSION").read_text(encoding="utf-8").strip()
ARCHIVE = ROOT / ".work-mapa-unificado" / f"navigation-{VERSION}.tar.gz"

files = {
    "unificado/VERSION": ROOT / "unificado/VERSION",
    "unificado/index.html": ROOT / "unificado/index.html",
    "unificado/login.html": ROOT / "unificado/login.html",
    "unificado/manifest.webmanifest": ROOT / "unificado/manifest.webmanifest",
    "unificado/sw.js": ROOT / "unificado/sw.js",
    "unificado/shell/shell.css": ROOT / "unificado/shell/shell.css",
    "unificado/shell/shell.js": ROOT / "unificado/shell/shell.js",
    "unificado/shell/auth.js": ROOT / "unificado/shell/auth.js",
    "unificado/shell/router.js": ROOT / "unificado/shell/router.js",
    "unificado/shell/embedded.css": ROOT / "unificado/shell/embedded.css",
    "unificado/mapa/operacao/index.html": ROOT / ".work-mapa-unificado/operacao/index.html",
    "unificado/mapa/operacao/manifest.json": ROOT / ".work-mapa-unificado/operacao/manifest.json",
    "unificado/mapa/operacao/sw.js": ROOT / ".work-mapa-unificado/operacao/sw.js",
    "unificado/mapa/operacao/unificado-bridge.js": ROOT / "unificado/mapa/operacao/unificado-bridge.js",
    "unificado/pcp/unificado-shell.js": ROOT / "unificado/pcp/unificado-shell.js",
}
for page in (ROOT / ".work-mapa-unificado/pcp-publish").iterdir():
    if page.is_dir() and (page / "index.html").exists():
        files[f"unificado/pcp/{page.name}/index.html"] = page / "index.html"

with tarfile.open(ARCHIVE, "w:gz") as archive:
    for name, path in sorted(files.items()):
        archive.add(path, arcname=name)
print(f"archive={ARCHIVE} files={len(files)} version={VERSION}")
