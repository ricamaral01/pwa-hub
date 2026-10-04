"""Compare local defect occurrence, treatment, filters and print PDF."""
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
DATE = "2099-02-01"


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
    writes = []
    def capture(req):
        if "/unificado/mapa/api/" in req.url and "/unified/login" not in req.url \
                and req.method not in {"GET", "HEAD"}:
            writes.append(req.method + " " + urlsplit(req.url).path)
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
    page.evaluate("""date => {
      setMode('TRATATIVA_DEFEITOS');
      document.getElementById('tdFiltroDataInicio').value=date;
      document.getElementById('tdFiltroDataFim').value=date;
      renderizarRelatorioTratativaDefeitos();
    }""", DATE)
    page.locator("#tdBtnNovaOcorrencia").click()
    page.locator("#mNovaSetor").select_option("Setor 3")
    page.locator("#mNovaForma").fill("E2E-RR")
    page.locator("#mNovaData").fill(DATE)
    page.locator("#mNovaModelo").fill("Modelo E2E")
    page.locator("#mNovaCodigoDefeito").select_option("A")
    page.locator("#mNovaObservacoes").fill("Ocorrência sintética")
    page.locator("#mNovaConfirmBtn").click()
    row = page.locator('#tdTabelaBody tr[data-id^="INC_MAN_2099-02-01_Setor 3_E2E-RR_A_"]')
    row.wait_for(state="visible", timeout=15000)
    created = {"text": row.inner_text(), "class": row.get_attribute("class"),
               "count": page.locator("#tdTabelaTotal").inner_text()}
    row.locator(".btn-tratar-defeito").click()
    page.locator("#mTratativaStatus").select_option("CONCLUIDO")
    page.locator("#mTratativaExecutadoPorSelect").select_option("OUTRO")
    page.locator("#mTratativaExecutadoPor").fill("Técnico E2E")
    page.locator("#mTratativaAcaoRealizada").fill("Tratativa sintética concluída")
    page.locator("#mTratativaConfirmBtn").click()
    page.wait_for_function("""() => document.querySelector('#tdTabelaBody tr[data-id^="INC_MAN_2099-02-01_"]')?.innerText.includes('CONCLU')""",
                           timeout=15000)
    treated = {"text": row.inner_text(), "class": row.get_attribute("class"),
               "count": page.locator("#tdTabelaTotal").inner_text(),
               "kpis": [page.locator("#" + id).inner_text() for id in
                        ("tdKpiTotal", "tdKpiPendentes", "tdKpiConcluidos", "tdKpiCriticos")]}
    stored = page.evaluate("""() => Object.values(getTratativaDefeitos()).map(record=>({
      data:record.data_fabricacao,setor:record.setor,forma:record.forma_numero,
      codigo:record.codigo_defeito,status:record.status_tratativa,
      executado:record.executado_por,acao:record.acao_realizada,
      observacoes:record.observacoes_origem}))""")
    assert len(stored) == 1 and stored[0]["status"] == "CONCLUIDO", stored
    page.evaluate("renderizarRelatorioTratativaDefeitos()")
    assert row.is_visible()
    page.evaluate("document.body.classList.add('print-relatorio-defeitos')")
    pdf = pdf_digest(page.pdf(print_background=True, prefer_css_page_size=True))
    page.evaluate("document.body.classList.remove('print-relatorio-defeitos')")
    assert not writes, writes
    context.close()
    return {"created": created, "treated": treated, "stored": stored, "pdf": pdf}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--role", choices=("GERENCIA", "GESTOR", "MONTADOR", "APONTADOR"),
                        default="GERENCIA")
    args = parser.parse_args()
    account = credentials()
    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True, executable_path=CHROME)
        original = run_variant(browser, "original", args.role, account)
        unified = run_variant(browser, "unificado", args.role, account)
        browser.close()
    OUT.mkdir(parents=True, exist_ok=True)
    path = OUT / f"defects-treatment-{args.role.lower()}.json"
    path.write_text(json.dumps({"original": original, "unificado": unified},
                               ensure_ascii=False, indent=2), encoding="utf-8")
    assert original == unified, str(path)
    print(json.dumps({"role": args.role, "defects_treatment": "equal",
                      "pdf_pages": len(original["pdf"]), "writes": 0}))


if __name__ == "__main__":
    main()
