"""Remove stale copied asset hashes from Ribeirão's three build outputs."""
from pathlib import Path
import re

workspace = Path(__file__).resolve().parents[1]
root = (workspace / "unificado/producao/ribeirao").resolve()
assert root.is_relative_to(workspace.resolve())
for site in (root, root / "app", root / "mao-de-obra/app"):
    assert site.resolve().is_relative_to(root)
    html = (site / "index.html").read_text(encoding="utf-8")
    used = set(re.findall(r"assets/(index-[A-Za-z0-9_-]+\.\w+)", html))
    if len(used) != 2:
        raise RuntimeError(f"Expected one JS and one CSS asset in {site}, got {used}")
    for asset in (site / "assets").iterdir():
        if asset.name not in used:
            print(f"Removing stale asset: {asset}")
            asset.unlink()
