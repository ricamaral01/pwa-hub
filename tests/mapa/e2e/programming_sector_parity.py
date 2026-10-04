"""Compare card programming in sectors 1, 2 and 4 on one test snapshot."""

from __future__ import annotations

import json
from pathlib import Path

from playwright.sync_api import sync_playwright

from operacao_smoke import CHROME, OUT, URL, credentials, login_operacao


ROOT = Path(__file__).resolve().parents[3]
BEFORE = ROOT / ".work-mapa-unificado" / "operacao" / "index-before-desktop.html"
FIXTURE = ROOT / "tests" / "mapa" / "fixtures" / "captured-offline.json"
DATE = "2026-10-03"
FORMS = {1: "IE-01", 2: "TCR-1", 4: "C-F1-1"}


def comparable(body: dict) -> dict:
    return {key: value for key, value in body.items() if key not in {"data_hora", "id"}}


def main() -> None:
    account = credentials()
    original = BEFORE.read_text(encoding="utf-8")
    requests = json.loads(FIXTURE.read_text(encoding="utf-8"))["requests"]
    expected = {int(item["body"]["setor"].split()[-1]): item for item in requests
                if item.get("method") == "POST"
                and item.get("path") == "/rest/v1/programacao_pcp"
                and isinstance(item.get("body"), dict)
                and item["body"].get("forma") in FORMS.values()}
    assert set(expected) == set(FORMS)
    results = []
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True, executable_path=CHROME)
        for sector, form in FORMS.items():
            variants = []
            for variant in ("original", "unificado"):
                context = browser.new_context(viewport={"width": 1024, "height": 768},
                                              service_workers="block")
                page = context.new_page()
                writes = []
                page.on("request", lambda request: writes.append({
                    "method": request.method, "body": request.post_data_json,
                    "prefer": request.headers.get("prefer"), "url": request.url})
                    if "/rest/v1/programacao_pcp" in request.url
                    and request.method in {"POST", "DELETE"} else None)
                safe_to_clean = False
                query = ("/unificado/mapa/api/rest/v1/programacao_pcp?select=*"
                         f"&data_fabricacao=eq.{DATE}&setor=eq.Setor%20{sector}&forma=eq.{form}")
                try:
                    login_operacao(page, account["MAPA_TEST_USER"], account["MAPA_TEST_PASSWORD"])
                    if variant == "original":
                        page.route(URL, lambda route: route.fulfill(status=200,
                            content_type="text/html; charset=utf-8", body=original))
                        page.goto(URL, wait_until="domcontentloaded")
                        page.wait_for_function("state.authUser?.role === 'GERENCIA'")
                    before_rows = page.evaluate("async url => await (await fetch(url)).json()", query)
                    assert before_rows == [], (sector, variant, "existing data")
                    safe_to_clean = True
                    selector = (f"#libSetor{sector}Cols .s4-forma-cell" if sector == 4 else
                                f"#libSetor{sector}Cols .forma-card")
                    before = page.evaluate("""async ({sector,date,selector}) => {
                      setMode(`LIBERACAO_S${sector}`);
                      el.libData.value=date;
                      el.libData.dispatchEvent(new Event('change',{bubbles:true}));
                      await new Promise(resolve=>setTimeout(resolve,1200));
                      const card=document.querySelector(selector);
                      if (!card) throw new Error('Missing card '+selector);
                      const checkbox=document.getElementById('kioskProgCheckbox');
                      if (!checkbox.checked) checkbox.click();
                      return {classes:card.className,text:card.innerText};
                    }""", {"sector": sector, "date": DATE, "selector": selector})
                    page.evaluate("selector => document.querySelector(selector).click()", selector)
                    page.wait_for_timeout(1100)
                    programmed_rows = page.evaluate("async url => await (await fetch(url)).json()", query)
                    programmed = page.evaluate("""selector => {
                      const card=document.querySelector(selector);
                      return {classes:card.className,text:card.innerText};
                    }""", selector)
                    page.evaluate("selector => document.querySelector(selector).click()", selector)
                    page.wait_for_timeout(1100)
                    after_rows = page.evaluate("async url => await (await fetch(url)).json()", query)
                    after = page.evaluate("""selector => {
                      const card=document.querySelector(selector);
                      return {classes:card.className,text:card.innerText};
                    }""", selector)
                    assert len(programmed_rows) == 1 and after_rows == []
                    assert [write["method"] for write in writes] == ["POST", "DELETE"]
                    assert comparable(writes[0]["body"]) == comparable(expected[sector]["body"])
                    assert writes[0]["prefer"] == expected[sector]["headers"]["Prefer"]
                    assert all(programmed_rows[0].get(field) == value for field, value in
                               comparable(writes[0]["body"]).items())
                    variants.append({"variant": variant, "before": before,
                                     "programmed": programmed, "after": after,
                                     "row": comparable(programmed_rows[0]),
                                     "write": comparable(writes[0]["body"])})
                finally:
                    if safe_to_clean:
                        page.evaluate("""async url => {
                          await fetch(url.replace('select=*&',''),{method:'DELETE'});
                        }""", query)
                    context.close()
            assert variants[0]["write"] == variants[1]["write"], (sector, "request")
            assert variants[0]["row"] == variants[1]["row"], (sector, "database")
            for state in ("before", "programmed", "after"):
                assert variants[0][state] == variants[1][state], (sector, state)
            results.append({"sector": sector, "form": form, "request": "equal",
                            "row": "equal", "card": "equal", "cleaned": True})
        browser.close()
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "programming-sector-parity.json").write_text(
        json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({"cases": len(results), "results": results}, ensure_ascii=False))


if __name__ == "__main__":
    main()
