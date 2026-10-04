"""Reapply only previously confirmed, already unified test password hashes."""

from __future__ import annotations

import os
from pathlib import Path
import sys


def load(path: Path) -> None:
    for line in path.read_text().splitlines():
        if line.strip() and not line.lstrip().startswith("#") and "=" in line:
            key, value = line.strip().split("=", 1)
            os.environ[key] = value.strip().strip('"').strip("'")


def main() -> None:
    load(Path("/etc/mapa-unificado/auth.env"))
    load(Path("/etc/mapa-unificado/unified-auth.env"))
    sys.path.insert(0, "/opt/concrefer-unificado/mapa-api")
    from unified_auth import reapply_unified_hashes
    print(f"confirmed_unified_hashes_reapplied={reapply_unified_hashes()}")


if __name__ == "__main__":
    main()
