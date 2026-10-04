"""Byte compare both Mapa CSV downloads before/after the unified shell."""

from __future__ import annotations

import hashlib
import json
import argparse
from pathlib import Path
from urllib.parse import urlsplit

from playwright.sync_api import sync_playwright

from operacao_smoke import CHROME, OUT, URL, credentials, login_operacao


SOURCE = Path(__file__).resolve().parents[3] / ".work-mapa-unificado" / "operacao" / "index-before-desktop.html"
DEST = OUT / "csv-export"
BUTTONS = ("paBtnExportarDadosCSV", "paBtnExportarCSV")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--role", choices=("GERENCIA", "GESTOR"), default="GERENCIA")
    args = parser.parse_args()
    DEST.mkdir(parents=True, exist_ok=True)
    source = SOURCE.read_text(encoding="utf-8")
    account = credentials()
    files = {}
    external = []
    writes = []
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True, executable_path=CHROME)
        context = browser.new_context(viewport={"width": 1366, "height": 768},
                                      accept_downloads=True, service_workers="block")
        def restrict(route):
            request = route.request
            host = urlsplit(request.url).hostname
            if host != "concrefer.concretrack.com.br":
                external.append(host)
                route.abort()
            elif request.method not in {"GET", "HEAD"} and "/unified/login" not in request.url \
                    and not (request.method == "POST" and
                             urlsplit(request.url).path.endswith('/rpc/rpc_dashboard_produtividade_resumo_v1')):
                writes.append(urlsplit(request.url).path)
                route.abort()
            else:
                route.continue_()
        context.route("**/*", restrict)
        for variant in ("original", "copia"):
            page = context.new_page()
            if variant == "original":
                login_operacao(page, account["MAPA_TEST_USER"],
                               account["MAPA_TEST_PASSWORD"], args.role)
                page.route(URL, lambda route: route.fulfill(status=200,
                    content_type="text/html; charset=utf-8", body=source))
                page.goto(URL, wait_until="domcontentloaded")
            else:
                page.goto(URL, wait_until="domcontentloaded")
            page.wait_for_function("role => state.authUser?.role === role", arg=args.role, timeout=15000)
            page.evaluate("""async () => {
              setMode('PROD_ANALISE');
              document.getElementById('paDataInicio').value='2026-10-02';
              document.getElementById('paDataFim').value='2026-10-03';
              await carregarProdutividadeConcretagem();
            }""")
            files[variant] = {}
            for button in BUTTONS:
                if button == "paBtnExportarCSV":
                    page.locator("#paBtnToggleFiltros").click()
                with page.expect_download(timeout=30000) as event:
                    page.locator("#" + button).click()
                download = event.value
                path = DEST / (variant + "-" + args.role.lower() + "-" + button + ".csv")
                download.save_as(path)
                data = path.read_bytes()
                files[variant][button] = {"filename": download.suggested_filename,
                                          "sha256": hashlib.sha256(data).hexdigest(),
                                          "rows": len(data.decode("utf-8-sig").splitlines()) - 1}
            page.close()
        context.close()
        browser.close()
    assert not external and not writes, (external, writes)
    for button in BUTTONS:
        left, right = files["original"][button], files["copia"][button]
        assert left["sha256"] == right["sha256"] and left["rows"] == right["rows"], files
        if button == "paBtnExportarDadosCSV":
            assert left["filename"].startswith("dados_concretagem_")
            assert right["filename"].startswith("dados_concretagem_")
        else:
            assert left["filename"] == right["filename"]
    (DEST / f"report-{args.role.lower()}.json").write_text(
        json.dumps(files, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({"csv_exports": "byte_equal", "role": args.role,
                      "files": files["copia"],
                      "external": 0, "writes": 0}, ensure_ascii=False))


if __name__ == "__main__":
    main()
