"""Compare maintenance stop/release through the original card and modal UI."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from playwright.sync_api import sync_playwright

from operacao_smoke import CHROME, OUT, URL, credentials, login_operacao


ROOT = Path(__file__).resolve().parents[3]
BEFORE = ROOT / ".work-mapa-unificado" / "operacao" / "index-before-desktop.html"
FORMS = {1: "IE-01", 2: "TCR-1", 3: "SC29", 4: "C-F1-1"}
DATE = "2026-10-03"
DYNAMIC = {"id", "parada_em", "liberada_em", "created_at", "updated_at"}


def stable(value: dict) -> dict:
    return {key: item for key, item in value.items() if key not in DYNAMIC}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--role", choices=("GERENCIA", "GESTOR", "APONTADOR"),
                        default="GERENCIA")
    parser.add_argument("--sector", type=int, choices=range(1, 5), default=3)
    args = parser.parse_args()
    sector, form = args.sector, FORMS[args.sector]
    account = credentials()
    original = BEFORE.read_text(encoding="utf-8")
    row_id = f"Setor {sector}_{form}"
    query = f"/unificado/mapa/api/rest/v1/formas_manutencao?select=*&id=eq.{row_id.replace(' ', '%20')}"
    variants = []
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True, executable_path=CHROME)
        for variant in ("original", "unificado"):
            context = browser.new_context(viewport={"width": 1024, "height": 768},
                                          service_workers="block")
            page = context.new_page()
            writes = []
            page.on("request", lambda request: writes.append({
                "method": request.method, "body": request.post_data_json,
                "prefer": request.headers.get("prefer")})
                if "/rest/v1/formas_manutencao" in request.url
                and request.method == "POST" else None)
            safe_to_clean = False
            try:
                login_operacao(page, account["MAPA_TEST_USER"],
                               account["MAPA_TEST_PASSWORD"], args.role)
                if variant == "original":
                    page.route(URL, lambda route: route.fulfill(status=200,
                        content_type="text/html; charset=utf-8", body=original))
                    page.goto(URL, wait_until="domcontentloaded")
                    page.wait_for_function(f"state.authUser?.role === '{args.role}'")
                assert page.evaluate("async url => await (await fetch(url)).json()", query) == []
                safe_to_clean = True
                selector = (f"#libSetor{sector}Cols [data-forma-numero=\"{form}\"]"
                            if sector < 4 else
                            f"#libSetor4Cols [data-forma-numero=\"{form}\"]")
                before = page.evaluate("""async ({sector,date,selector}) => {
                  setMode(`LIBERACAO_S${sector}`);
                  el.libData.value=date;
                  el.libData.dispatchEvent(new Event('change',{bubbles:true}));
                  await new Promise(resolve=>setTimeout(resolve,1300));
                  const card=document.querySelector(selector);
                  if (!card) throw new Error('Missing card '+selector);
                  const toggle=document.getElementById('kioskManutencaoCheckbox');
                  if (!toggle.checked) toggle.click();
                  return {classes:card.className,text:card.innerText};
                }""", {"sector": sector, "date": DATE, "selector": selector})
                page.evaluate("selector => document.querySelector(selector).click()", selector)
                assert page.locator("#modalManutencaoParada.modal-visible").count() == 1
                page.evaluate("""() => {
                  document.getElementById('mParadaMotivo').value='Captura sintética';
                  document.getElementById('mParadaAcao').value='Verificar';
                  document.getElementById('mParadaConfirmBtn').click();
                }""")
                page.wait_for_timeout(1100)
                stopped_rows = page.evaluate("async url => await (await fetch(url)).json()", query)
                stopped = page.evaluate("""selector => {
                  const card=document.querySelector(selector);
                  return {classes:card.className,text:card.innerText};
                }""", selector)
                assert len(stopped_rows) == 1 and stopped_rows[0]["status"] == "PARADA"
                page.evaluate("selector => document.querySelector(selector).click()", selector)
                assert page.locator("#modalManutencaoLiberacao.modal-visible").count() == 1
                page.evaluate("""() => {
                  document.getElementById('mLiberacaoObs').value='Liberado em teste';
                  document.getElementById('mLiberacaoConfirmBtn').click();
                }""")
                page.wait_for_timeout(1100)
                released_rows = page.evaluate("async url => await (await fetch(url)).json()", query)
                released = page.evaluate("""selector => {
                  const card=document.querySelector(selector);
                  return {classes:card.className,text:card.innerText};
                }""", selector)
                assert len(writes) == 2 and len(released_rows) == 1
                assert [write["method"] for write in writes] == ["POST", "POST"]
                for index, row in enumerate((stopped_rows[0], released_rows[0])):
                    for field, value in stable(writes[index]["body"]).items():
                        if field in row:
                            assert row[field] == value, (variant, sector, index, field)
                assert "is-manutencao" in stopped["classes"]
                assert "is-manutencao" not in released["classes"]
                variants.append({"before": before, "stopped": stopped,
                                 "released": released, "stop_row": stable(stopped_rows[0]),
                                 "release_row": stable(released_rows[0]),
                                 "writes": [stable(write["body"]) for write in writes],
                                 "prefers": [write["prefer"] for write in writes]})
            finally:
                if safe_to_clean:
                    page.evaluate("""async url => {
                      const response=await fetch(url.replace('select=*&',''),{method:'DELETE'});
                      if (!response.ok) throw new Error('Cleanup HTTP '+response.status);
                    }""", query)
                context.close()
        browser.close()
    assert variants[0] == variants[1], (args.role, sector, variants)
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / f"maintenance-{args.role.lower()}-s{sector}.json").write_text(
        json.dumps(variants, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({"role": args.role, "sector": sector,
                      "request": "equal", "rows": "equal", "card": "equal",
                      "cleaned": True}, ensure_ascii=False))


if __name__ == "__main__":
    main()
