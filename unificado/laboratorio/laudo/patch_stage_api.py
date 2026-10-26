"""Apply the report/public-verification changes to the older homolog API tree."""
from __future__ import annotations

import hashlib
from pathlib import Path
import sys


EXPECTED_STAGE_SHA256 = "6c48eb063fbbb9dbce0a81b70586fbd18c5230eac57376dd4d5767e5c4ac2511"
IMPORT = "from .postes_report_v2 import report_html_v2 as report_html, report_pdf_v2 as report_pdf\n"
FINALIZE_START = '    if inspection and (inspection["status"] == "PENDENTE"'
FINALIZE_END = '    if inspection and not record.numero_serie_poste:'
REPORT_START = '@router.get("/api/ensaios/{test_id}/relatorio", response_class=HTMLResponse)'


def patch(stage: str, production: str) -> str:
    if hashlib.sha256(stage.encode()).hexdigest() != EXPECTED_STAGE_SHA256:
        raise ValueError("Homolog API changed; review its diff before patching")
    assert stage.count(IMPORT) == production.count(IMPORT) == 1
    stage = stage.replace(IMPORT, IMPORT + "from .postes_public import report_url, valid_report_token, verification_html\n")
    for marker in (FINALIZE_START, FINALIZE_END, REPORT_START):
        assert stage.count(marker) == production.count(marker) == 1, marker
    old = stage[stage.index(FINALIZE_START):stage.index(FINALIZE_END)]
    new = production[production.index(FINALIZE_START):production.index(FINALIZE_END)]
    stage = stage.replace(old, new)
    stage = stage[:stage.index(REPORT_START)] + production[production.index(REPORT_START):]
    return stage


if __name__ == "__main__":
    stage_path, production_path, output_path = map(Path, sys.argv[1:4])
    source = patch(stage_path.read_text(encoding="utf-8"), production_path.read_text(encoding="utf-8"))
    output_path.write_text(source, encoding="utf-8", newline="\n")
