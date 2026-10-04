"""Remove only the fixed Mega E2E row and its check from the isolated PCP DB."""
from __future__ import annotations

import os
from pathlib import Path
import sys

DATE = "2099-02-05"
FORM = "E2E-MEGA-SC01"


def main() -> None:
    for path in ("/etc/mapa-unificado/auth.env", "/etc/mapa-unificado/unified-auth.env"):
        for line in Path(path).read_text().splitlines():
            if line.strip() and not line.lstrip().startswith("#") and "=" in line:
                key, value = line.strip().split("=", 1)
                os.environ[key] = value.strip().strip('"').strip("'")
    sys.path.insert(0, "/opt/concrefer-unificado/mapa-api")
    from unified_auth import pcp_connect
    with pcp_connect() as conn, conn.cursor() as cur:
        cur.execute("SELECT id FROM public.programacoes WHERE data=%s AND codigo_forma=%s",
                    (DATE, FORM))
        ids = [row["id"] for row in cur.fetchall()]
        if len(ids) > 1:
            raise RuntimeError("More than one fixed synthetic Mega row; manual review required")
        if not ids:
            print("pcp_mega_probe_removed=0")
            return
        cur.execute("DELETE FROM public.apontamentos_mega WHERE programacao_id=%s", (ids[0],))
        checks = cur.rowcount
        cur.execute("DELETE FROM public.programacoes WHERE id=%s AND data=%s AND codigo_forma=%s",
                    (ids[0], DATE, FORM))
        print(f"pcp_mega_probe_removed={cur.rowcount} checks={checks}")


if __name__ == "__main__":
    main()
