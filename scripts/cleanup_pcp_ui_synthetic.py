"""Delete only a named synthetic PCP user from the isolated test DB."""

from __future__ import annotations

import os
from pathlib import Path
import re
import sys


def main() -> None:
    username = sys.argv[1]
    if not re.fullmatch(r"pcp-ui-probe-[0-9a-f]{12}", username):
        raise ValueError("Only a generated PCP UI probe may be removed")
    for path in ("/etc/mapa-unificado/auth.env", "/etc/mapa-unificado/unified-auth.env"):
        for line in Path(path).read_text().splitlines():
            if line.strip() and not line.lstrip().startswith("#") and "=" in line:
                key, value = line.strip().split("=", 1)
                os.environ[key] = value.strip().strip('"').strip("'")
    sys.path.insert(0, "/opt/mapa-unificado-api")
    from unified_auth import pcp_connect
    with pcp_connect() as conn, conn.cursor() as cur:
        cur.execute("DELETE FROM public.usuarios WHERE username=%s", (username,))
        print(f"pcp_ui_synthetic_removed={cur.rowcount}")


if __name__ == "__main__":
    main()
