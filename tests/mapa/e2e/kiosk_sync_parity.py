"""Compare the original Kiosk Sync button against the isolated operation."""
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
DATE = "2099-02-01"  # no production rows; the sync must remain read-only


def digest(value):
    return hashlib.sha256(json.dumps(value, ensure_ascii=False,
                                     sort_keys=True).encode()).hexdigest()


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
    output = []
    for sector in range(1, 5):
        page.evaluate("""({sector,date}) => {
          el.libData.value=date;
          el.kioskLibData.value=date;
          setMode('LIBERACAO_S'+sector);
        }""", {"sector": sector, "date": DATE})
        page.wait_for_timeout(300)
        reads.clear()
        page.locator("#btnKioskSync").click()
        page.wait_for_function("!document.getElementById('btnKioskSync').disabled",
                               timeout=30000)
        result = page.evaluate("""sector => {
          const root=document.getElementById('libSetor'+sector+'Cols');
          const cards=[...root.querySelectorAll('.forma-card, tr')].map(card=>({
            text:card.innerText,classes:card.className,
            color:getComputedStyle(card).backgroundColor}));
          return {feedback:document.getElementById('libFeedback')?.innerText||'',
            button:document.getElementById('btnKioskSync').innerText,
            cards,rootText:root.innerText};
        }""", sector)
        output.append({"sector": sector, "reads": sorted(digest(item) for item in reads),
                       "result": result})
    assert not writes, writes
    context.close()
    return output


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--role", choices=("GERENCIA", "GESTOR", "APONTADOR"),
                        default="GERENCIA")
    args = parser.parse_args()
    account = credentials()
    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True, executable_path=CHROME)
        original = run_variant(browser, "original", args.role, account)
        unified = run_variant(browser, "unificado", args.role, account)
        browser.close()
    OUT.mkdir(parents=True, exist_ok=True)
    path = OUT / f"kiosk-sync-{args.role.lower()}.json"
    path.write_text(json.dumps({"original": original, "unificado": unified},
                               ensure_ascii=False, indent=2), encoding="utf-8")
    differences = [{"sector": a["sector"],
                    "reads_equal": a["reads"] == b["reads"],
                    "result_equal": a["result"] == b["result"]}
                   for a, b in zip(original, unified) if a != b]
    print(json.dumps({"role": args.role, "cases": len(original),
                      "differences": differences, "writes": 0}, ensure_ascii=False))
    assert not differences, str(path)


if __name__ == "__main__":
    main()
