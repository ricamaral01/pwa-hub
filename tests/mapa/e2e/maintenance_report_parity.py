"""Compare maintenance report filters and print PDF with the original page."""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path

import pymupdf as fitz
from playwright.sync_api import sync_playwright

from operacao_smoke import CHROME, OUT, URL, credentials, login_operacao

ROOT = Path(__file__).resolve().parents[3]
BEFORE = ROOT / ".work-mapa-unificado/operacao/index-before-desktop.html"
CASES = (("TODOS", "", ""), ("PARADA", "", ""), ("LIBERADA", "", ""),
         ("TODOS", "2026-10-01", "2026-10-04"))


def pdf_digest(data):
    doc = fitz.open(stream=data, filetype="pdf")
    items = []
    for page in doc:
        pixels = page.get_pixmap(matrix=fitz.Matrix(1.5, 1.5), alpha=False)
        items.append({"width": round(page.rect.width, 2), "height": round(page.rect.height, 2),
                      "text_sha256": hashlib.sha256(page.get_text().encode()).hexdigest(),
                      "image_sha256": hashlib.sha256(pixels.samples).hexdigest()})
    doc.close()
    return items


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--role", choices=("GERENCIA", "GESTOR", "MONTADOR", "APONTADOR"),
                        default="GERENCIA")
    args = parser.parse_args()
    account = credentials()
    snapshots = []
    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True, executable_path=CHROME)
        for variant in ("original", "unificado"):
            context = browser.new_context(viewport={"width": 1366, "height": 768},
                                          service_workers="block")
            page = context.new_page()
            writes = []
            page.on("request", lambda req: writes.append(req.url.split("?", 1)[0])
                if req.method not in {"GET", "HEAD"} and "/unified/login" not in req.url else None)
            login_operacao(page, account["MAPA_TEST_USER"],
                           account["MAPA_TEST_PASSWORD"], args.role)
            if variant == "original":
                page.route(URL, lambda route: route.fulfill(status=200,
                    content_type="text/html; charset=utf-8",
                    body=BEFORE.read_text(encoding="utf-8")))
                page.goto(URL, wait_until="domcontentloaded")
                page.wait_for_function(f"state.authUser?.role === '{args.role}'")
            page.evaluate("""async () => {
              setMode('RELATORIO_MANUTENCAO');
              await carregarFormasManutencaoSupabase();
              renderizarRelatorioManutencao();
            }""")
            cases = []
            for status, start, end in CASES:
                result = page.evaluate("""({status,start,end}) => {
                  document.getElementById('rmFiltroStatus').value=status;
                  document.getElementById('rmFiltroDataInicio').value=start;
                  document.getElementById('rmFiltroDataFim').value=end;
                  renderizarRelatorioManutencao();
                  return {total:document.getElementById('rmTabelaTotal')?.textContent,
                    rows:[...document.querySelectorAll('#rmTabelaBody tr')]
                      .map(row=>({text:row.innerText,classes:row.className})),
                    kpis:['manKpiS1','manKpiS2','manKpiS3','manKpiS4']
                      .map(id=>document.getElementById(id)?.textContent)};
                }""", {"status": status, "start": start, "end": end})
                cases.append({"filter": [status, start, end], **result})
            # Print the same filtered report through the existing print class.
            page.evaluate("""() => {
              document.getElementById('rmFiltroStatus').value='TODOS';
              document.getElementById('rmFiltroDataInicio').value='';
              document.getElementById('rmFiltroDataFim').value='';
              renderizarRelatorioManutencao();
              document.body.classList.add('print-relatorio-manutencao');
            }""")
            pdf = page.pdf(print_background=True, prefer_css_page_size=True)
            print_pages = pdf_digest(pdf)
            assert not writes, writes
            snapshots.append({"cases": cases, "print_pages": print_pages})
            context.close()
        browser.close()
    OUT.mkdir(parents=True, exist_ok=True)
    path = OUT / f"maintenance-report-{args.role.lower()}.json"
    path.write_text(json.dumps(snapshots, ensure_ascii=False, indent=2), encoding="utf-8")
    assert snapshots[0] == snapshots[1], str(path)
    print(json.dumps({"maintenance_report": "equal", "role": args.role,
                      "cases": len(CASES), "pdf_pages": len(snapshots[0]["print_pages"])}))


if __name__ == "__main__":
    main()
