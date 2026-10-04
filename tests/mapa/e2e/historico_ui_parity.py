"""Compare History filters and rendered events against the original HTML."""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
from urllib.parse import parse_qs, urlsplit

from playwright.sync_api import sync_playwright

from operacao_smoke import CHROME, OUT, URL, credentials, login_operacao

ROOT = Path(__file__).resolve().parents[3]
BEFORE = ROOT / ".work-mapa-unificado/operacao/index-before-desktop.html"
SOURCE_FIXTURE = ROOT / ".work-mapa-unificado/other-dashboards-source-fixtures.json"
DATES = ("2026-10-01", "2026-10-03")
FILTERS = (("", ""), ("LIBERACAO", ""), ("INSPECAO", ""), ("", "SC01"))


def sha(value):
    return hashlib.sha256(json.dumps(value, ensure_ascii=False,
                                     sort_keys=True).encode()).hexdigest()


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--role", choices=("GERENCIA", "GESTOR"),
                        default="GERENCIA")
    args = parser.parse_args()
    account = credentials()
    source = json.loads(SOURCE_FIXTURE.read_text(encoding="utf-8"))["fixtures"]
    snapshots = []
    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True, executable_path=CHROME)
        for variant in ("original", "unificado"):
            context = browser.new_context(viewport={"width": 1024, "height": 768},
                                          service_workers="block")
            page = context.new_page()
            reads = []
            writes = []
            def capture(req):
                if "/unificado/mapa/api/" in req.url and "/unified/login" not in req.url:
                    if req.method in {"GET", "HEAD"}:
                        reads.append(urlsplit(req.url).path + "?" + urlsplit(req.url).query)
                    else:
                        writes.append(req.method + " " + urlsplit(req.url).path)
            page.on("request", capture)
            login_operacao(page, account["MAPA_TEST_USER"],
                           account["MAPA_TEST_PASSWORD"], args.role)
            if variant == "original":
                def source_history(route):
                    req = route.request
                    parsed = urlsplit(req.url)
                    params = parse_qs(parsed.query)
                    date_filter = params.get("data_fabricacao", [""])[0]
                    sector_filter = params.get("setor", [""])[0]
                    if (req.method == "GET" and parsed.path.endswith("/rest/v1/producao")
                            and date_filter.startswith("eq.") and sector_filter.startswith("eq.")):
                        key = f"historico:{date_filter[3:]}:{sector_filter[3:]}"
                        if key in source:
                            route.fulfill(status=200, content_type="application/json",
                                          body=json.dumps(source[key]["official"], ensure_ascii=False))
                            return
                    route.continue_()
                page.route("**/unificado/mapa/api/rest/v1/**", source_history)
                page.route(URL, lambda route: route.fulfill(status=200,
                    content_type="text/html; charset=utf-8",
                    body=BEFORE.read_text(encoding="utf-8")))
                page.goto(URL, wait_until="domcontentloaded")
                page.wait_for_function(f"state.authUser?.role === '{args.role}'")
            page.evaluate("setMode('HISTORICO')")
            page.wait_for_timeout(600)
            cases = []
            for date in DATES:
                for kind, form in FILTERS:
                    reads.clear()
                    result = page.evaluate("""async ({date,kind,form}) => {
                      el.histData.value=date;
                      el.histTipo.value=kind;
                      el.histForma.value=form;
                      await renderHistorico();
                      return [...document.querySelectorAll('#historicoLista .item')]
                        .map(item=>({text:item.innerText,classes:item.className}));
                    }""", {"date": date, "kind": kind, "form": form})
                    cases.append({"date": date, "filter": kind, "form": form,
                                  "items": result, "read_hashes": sorted(sha(item) for item in reads)})
            assert not writes, writes
            snapshots.append(cases)
            context.close()
        browser.close()
    OUT.mkdir(parents=True, exist_ok=True)
    path = OUT / f"historico-ui-{args.role.lower()}.json"
    path.write_text(json.dumps(snapshots, ensure_ascii=False, indent=2), encoding="utf-8")
    assert snapshots[0] == snapshots[1], str(path)
    print(json.dumps({"historico": "equal", "role": args.role,
                      "cases": len(snapshots[0]), "reads_only": True}))


if __name__ == "__main__":
    main()
