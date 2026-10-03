"""Compare final Mapa UI text/classes with official vs test row order, read only."""

from __future__ import annotations

import json
from pathlib import Path
import re
from urllib.parse import parse_qsl, urlsplit

from playwright.sync_api import sync_playwright

from operacao_smoke import CHROME, OUT, URL, credentials, login_operacao


PAIRS = OUT.parent / "order-pairs-private.json"


def signature(path: str) -> tuple:
    parsed = urlsplit(path)
    short = parsed.path.replace("/unificado/mapa/api", "", 1)
    return short, tuple(sorted(parse_qsl(parsed.query, keep_blank_values=True)))


def main() -> None:
    data = json.loads(PAIRS.read_text(encoding="utf-8"))
    lookup = {signature(item["path"]): item for item in data}
    account = credentials()
    outputs = {}
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True, executable_path=CHROME)
        for side in ("source", "test"):
            context = browser.new_context(viewport={"width": 1024, "height": 768},
                                          service_workers="block")
            matched = []
            def route(request_route):
                req = request_route.request
                if req.method == "GET" and signature(req.url) in lookup:
                    item = lookup[signature(req.url)]
                    matched.append(item["path"])
                    request_route.fulfill(status=200, content_type="application/json",
                                          body=json.dumps(item[side], ensure_ascii=False))
                else:
                    request_route.continue_()
            context.route("**/*", route)
            page = context.new_page()
            login_operacao(page, account["MAPA_TEST_USER"], account["MAPA_TEST_PASSWORD"])
            result = {}
            result["status_cards"] = page.evaluate("""async () => {
                setMode('LIBERACAO_S3'); el.libData.value='2026-10-02';
                await loadClickedFormsFromSupabase('2026-10-02'); renderLiberacaoDual();
                return [...document.querySelectorAll('#libSetor3Cols .forma-card')]
                    .map(card => [card.className,card.innerText]);
            }""")
            result["dashboard"] = page.evaluate("""async () => {
                setMode('PROD_ANALISE'); await carregarDadosGlobaisDashboard('2026-10-02');
                renderDashboardCharts();
                return ['dbKpiProd','dbKpiIns','dbKpiA','dbKpiR','dbKpiRR','dbKpiRejPct',
                        'dbTbodyMontagemResumo'].map(id => document.getElementById(id)?.innerText);
            }""")
            result["acmp"] = page.evaluate("""async () => {
                setMode('ACMP_CONCRETAGEM'); el.acmpData.value='2026-10-02';
                await renderAcmpConcretagem();
                return el.acmpOutput?.innerText;
            }""")
            result["report"] = page.evaluate("""async () => {
                setMode('RELATORIO'); el.relData.value='2026-10-02'; el.relSetor.value='Setor 3';
                await gerarRelatorioSetor();
                return el.relOutput?.innerText || document.querySelector('#viewRelatorio')?.innerText;
            }""")
            result["report"] = re.sub(r"Emitido: \d\d/\d\d/\d{4}, \d\d:\d\d:\d\d",
                                       "Emitido: [horário dinâmico]", result["report"] or "")
            result["inspection"] = page.evaluate("""async () => {
                setMode('INSPECAO'); el.insFiltroData.value='2026-10-02';
                await renderInspecaoLiberados();
                return document.querySelector('#viewInspecao')?.innerText;
            }""")
            result["sector_data"] = page.evaluate("""async () => {
                const dashboard = await getRowsForDashboard('2026-10-02','Setor 3');
                const pending = await postToApi('listar_inspecao_pendentes',
                    {data:'2026-10-02',setor:'Setor 3'});
                const report = await postToApi('relatorio_setor',
                    {data:'2026-10-02',setor:'Setor 3'});
                return {
                    dashboardTotal: dashboard.rows.length,
                    dashboardLiberado: dashboard.rows.filter(r => r.liberacao_status === '1').length,
                    pendingTotal: pending.pendentes?.length,
                    reportSummary: report.relatorio
                };
            }""")
            result["matched_queries"] = len(set(matched))
            result["matched_cases"] = sorted({next(i for i, item in enumerate(data, 1)
                                                   if item["path"] == path) for path in matched})
            outputs[side] = result
            context.close()
        browser.close()
    comparison = {key: {"equal": outputs["source"][key] == outputs["test"][key],
                        "source_length": len(str(outputs["source"][key])),
                        "test_length": len(str(outputs["test"][key]))}
                  for key in outputs["source"] if key != "matched_queries"}
    report = {"comparison": comparison,
              "matched_queries": [outputs["source"]["matched_queries"],
                                  outputs["test"]["matched_queries"]],
              "matched_cases": [outputs["source"]["matched_cases"],
                                outputs["test"]["matched_cases"]]}
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "order-render.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
    (OUT / "order-render-private.json").write_text(
        json.dumps(outputs, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(report))


if __name__ == "__main__":
    main()
