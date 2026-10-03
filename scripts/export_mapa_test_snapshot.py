"""Export safe API views from the test PostgreSQL for offline browser capture.

Data stays under ignored .work-mapa-unificado/snapshot/ and is never staged.
The source is the test VPS only; no official host is contacted.
"""

import hashlib
import json
from pathlib import Path
import subprocess


ROOT = Path(__file__).resolve().parents[1] / ".work-mapa-unificado" / "snapshot"
VIEWS = ("usuarios", "programacao_pcp", "liberacao_formas", "producao",
         "montagem_poste", "formas_manutencao", "prog_s3_s4", "vw_formas_status")


def main():
    ROOT.mkdir(parents=True, exist_ok=True)
    manifest = {}
    for view in VIEWS:
        sql = f"COPY (SELECT row_to_json(row)::text FROM api.{view} AS row) TO STDOUT;\n"
        result = subprocess.run(["ssh", "vps-staging", "sudo", "-u", "postgres", "psql",
                                 "-X", "-q", "-d", "mapa_unificado_teste"],
                                input=sql.encode(), stdout=subprocess.PIPE,
                                stderr=subprocess.PIPE, check=True)
        raw = result.stdout
        rows = [json.loads(line) for line in raw.splitlines() if line]
        if rows and any("senha" in key.lower() or "password" in key.lower() or "secret" in key.lower()
                        for key in rows[0]):
            raise RuntimeError(f"Sensitive column exposed by api.{view}")
        target = ROOT / (view + ".jsonl")
        target.write_bytes(raw)
        manifest[view] = {"rows": len(rows), "bytes": len(raw),
                          "sha256": hashlib.sha256(raw).hexdigest()}
        print(f"{view} rows={len(rows)} bytes={len(raw)}")
    (ROOT / "manifest.json").write_text(json.dumps(manifest, indent=2, sort_keys=True) + "\n",
                                       encoding="utf-8")
    print(f"total_rows={sum(item['rows'] for item in manifest.values())} local_only={ROOT}")


if __name__ == "__main__":
    main()
