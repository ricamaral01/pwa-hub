"""Compare original Mapa fed by frozen source rows with published test proxy."""

from __future__ import annotations

import json
import hashlib
from pathlib import Path
from urllib.parse import urlsplit

from playwright.sync_api import sync_playwright

from operacao_smoke import CHROME, OUT, URL, credentials, login_operacao


ROOT = Path(__file__).resolve().parents[3]
BEFORE = ROOT / ".work-mapa-unificado/operacao/index-before-desktop.html"
ORIGINAL_APP = ROOT / "mapa-concretagem/app.js"
FIXTURE = ROOT / ".work-mapa-unificado/defects-source-october.json"
SECTORS = ("", "Setor 1", "Setor 2", "Setor 3", "Setor 4")
START, END = "2026-10-01", "2026-10-04"


def run_variant(browser, variant: str, account: dict[str, str], fixture: dict,
                start: str = START, end: str = END) -> list[dict]:
    context = browser.new_context(viewport={"width": 1366, "height": 768},
                                  service_workers="block")
    page = context.new_page()
    external, served, api_reads = [], [], []
    page.on("request", lambda request: external.append(urlsplit(request.url).hostname)
            if urlsplit(request.url).hostname not in {"concrefer.concretrack.com.br"}
            else None)
    page.on("request", lambda request: api_reads.append(urlsplit(request.url).path.rsplit("/", 1)[-1])
            if "/unificado/mapa/api/rest/v1/" in urlsplit(request.url).path
            and urlsplit(request.url).path.rsplit("/", 1)[-1] in {"montagem_poste", "producao"}
            else None)
    login_operacao(page, account["MAPA_TEST_USER"], account["MAPA_TEST_PASSWORD"])
    if variant == "original":
        page.route("**/unificado/mapa/operacao/app.js*", lambda route: route.fulfill(
            status=200, content_type="application/javascript; charset=utf-8",
            body=ORIGINAL_APP.read_text(encoding="utf-8")))
        page.route(URL, lambda route: route.fulfill(status=200,
                   content_type="text/html; charset=utf-8",
                   body=BEFORE.read_text(encoding="utf-8")))
        page.goto(URL, wait_until="domcontentloaded")
        page.wait_for_function("state.authUser?.role === 'GERENCIA'")

        def from_fixture(route):
            path = urlsplit(route.request.url).path
            table = path.rsplit("/", 1)[-1]
            key = f"{table}:{START}:{END}"
            if key not in fixture:
                raise RuntimeError(f"Unexpected fixture table: {table}")
            range_header = route.request.headers.get("range", "0-999")
            lo, hi = (int(value) for value in range_header.split("-", 1))
            source_rows = fixture[key]["official"]
            if table == "producao":
                source_rows = [row for row in source_rows
                               if start <= str(row.get("data_fabricacao") or "")[:10] <= end]
            rows = source_rows[lo:hi + 1]
            served.append({"table": table, "range": range_header, "rows": len(rows)})
            route.fulfill(status=200, content_type="application/json",
                          headers={"Content-Range": f"{lo}-{lo + len(rows) - 1}/*"},
                          body=json.dumps(rows, ensure_ascii=False))

        page.route("**/unificado/mapa/api/rest/v1/montagem_poste?*", from_fixture)
        page.route("**/unificado/mapa/api/rest/v1/producao?*", from_fixture)

    page.evaluate("setMode('DASHBOARD_DEFEITOS')")
    page.wait_for_timeout(1200)
    results = []
    for sector in SECTORS:
        api_reads.clear()
        result = page.evaluate("""async ({start,end,sector}) => {
          document.getElementById('dfDataInicio').value=start;
          document.getElementById('dfDataFim').value=end;
          document.getElementById('dfFiltroSetor').value=sector;
          document.getElementById('dfFiltroStatus').value='';
          document.getElementById('dfFiltroPesquisa').value='';
          await carregarDashboardDefeitos(true);
          const base = await obterBaseDashboardDefeitos(start,end);
          const evaluationRows = removerReprovacoesDuplicadasDashboard(base.montagemRes.rows || [])
            .filter(row => isLinhaAvaliacaoDefeitosDashboard(row)
              && getMiDataReferencia(row) >= start && getMiDataReferencia(row) <= end
              && (!sector || row.setor === sector));
          const eventKeys=[], inspectionKeys=[], rowEventKeys=[], eventGroups=new Map();
          for(const row of evaluationRows){
            const originalId = String(row.id || row.key || '')
              .split(`||${ETAPA_HISTORICO_REPROVACAO}||`)[0];
            const posteKey = String(row.record_id || originalId ||
              `${row.data_fabricacao || ''}||${row.setor || ''}||${row.forma_numero || ''}||${row.modelo || ''}`);
            for(const defect of obterDefeitosRegistradosLinha(row)){
              const eventKey=JSON.stringify([posteKey,defect]);
              const inspectionKey=JSON.stringify([posteKey,
                Date.parse(row.inicio_inspecao_montagem || ''),
                Date.parse(row.finalizado_em || ''),defect]);
              eventKeys.push(eventKey);
              inspectionKeys.push(inspectionKey);
              rowEventKeys.push(JSON.stringify([row.id,defect]));
              if(!eventGroups.has(eventKey)) eventGroups.set(eventKey,[]);
              eventGroups.get(eventKey).push([
                String(row.etapa || ''),String(row.status_montagem || ''),
                isHistoricoReprovacao(row)?'history':'regular'].join('/'));
            }
          }
          const repeatedPatterns={};
          for(const entries of eventGroups.values()){
            if(entries.length<2) continue;
            const pattern=entries.sort().join(' + ');
            repeatedPatterns[pattern]=(repeatedPatterns[pattern]||0)+1;
          }
          return {
            exportData: miDefeitosExportData,
            visibleText: document.getElementById('dfContent').innerText,
            visibleRows: [...document.querySelectorAll(
              '#dfContent .mi-defeitos-row, #dfContent .df-defect-entry, '
              + '#dfContent .df-defect-share-row, #dfContent .mi-defeito-tipo-row, '
              + '#dfContent .df-slide-ranking-row, '
              + '#dfContent .df-slide-sector-card, #dfContent .df-slide-matrix-row:not(.head)')]
              .map(row=>row.innerText),
            eventAudit: {evaluationRows:evaluationRows.length,events:eventKeys.length,
              uniqueInspectionDefects:new Set(inspectionKeys).size,
              uniquePosteDefects:new Set(eventKeys).size,
              duplicatePosteDefects:eventKeys.length-new Set(eventKeys).size,
              duplicateWithinRow:rowEventKeys.length-new Set(rowEventKeys).size,
              repeatedPatterns},
            contentClasses: [...new Set([...document.querySelectorAll('#dfContent *')]
              .map(node=>typeof node.className==='string'?node.className:'').filter(Boolean))].slice(0,40)
          };
        }""", {"start": start, "end": end, "sector": sector})
        if not sector:
            with page.expect_download() as csv_download:
                page.evaluate("exportarDashboardDefeitosCsv()")
            csv_text = Path(csv_download.value.path()).read_bytes().decode("utf-8-sig")
            result["csv_preview"] = csv_text[:300]
            result["csv_total"] = next((line.split(";", 1)[1].strip().strip('"')
                                         for line in csv_text.splitlines()
                                         if line.lstrip('"').startswith("Ocorrencias de NC\";")), None)
        assert result["exportData"] and result["visibleText"]
        results.append({"sector": sector or "Todos", "api_reads": list(api_reads), **result})
    context.close()
    assert not external, external
    return results, served


def main() -> None:
    fixture = json.loads(FIXTURE.read_text(encoding="utf-8"))
    account = credentials()
    periods = (("2026-10-01", "2026-10-01"),
               ("2026-10-02", "2026-10-02"),
               (START, END))
    evidence = []
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True, executable_path=CHROME)
        for start, end in periods:
            original, served = run_variant(browser, "original", account, fixture, start, end)
            test, _ = run_variant(browser, "test", account, fixture, start, end)
            evidence.append((start, end, original, test, served))
        browser.close()
    pairs = []
    digest = lambda value: hashlib.sha256(json.dumps(
        value, sort_keys=True, ensure_ascii=False, separators=(",", ":")).encode()).hexdigest()
    for start, end, original, test, served in evidence:
      for left, right in zip(original, test):
        pairs.append({"period": [start, end], "sector": left["sector"],
                      "totals_equal": left["exportData"]["kpis"] == right["exportData"]["kpis"],
                      "by_defect_equal": left["exportData"]["byDefect"] == right["exportData"]["byDefect"],
                      "by_sector_equal": left["exportData"]["bySector"] == right["exportData"]["bySector"],
                      "visible_rows_equal": left["visibleRows"] == right["visibleRows"],
                      "visible_text_equal": left["visibleText"] == right["visibleText"],
                      "original_kpis": left["exportData"]["kpis"],
                      "test_kpis": right["exportData"]["kpis"],
                      "original_visible_rows": len(left["visibleRows"]),
                      "test_visible_rows": len(right["visibleRows"]),
                      "original_by_defect_hash": digest(left["exportData"]["byDefect"]),
                      "test_by_defect_hash": digest(right["exportData"]["byDefect"]),
                      "original_by_sector_hash": digest(left["exportData"]["bySector"]),
                      "test_by_sector_hash": digest(right["exportData"]["bySector"]),
                      "original_by_defect": left["exportData"]["byDefect"],
                      "test_by_defect": right["exportData"]["byDefect"],
                      "original_by_sector": left["exportData"]["bySector"],
                      "test_by_sector": right["exportData"]["bySector"],
                      "original_csv_total": left.get("csv_total"),
                      "test_csv_total": right.get("csv_total"),
                      "original_csv_preview": left.get("csv_preview"),
                      "test_csv_preview": right.get("csv_preview"),
                      "original_displayed_lines": left["visibleRows"],
                      "test_displayed_lines": right["visibleRows"],
                      "original_api_reads": left["api_reads"],
                      "test_api_reads": right["api_reads"]})
        pairs[-1]["original_event_audit"] = left["eventAudit"]
        pairs[-1]["test_event_audit"] = right["eventAudit"]
        if left["sector"] == "Todos":
            pairs[-1]["content_classes"] = left["contentClasses"]
    OUT.mkdir(parents=True, exist_ok=True)
    path = OUT / "dashboard-defects-source-parity.json"
    path.write_text(json.dumps({"pairs": pairs, "source_fixture_requests": served},
                               ensure_ascii=False, indent=2), encoding="utf-8")
    totals = [{"period": item["period"], "before": item["original_kpis"]["total_erros"],
               "after": item["test_kpis"]["total_erros"]} for item in pairs
              if item["sector"] == "Todos"]
    print(json.dumps({"periods": totals, "sectors": len(pairs),
                      "evidence": str(path)}, ensure_ascii=False))
    assert all(item["test_kpis"]["total_erros"] ==
               item["original_event_audit"]["uniqueInspectionDefects"] for item in pairs)
    assert all(item["original_csv_total"] == str(item["original_kpis"]["total_erros"])
               and item["test_csv_total"] == str(item["test_kpis"]["total_erros"])
               for item in pairs if item["sector"] == "Todos")
    assert totals[-1]["before"] == 28 and totals[-1]["after"] == 14


if __name__ == "__main__":
    main()
