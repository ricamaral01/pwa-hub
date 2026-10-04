"""Compare concrete type action and resulting card in all four sectors."""

from __future__ import annotations

import json
import argparse
from pathlib import Path

from playwright.sync_api import sync_playwright

from operacao_smoke import CHROME, OUT, URL, credentials, login_operacao


ROOT = Path(__file__).resolve().parents[3]
BEFORE = ROOT / ".work-mapa-unificado" / "operacao" / "index-before-desktop.html"
FIXTURE = ROOT / "tests" / "mapa" / "fixtures" / "captured-offline.json"
DATE = "2026-10-03"
FORMS = {1: "IE-01", 2: "TCR-1", 3: "SC01", 4: "C-F1-1"}


def static(body: dict) -> dict:
    return {key: value for key, value in body.items() if key not in {"id", "data_hora"}}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--role", choices=("GERENCIA", "GESTOR", "APONTADOR"),
                        default="GERENCIA")
    args = parser.parse_args()
    account = credentials()
    original = BEFORE.read_text(encoding="utf-8")
    requests = json.loads(FIXTURE.read_text(encoding="utf-8"))["requests"]
    expected = {int(item["body"]["setor"].split()[-1]): item for item in requests
                if item.get("method") == "POST"
                and item.get("path") == "/rest/v1/producao"
                and item.get("flow", "").startswith("concretar cart")
                and isinstance(item.get("body"), dict)}
    assert set(expected) == set(FORMS)
    results = []
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True, executable_path=CHROME)
        for sector, form in FORMS.items():
            query = ("/unificado/mapa/api/rest/v1/producao?select=*"
                     f"&data_fabricacao=eq.{DATE}&setor=eq.Setor%20{sector}&forma=eq.{form}")
            variants = []
            for variant in ("original", "unificado"):
                context = browser.new_context(viewport={"width": 1024, "height": 768},
                                              service_workers="block")
                page = context.new_page()
                writes = []
                page.on("request", lambda request: writes.append({
                    "method": request.method, "body": request.post_data_json,
                    "prefer": request.headers.get("prefer")})
                    if "/rest/v1/producao" in request.url
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
                    before_rows = page.evaluate("async url => await (await fetch(url)).json()", query)
                    assert before_rows == [], (sector, variant, "existing data")
                    safe_to_clean = True
                    selector = ("#libSetor4Cols .s4-forma-cell" if sector == 4 else
                                f"#libSetor{sector}Cols .forma-card")
                    before = page.evaluate("""async ({sector,date,selector}) => {
                      setMode(`LIBERACAO_S${sector}`);
                      el.libData.value=date;
                      el.libData.dispatchEvent(new Event('change',{bubbles:true}));
                      await new Promise(resolve=>setTimeout(resolve,1400));
                      const card=document.querySelector(selector);
                      if (!card) throw new Error('Missing card '+selector);
                      const program=document.getElementById('kioskProgCheckbox');
                      if (program.checked) program.click();
                      const release=document.getElementById('kioskLibCheckbox');
                      if (release.checked) release.click();
                      const person=document.getElementById('kioskLibColaborador');
                      if (person) person.value='Jeferson';
                      if (el.libColaborador) el.libColaborador.value='Jeferson';
                      return {classes:card.className,text:card.innerText};
                    }""", {"sector": sector, "date": DATE, "selector": selector})
                    page.evaluate("selector => document.querySelector(selector).click()", selector)
                    page.wait_for_timeout(200)
                    selected = page.evaluate("""() => {
                      const select=document.getElementById('concretoModeloSelect');
                      const model=select && [...select.options].find(option=>option.value)?.value;
                      if (model) select.value=model;
                      const button=document.querySelector('.btn-concreto-rich[data-tipo="Concreto Seco - Vibrado"]');
                      if (!button) throw new Error('Concrete type button missing');
                      button.click();
                      return model||null;
                    }""")
                    page.wait_for_timeout(1300)
                    rows = page.evaluate("async url => await (await fetch(url)).json()", query)
                    after = page.evaluate("""selector => {
                      const card=document.querySelector(selector);
                      return {classes:card.className,text:card.innerText};
                    }""", selector)
                    assert len(writes) == 1 and len(rows) == 1, (sector, variant, writes, rows)
                    assert static(writes[0]["body"]) == static(expected[sector]["body"]), (sector, writes)
                    assert writes[0]["prefer"] == expected[sector]["headers"]["Prefer"]
                    assert all(rows[0].get(field) == value for field, value in
                               static(writes[0]["body"]).items())
                    variants.append({"variant": variant, "before": before, "after": after,
                                     "row": static(rows[0]), "write": static(writes[0]["body"]),
                                     "model": selected})
                finally:
                    if safe_to_clean:
                        page.evaluate("""async url => {
                          const response=await fetch(url.replace('select=*&',''),{method:'DELETE'});
                          if (!response.ok) throw new Error('Cleanup HTTP '+response.status);
                        }""", query)
                    context.close()
            for key in ("before", "after", "row", "write", "model"):
                assert variants[0][key] == variants[1][key], (sector, key)
            results.append({"sector": sector, "form": form, "request": "equal",
                            "row": "equal", "card": "equal", "cleaned": True})
        browser.close()
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / f"concrete-sector-parity-{args.role.lower()}.json").write_text(
        json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({"role": args.role, "cases": len(results), "results": results},
                     ensure_ascii=False))


if __name__ == "__main__":
    main()
