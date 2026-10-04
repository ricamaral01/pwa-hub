"""Compare Acompanhamento load, local note save and print PDF."""
from __future__ import annotations

import argparse
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
from urllib.parse import urlsplit

import pymupdf
from playwright.sync_api import sync_playwright

from operacao_smoke import CHROME, OUT, URL, credentials, login_operacao

ROOT = Path(__file__).resolve().parents[3]
BEFORE = ROOT / ".work-mapa-unificado/operacao/index-before-desktop.html"
DATE = "2026-10-02"
CASES = (("data", "Setor 1"), ("data", "Setor 3"),
         ("pendentes", "Setor 1"), ("pendentes", "Setor 3"))


def digest(value):
    return hashlib.sha256(json.dumps(value, ensure_ascii=False,
                                     sort_keys=True).encode()).hexdigest()


def pdf_digest(raw):
    doc = pymupdf.open(stream=raw, filetype="pdf")
    pages = []
    for page in doc:
        pix = page.get_pixmap(matrix=pymupdf.Matrix(1.5, 1.5), alpha=False)
        pages.append({"text": hashlib.sha256(page.get_text().encode()).hexdigest(),
                      "pixels": hashlib.sha256(pix.samples).hexdigest()})
    doc.close()
    return pages


def run_variant(browser, variant, role, account):
    context = browser.new_context(viewport={"width": 1024, "height": 768},
                                  service_workers="block")
    page = context.new_page()
    reads, writes = [], []

    def capture(req):
        if "/unificado/mapa/api/" not in req.url or "/unified/login" in req.url:
            return
        parts = urlsplit(req.url)
        signature = parts.path + "?" + parts.query
        if req.method in {"GET", "HEAD"}:
            reads.append(signature)
        else:
            writes.append(req.method + " " + signature)

    page.on("request", capture)
    login_operacao(page, account["MAPA_TEST_USER"],
                   account["MAPA_TEST_PASSWORD"], role)
    if variant == "original":
        page.route(URL, lambda route: route.fulfill(status=200,
            content_type="text/html; charset=utf-8",
            body=BEFORE.read_text(encoding="utf-8")))
        page.goto(URL, wait_until="domcontentloaded")
        page.wait_for_function(f"state.authUser?.role === '{role}'")
    page.clock.pause_at(datetime(2026, 10, 4, 6, 0, tzinfo=timezone.utc))
    page.evaluate("setMode('ACMP_CONCRETAGEM')")
    output = []
    for mode, sector in CASES:
        reads.clear()
        result = page.evaluate("""async ({date,mode,sector}) => {
          el.acmpData.value=date;
          el.acmpModoCarga.value=mode;
          el.acmpSetor.value=sector;
          await renderAcmpConcretagem();
          const root=el.acmpOutput;
          const first=root.querySelector('tr[data-acmp-forma]');
          if(first){
            first.querySelector('input[data-acmp-traco]').value='E2E-traço';
            first.querySelector('input[data-acmp-obs]').value='E2E-observação';
          }
          salvarAcmp();
          const notes=readAcmpNotes();
          const key=first?getAcmpNoteKey(date,first.dataset.acmpSetor,
                                         first.dataset.acmpForma):null;
          const saved=key?notes[key]:null;
          await renderAcmpConcretagem();
          const restored=root.querySelector('tr[data-acmp-forma]');
          return {text:root.innerText,rows:root.querySelectorAll('tr[data-acmp-forma]').length,
            saved,restored:restored?{
              traco:restored.querySelector('input[data-acmp-traco]').value,
              obs:restored.querySelector('input[data-acmp-obs]').value}:null,
            feedback:el.acmpFeedback.innerText};
        }""", {"date": DATE, "mode": mode, "sector": sector})
        page.evaluate("imprimirAcmp()")
        pdf = pdf_digest(page.pdf(print_background=True, prefer_css_page_size=True))
        output.append({"mode": mode, "sector": sector, "result": result,
                       "reads": sorted(digest(item) for item in reads), "pdf": pdf})
    assert not writes, writes
    context.close()
    return output


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--role", choices=("GERENCIA", "GESTOR"),
                        default="GERENCIA")
    args = parser.parse_args()
    account = credentials()
    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True, executable_path=CHROME)
        original = run_variant(browser, "original", args.role, account)
        unified = run_variant(browser, "unificado", args.role, account)
        browser.close()
    OUT.mkdir(parents=True, exist_ok=True)
    path = OUT / f"acompanhamento-ui-{args.role.lower()}.json"
    path.write_text(json.dumps({"original": original, "unificado": unified},
                               ensure_ascii=False, indent=2), encoding="utf-8")
    differences = [{"mode": a["mode"], "sector": a["sector"],
                    "values_equal": a["result"] == b["result"],
                    "reads_equal": a["reads"] == b["reads"],
                    "pdf_equal": a["pdf"] == b["pdf"]}
                   for a, b in zip(original, unified) if a != b]
    print(json.dumps({"role": args.role, "cases": len(original),
                      "differences": differences, "writes": 0}, ensure_ascii=False))
    assert not differences, str(path)


if __name__ == "__main__":
    main()
