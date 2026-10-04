"""Extract October defect dashboard response bodies into a private test fixture."""

from __future__ import annotations

import json
import os
from pathlib import Path


SOURCE = Path("/opt/concrefer-unificado/migration/defects-source-fixtures.json")
OUT = Path("/opt/concrefer-unificado/migration/defects-source-october.json")


def main() -> None:
    data = json.loads(SOURCE.read_text(encoding="utf-8"))
    wanted = ("montagem_poste:2026-10-01:2026-10-04",
              "producao:2026-10-01:2026-10-04")
    fixture = {key: data["fixtures"][key] for key in wanted}
    fd = os.open(OUT, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
    with os.fdopen(fd, "w", encoding="utf-8") as stream:
        json.dump(fixture, stream, ensure_ascii=False, separators=(",", ":"))
    print(f"private_fixture_bytes={OUT.stat().st_size} periods={len(fixture)}")


if __name__ == "__main__":
    main()
