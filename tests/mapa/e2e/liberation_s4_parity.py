"""Preserve the original Setor 4 liberation click and absence of a write."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from playwright.sync_api import sync_playwright

from operacao_smoke import CHROME, OUT, URL, credentials, login_operacao


ROOT = Path(__file__).resolve().parents[3]
BEFORE = ROOT / ".work-mapa-unificado" / "operacao" / "index-before-desktop.html"
DATE = "2026-10-03"


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--role", choices=("GERENCIA", "GESTOR", "APONTADOR"),
                        default="GERENCIA")
    args = parser.parse_args()
    account = credentials()
    original = BEFORE.read_text(encoding="utf-8")
    variants = []
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True, executable_path=CHROME)
        for variant in ("original", "unificado"):
            context = browser.new_context(viewport={"width": 1024, "height": 768},
                                          service_workers="block")
            page = context.new_page()
            writes = []
            page.on("request", lambda request: writes.append(request.url)
                    if "/rest/v1/" in request.url and
                    request.method in {"POST", "PATCH", "DELETE"} else None)
            login_operacao(page, account["MAPA_TEST_USER"],
                           account["MAPA_TEST_PASSWORD"], args.role)
            if variant == "original":
                page.route(URL, lambda route: route.fulfill(status=200,
                    content_type="text/html; charset=utf-8", body=original))
                page.goto(URL, wait_until="domcontentloaded")
                page.wait_for_function(f"state.authUser?.role === '{args.role}'")
            result = page.evaluate("""async day => {
              setMode('LIBERACAO_S4');
              el.libData.value=day;
              el.libData.dispatchEvent(new Event('change',{bubbles:true}));
              await new Promise(resolve=>setTimeout(resolve,1400));
              const card=document.querySelector('#libSetor4Cols .s4-forma-cell');
              if (!card) throw new Error('Setor 4 card missing');
              const program=document.getElementById('kioskProgCheckbox');
              if (program.checked) program.click();
              const release=document.getElementById('kioskLibCheckbox');
              if (!release.checked) release.click();
              const person=document.getElementById('kioskLibColaborador');
              if (person) person.value='Jeferson';
              if (el.libColaborador) el.libColaborador.value='Jeferson';
              const before={classes:card.className,text:card.innerText};
              card.click();
              await new Promise(resolve=>setTimeout(resolve,300));
              return {before,after:{classes:card.className,text:card.innerText},
                      popup:!!document.querySelector('#concretoTipoModal.modal-visible'),
                      liberationMode:state.liberationMode};
            }""", DATE)
            assert result["popup"] and result["liberationMode"], (variant, result)
            assert not writes, (variant, writes)
            variants.append(result)
            context.close()
        browser.close()
    assert variants[0] == variants[1], variants
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / f"liberation-s4-{args.role.lower()}.json").write_text(
        json.dumps(variants, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({"role": args.role, "sector": 4, "popup": "equal",
                      "card": "equal", "writes": 0}, ensure_ascii=False))


if __name__ == "__main__":
    main()
