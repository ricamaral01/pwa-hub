"""Read-only PDF comparison of official PCP and isolated test frontend."""

from __future__ import annotations

import hashlib
import argparse
import json
from pathlib import Path
import sys
from urllib.parse import urlsplit

import fitz
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "scripts"))
from audit_pcp_api_parity import APIS, token

CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
OUT = ROOT / ".work-mapa-unificado" / "pcp-print"
CASES = ("relatorio-producao", "relatorio-programacao-s3",
         "relatorio-programacao-s4", "pcp-diario", "etiquetas",
         "etiquetas-sc", "etiquetas-armaduras")


def pages_digest(pdf: bytes) -> dict:
    document = fitz.open(stream=pdf, filetype="pdf")
    pages = []
    for page in document:
        pixmap = page.get_pixmap(matrix=fitz.Matrix(1.5, 1.5), alpha=False)
        pages.append({"width_pt": round(page.rect.width, 2),
                      "height_pt": round(page.rect.height, 2),
                      "text_sha256": hashlib.sha256(page.get_text().encode()).hexdigest(),
                      "image_sha256": hashlib.sha256(pixmap.samples).hexdigest()})
    return {"page_count": len(pages), "pages": pages}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument('--report-start', default='2026-10-02')
    parser.add_argument('--report-days', default='1')
    parser.add_argument('--label-date', default='2026-10-02')
    parser.add_argument('--label-count', type=int, default=2)
    parser.add_argument('--arm-start', default='2026-10-05')
    parser.add_argument('--arm-days', default='1')
    parser.add_argument('--print-css', default='')
    parser.add_argument('--all-postes', action='store_true')
    args = parser.parse_args()
    OUT.mkdir(parents=True, exist_ok=True)
    tokens = {key: token(*settings[:4]) for key, settings in APIS.items()}
    results = []
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True, executable_path=CHROME)
        for case in CASES:
            pair = {}
            for side in ("oficial", "copia"):
                base = "https://pcp.concretrack.com.br/pages/" if side == "oficial" else \
                    "https://concrefer.concretrack.com.br/unificado/pcp/"
                context = browser.new_context(viewport={"width": 1366, "height": 768},
                                              service_workers="block")
                api_host = urlsplit(base).hostname
                blocked = []
                def restrict(route):
                    request = route.request
                    host = urlsplit(request.url).hostname
                    if side == "oficial" and request.method not in {"GET", "HEAD"}:
                        blocked.append({"method": request.method,
                                        "path": urlsplit(request.url).path})
                        route.abort()
                    elif host not in {api_host} and (side == "copia" or host not in
                                                    {"cdn.jsdelivr.net", "fonts.googleapis.com", "fonts.gstatic.com"}):
                        blocked.append({"host": host, "path": urlsplit(request.url).path})
                        route.abort()
                    else:
                        route.continue_()
                context.route("**/*", restrict)
                context.add_init_script(
                    "localStorage.setItem('pcp_token', " + json.dumps(tokens[side]) + ");"
                    "localStorage.setItem('pcp_user', JSON.stringify("
                    "{nome:'Auditoria',nivel_acesso:'ADMIN'}));")
                page = context.new_page()
                errors = []
                api_responses = []
                page.on("pageerror", lambda error: errors.append(str(error)[:160]))
                page.on("response", lambda response: api_responses.append(
                    {"path": urlsplit(response.url).path, "status": response.status})
                    if "/api/" in urlsplit(response.url).path else None)
                response = page.goto(base + case + "/", wait_until="domcontentloaded",
                                     timeout=30000)
                page.wait_for_timeout(1800)
                if case in {"relatorio-producao", "relatorio-programacao-s3",
                            "relatorio-programacao-s4"}:
                    page.wait_for_function("() => !document.querySelector('#report-status')?.textContent.includes('Carregando')", timeout=15000)
                    page.evaluate("""([start, days]) => {
                      document.querySelector('#report-start').value = start;
                      document.querySelector('#report-days').value = days;
                      return loadReport();
                    }""", [args.report_start, args.report_days])
                    page.wait_for_function("() => document.querySelectorAll('#report-pages .report-paper').length >= 1", timeout=15000)
                elif case == "pcp-diario":
                    page.wait_for_function("() => document.querySelector('#resumo')?.textContent.includes('linhas exibidas')", timeout=20000)
                elif case in {"etiquetas", "etiquetas-sc"}:
                    page.locator("#f-data").fill("2026-10-01" if case == "etiquetas-sc" else args.label_date)
                    page.evaluate("loadPostesProgramados()")
                    count = page.locator(".poste-check").count()
                    assert count > 0, f"No {case} items available for print comparison"
                    if args.all_postes:
                        page.evaluate("document.querySelectorAll('.poste-check').forEach(input => input.checked = true)")
                    else:
                        page.locator(".poste-check").first.check()
                    page.evaluate("gerarEtiquetasSelecionadas()")
                    page.evaluate("""count => document.querySelectorAll('.label-print-check').forEach(
                          (input,index) => {input.checked=index<count;
                           input.closest('.label-pair').classList.toggle('print-selected',index<count)})""", args.label_count)
                elif case == "etiquetas-armaduras":
                    page.locator("#arm-start").fill(args.arm_start)
                    page.locator("#arm-days").fill(args.arm_days)
                    page.locator("#arm-load").click()
                    page.wait_for_function("() => !document.querySelector('#arm-status')?.textContent.includes('Carregando')", timeout=20000)
                    page.locator(".arm-template").evaluate_all("els => els.forEach(el => {if (!el.value) el.selectedIndex=1})")
                    page.evaluate("generateArmaduras()")
                    assert page.locator(".arm-label").count() > 0, "No armadura labels generated"
                if side == 'copia' and args.print_css:
                    page.add_style_tag(content='@media print{' + args.print_css + '}')
                pdf = page.pdf(print_background=True, prefer_css_page_size=True)
                info = pages_digest(pdf)
                info.update({"http": response.status if response else None,
                             "location": urlsplit(page.url).path,
                             "blocked": blocked, "errors": errors,
                             "api_responses": api_responses,
                             "label_options": count if case in {"etiquetas", "etiquetas-sc"} else None,
                             "armadura_labels": page.locator(".arm-label").count() if case == "etiquetas-armaduras" else None,
                             "body_excerpt": page.locator("body").inner_text()[:160]})
                (OUT / f"{case}-{side}.pdf").write_bytes(pdf)
                pair[side] = info
                context.close()
            results.append({"case": case, "same_pages": pair["oficial"]["pages"] == pair["copia"]["pages"],
                            "oficial": pair["oficial"], "copia": pair["copia"]})
        browser.close()
    suffix = f"{args.report_start}-{args.report_days}-{args.label_date}-{args.label_count}-{args.arm_start}-{args.arm_days}-all{int(args.all_postes)}"
    (OUT / f"report-{suffix}.json").write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8")
    for result in results:
        print(json.dumps({"case": result["case"], "same_pages": result["same_pages"],
                          "page_count": [result[side]["page_count"] for side in ("oficial", "copia")],
                          "http": [result[side]["http"] for side in ("oficial", "copia")],
                          "blocked": [result[side]["blocked"] for side in ("oficial", "copia")],
                          "errors": [result[side]["errors"] for side in ("oficial", "copia")]},
                         ensure_ascii=False))


if __name__ == "__main__":
    main()
