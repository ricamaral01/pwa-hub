"""Compare the three dashboard filters and final values with original HTML."""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
from urllib.parse import urlsplit

from playwright.sync_api import sync_playwright

from operacao_smoke import CHROME, OUT, URL, credentials, login_operacao

ROOT = Path(__file__).resolve().parents[3]
BEFORE = ROOT / ".work-mapa-unificado/operacao/index-before-desktop.html"
CASES = (
    ("2026-10-01", "2026-10-03", "", "", "", "15"),
    ("2026-09-30", "2026-10-01", "Setor 1", "A", "", "10"),
    ("2026-10-03", "2026-10-04", "Setor 3", "R", "SC", "20"),
    ("2026-10-01", "2026-10-03", "Setor 2", "RR", "", "15"),
    ("2026-10-01", "2026-10-03", "Setor 4", "", "DTB", "15"),
    ("2026-10-01", "2026-10-03", "Setores 1 e 2", "", "", "15"),
)
MODES = (
    ("PROD_ANALISE", "pa", "carregarProdutividadeConcretagem"),
    ("MONTAGEM_INDICADORES", "mi", "carregarMontagemIndicadores"),
    ("DASHBOARD_DEFEITOS", "df", "carregarDashboardDefeitos"),
)


def digest(value):
    return hashlib.sha256(json.dumps(value, ensure_ascii=False,
                                     sort_keys=True).encode()).hexdigest()


def run_variant(browser, variant, role, account):
    context = browser.new_context(viewport={"width": 1024, "height": 768},
                                  service_workers="block")
    page = context.new_page()
    requests, writes, external = [], [], []

    def capture(req):
        if "/unificado/mapa/api/" in req.url:
            address = urlsplit(req.url)
            signature = address.path + "?" + address.query
            if req.method in {"GET", "HEAD"} or "rpc_dashboard_produtividade_resumo_v1" in signature:
                requests.append(signature)
            elif "/unified/login" in signature:
                pass
            else:
                writes.append(req.method + " " + signature)
        elif any(host in req.url for host in ("supabase.co", "concretrack.com.br")):
            if not req.url.startswith(URL.split("/unificado/")[0]):
                external.append(req.url)

    page.on("request", capture)
    login_operacao(page, account["MAPA_TEST_USER"],
                   account["MAPA_TEST_PASSWORD"], role)
    if variant == "original":
        page.route(URL, lambda route: route.fulfill(status=200,
            content_type="text/html; charset=utf-8",
            body=BEFORE.read_text(encoding="utf-8")))
        page.goto(URL, wait_until="domcontentloaded")
        page.wait_for_function(f"state.authUser?.role === '{role}'")
    output = []
    for mode, prefix, function in MODES:
        page.evaluate("mode => setMode(mode)", mode)
        page.wait_for_timeout(2000)
        for start, end, sector, status, search, meta in CASES:
            requests.clear()
            result = page.evaluate("""async ({prefix,fun,start,end,sector,status,search,meta}) => {
              document.getElementById(prefix+'DataInicio').value=start;
              document.getElementById(prefix+'DataFim').value=end;
              document.getElementById(prefix+'FiltroSetor').value=sector;
              if(prefix==='pa') document.getElementById('paMetaCiclo').value=meta;
              else {
                document.getElementById(prefix+'FiltroStatus').value=status;
                document.getElementById(prefix+'FiltroPesquisa').value=search;
              }
              await window[fun]();
              const root=document.getElementById(prefix==='pa'?'viewProdAnalise':
                prefix==='mi'?'viewMontagemIndicadores':'viewDashboardDefeitos');
              const ids=prefix==='pa'?
                ['paKpiFormas','paKpiVolume','paKpiVolBomDia','paKpiVolForaDia',
                 'paKpiCicloMedio','paKpiEficiencia','paKpiParadas','paKpiDesvioPadrao',
                 'paKpiFormasHora','paKpiM3Hora','paKpiJornada','paDadosTbody']:
                prefix==='mi'?
                ['miTotalProduzido','miTotalInspecionado','miAtingimentoPct',
                 'miProducaoDia','miTotalAprovados','miProdGeral','miMontGeral',
                 'miPctGeral','miSetoresContainer','miTabelaTotal','miTabelaBody']:
                ['dfScopeCaption','dfFonteResumo','dfContent'];
              const charts=[...root.querySelectorAll('canvas')].map(canvas=>{
                const chart=typeof Chart==='undefined'?null:Chart.getChart(canvas);
                return {id:canvas.id,labels:chart?.data.labels||[],
                  datasets:(chart?.data.datasets||[]).map(dataset=>({
                    label:dataset.label||'',data:dataset.data||[]}))};
              });
              return {rootFound:!!root,values:Object.fromEntries(ids.map(id=>
                [id,document.getElementById(id)?.innerText||''])),charts};
            }""", {"prefix": prefix, "fun": function, "start": start,
                    "end": end, "sector": sector, "status": status,
                    "search": search, "meta": meta})
            assert result["rootFound"], (variant, mode)
            output.append({"mode": mode, "start": start, "end": end,
                           "sector": sector, "status": status, "search": search,
                           "meta": meta, "result": {"values": result["values"],
                                                    "charts": result["charts"]},
                           "reads": sorted(digest(item) for item in requests)})
    assert not writes, writes
    assert not external, external
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
    path = OUT / f"dashboards-ui-{args.role.lower()}.json"
    path.write_text(json.dumps({"original": original, "unificado": unified},
                               ensure_ascii=False, indent=2), encoding="utf-8")
    differences = [{"mode": a["mode"], "period": [a["start"], a["end"]],
                    "sector": a["sector"],
                    "values_equal": a["result"] == b["result"],
                    "reads_equal": a["reads"] == b["reads"]}
                   for a, b in zip(original, unified)
                   if a["result"] != b["result"] or a["reads"] != b["reads"]]
    print(json.dumps({"role": args.role, "cases": len(original),
                      "differences": differences, "evidence": str(path)},
                     ensure_ascii=False))
    assert not differences, differences


if __name__ == "__main__":
    main()
