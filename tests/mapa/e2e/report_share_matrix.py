"""Compare actual WhatsApp share preparation; abort external navigation."""
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
DATE = "2026-10-03"


def sha(value):
    return hashlib.sha256(value.encode()).hexdigest()


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--role", choices=("GERENCIA", "GESTOR"), default="GERENCIA")
    args = parser.parse_args()
    account = credentials()
    snapshots = []
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
                    if req.method not in {"GET", "HEAD"} and "/unified/login" not in req.url
                    else None)
            login_operacao(page, account["MAPA_TEST_USER"],
                           account["MAPA_TEST_PASSWORD"], args.role)
            if variant == "original":
                page.route(URL, lambda route: route.fulfill(status=200,
                    content_type="text/html; charset=utf-8",
                    body=BEFORE.read_text(encoding="utf-8")))
                page.goto(URL, wait_until="domcontentloaded")
                page.wait_for_function(f"state.authUser?.role === '{args.role}'")
            cases = []
            for sector in (1, 2, 3, 4):
                before_share = len(share_urls)
                page.evaluate("""async ({date,sector}) => {
                  setMode('RELATORIO');
                  el.relData.value=date;
                  el.relSetor.value='Setor '+sector;
                  el.relEncarregado.value='Encarregado E2E';
                  await gerarRelatorioSetor();
                  if(!document.querySelector('#relPrintDoc')) throw new Error('Report not generated');
                  await enviarRelatorioWhatsapp();
                }""", {"date": DATE, "sector": sector})
                page.wait_for_timeout(500)
                assert len(share_urls) > before_share, {"variant": variant, "sector": sector,
                                                   "share_count": len(share_urls)}
                message = parse_qs(urlsplit(share_urls[-1]).query)["text"][0]
                sync = page.locator("#syncStatus").inner_text()
                assert f"Setor {sector}" in message and "03/10/2026" in message
                cases.append({"sector": sector, "message_sha256": sha(message),
                              "message": message, "sync": sync,
                              "opened_count": len(share_urls) - before_share})
            assert not writes, writes
            snapshots.append(cases)
            context.close()
        browser.close()
    OUT.mkdir(parents=True, exist_ok=True)
    path = OUT / f"report-share-{args.role.lower()}.json"
    path.write_text(json.dumps(snapshots, ensure_ascii=False, indent=2), encoding="utf-8")
    assert snapshots[0] == snapshots[1], str(path)
    print(json.dumps({"report_share": "equal", "role": args.role,
                      "sectors": 4,
                      "external_share_requests_aborted": sum(
                          item["opened_count"] for side in snapshots for item in side)}))


if __name__ == "__main__":
    main()
