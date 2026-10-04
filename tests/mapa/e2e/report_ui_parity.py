"""Compare production supervisor report, filters and print PDF on test data."""
from __future__ import annotations

import argparse
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import re
from urllib.parse import parse_qs, urlsplit

import pymupdf
from playwright.sync_api import sync_playwright

from operacao_smoke import CHROME, OUT, URL, credentials, login_operacao

ROOT = Path(__file__).resolve().parents[3]
BEFORE = ROOT / ".work-mapa-unificado/operacao/index-before-desktop.html"
DATE = "2026-10-03"


def pdf_digest(data):
    doc = pymupdf.open(stream=data, filetype="pdf")
    pages = []
    for page in doc:
        pix = page.get_pixmap(matrix=pymupdf.Matrix(1.5, 1.5), alpha=False)
        pages.append({"text_sha256": hashlib.sha256(page.get_text().encode()).hexdigest(),
                      "image_sha256": hashlib.sha256(pix.samples).hexdigest(),
                      "size": [round(page.rect.width, 1), round(page.rect.height, 1)]})
    doc.close()
    return pages


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--role", choices=("GERENCIA", "GESTOR"), default="GERENCIA")
    parser.add_argument("--sector", type=int, choices=(1, 2, 3, 4), default=1)
    parser.add_argument("--share", action="store_true")
    parser.add_argument("--print-css", default="")
    args = parser.parse_args()
    account = credentials()
    results = []
    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True, executable_path=CHROME)
        for variant in ("original", "unificado"):
            context = browser.new_context(viewport={"width": 1366, "height": 768},
                                          service_workers="block", accept_downloads=True)
            share_urls = []
            context.route("https://api.whatsapp.com/**",
                          lambda route: (share_urls.append(route.request.url), route.abort()))
            page = context.new_page()
            writes = []
            page.on("request", lambda req: writes.append(req.url)
                if req.method not in {"GET", "HEAD"} and "/unified/login" not in req.url else None)
            login_operacao(page, account["MAPA_TEST_USER"],
                           account["MAPA_TEST_PASSWORD"], args.role)
            if variant == "original":
                page.route(URL, lambda route: route.fulfill(status=200,
                    content_type="text/html; charset=utf-8",
                    body=BEFORE.read_text(encoding="utf-8")))
                page.goto(URL, wait_until="domcontentloaded")
                page.wait_for_function(f"state.authUser?.role === '{args.role}'")
            page.clock.pause_at(datetime(2026, 10, 4, 6, 0, tzinfo=timezone.utc))
            report = page.evaluate("""async ({date,sector}) => {
              setMode('RELATORIO');
              el.relData.value=date;
              el.relSetor.value='Setor '+sector;
              el.relEncarregado.value='Encarregado E2E';
              await gerarRelatorioSetor();
              const doc=document.querySelector('#relPrintDoc');
              if(!doc) throw new Error('Report not generated');
              return {text:doc.innerText,html:doc.innerHTML,
                kpis:[...doc.querySelectorAll('.rel-kpi-grid strong')].map(n=>n.innerText)};
            }""", {"date": DATE, "sector": args.sector})
            page.evaluate("document.body.classList.add('print-relatorio')")
            if variant != "original" and args.print_css:
                page.add_style_tag(content="@media print{" + args.print_css + "}")
            pdf_bytes = page.pdf(print_background=True, prefer_css_page_size=True)
            OUT.mkdir(parents=True, exist_ok=True)
            (OUT / f"report-{args.role.lower()}-s{args.sector}-{variant}.pdf").write_bytes(pdf_bytes)
            pages = pdf_digest(pdf_bytes)
            assert not writes, writes
            report["text"] = re.sub(r"\b\d{2}/\d{2}/\d{4},? \d{2}:\d{2}(?::\d{2})?\b",
                                    "[gerado]", report["text"])
            report.pop("html")
            if args.share:
                page.clock.resume()
                page.evaluate("async () => await enviarRelatorioWhatsapp()")
                page.wait_for_timeout(900)
                assert len(share_urls) == 1, {"variant": variant, "share_urls": share_urls}
                share_text = parse_qs(urlsplit(share_urls[0]).query)["text"][0]
            else:
                share_text = None
            results.append({"report": report, "pdf": pages, "share_text": share_text})
            context.close()
        browser.close()
    OUT.mkdir(parents=True, exist_ok=True)
    path = OUT / f"report-{args.role.lower()}-s{args.sector}.json"
    path.write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8")
    assert results[0] == results[1], str(path)
    print(json.dumps({"report": "equal", "role": args.role,
                      "sector": args.sector, "pdf_pages": len(results[0]["pdf"])}))


if __name__ == "__main__":
    main()
