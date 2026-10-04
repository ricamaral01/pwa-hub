"""Remove only the fixed synthetic Rateio E2E row from the isolated PCP DB."""
from __future__ import annotations

import os
from pathlib import Path
import sys

DATE = "2099-02-04"


def main() -> None:
    for path in ("/etc/mapa-unificado/auth.env", "/etc/mapa-unificado/unified-auth.env"):
        for line in Path(path).read_text().splitlines():
            if line.strip() and not line.lstrip().startswith("#") and "=" in line:
                key, value = line.strip().split("=", 1)
                os.environ[key] = value.strip().strip('"').strip("'")
    sys.path.insert(0, "/opt/concrefer-unificado/mapa-api")
    from unified_auth import pcp_connect

    with pcp_connect() as conn, conn.cursor() as cur:
        cur.execute("SELECT id FROM public.maodeobra WHERE data=%s AND setor_id IS NULL",
                    (DATE,))
        ids = [row["id"] for row in cur.fetchall()]
        if len(ids) > 1:
            raise RuntimeError("More than one synthetic Rateio row; manual review required")
        if not ids:
            print("pcp_rateio_probe_removed=0")
            return
        cur.execute("DELETE FROM public.maodeobra_rateio WHERE maodeobra_id=%s", (ids[0],))
        children = cur.rowcount
        cur.execute("DELETE FROM public.maodeobra WHERE id=%s AND data=%s AND setor_id IS NULL",
                    (ids[0], DATE))
        print(f"pcp_rateio_probe_removed={cur.rowcount} children={children}")


if __name__ == "__main__":
    main()
