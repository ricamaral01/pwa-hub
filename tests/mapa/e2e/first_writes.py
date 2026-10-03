"""Drive original Mapa card controls against the published test-only operation."""

from __future__ import annotations

import json
from pathlib import Path

from playwright.sync_api import sync_playwright

from operacao_smoke import CHROME, OUT, URL, credentials


DATE = "2026-10-03"


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    account = credentials()
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True, executable_path=CHROME)
        context = browser.new_context(viewport={"width": 1024, "height": 768}, service_workers="block")
        page = context.new_page()
        writes = []
        def capture(request):
            if "/rest/v1/programacao_pcp" in request.url and request.method in {"POST", "DELETE"}:
                writes.append({"method": request.method, "url": request.url,
                               "body": json.loads(request.post_data) if request.post_data else None,
                               "prefer": request.headers.get("prefer")})
        page.on("request", capture)
        page.goto(URL, wait_until="domcontentloaded", timeout=30000)
        page.wait_for_function("typeof loginWithRole === 'function'", timeout=15000)
        page.wait_for_timeout(1000)
        page.locator("#loginNome").fill(account["MAPA_TEST_USER"])
        page.locator("#loginSenha").fill(account["MAPA_TEST_PASSWORD"])
        page.locator("#loginEntrar").click()
        page.locator("#viewHub").wait_for(state="visible", timeout=15000)
        page.wait_for_function("typeof setMode === 'function'", timeout=15000)
        page.wait_for_function("state.authUser?.role === 'GERENCIA'", timeout=15000)
        result = page.evaluate("""async date => {
            setMode('LIBERACAO_S1');
            el.libData.value = date;
            el.libData.dispatchEvent(new Event('change', {bubbles:true}));
            await new Promise(resolve => setTimeout(resolve, 1200));
            const card = document.querySelector('#libSetor1Cols .forma-card');
            if (!card) throw new Error('No Setor 1 card: ' + JSON.stringify({
              mode: state.mode, auth: state.authUser?.role, container: !!document.querySelector('#libSetor1Cols'),
              cards: document.querySelectorAll('.forma-card').length,
              html: document.querySelector('#libSetor1Cols')?.innerText.slice(0,200)
            }));
            const stateOf = () => ({classes: card.className, text: card.innerText, forma: card.dataset.forma});
            const before = stateOf();
            const checkbox = document.getElementById('kioskProgCheckbox');
            if (!checkbox.checked) checkbox.click();
            await new Promise(resolve => setTimeout(resolve, 200));
            card.click();
            await new Promise(resolve => setTimeout(resolve, 900));
            const afterProgram = stateOf();
            const query = '/unificado/mapa/api/rest/v1/programacao_pcp?select=*&data_fabricacao=eq.'
                + date + '&setor=eq.Setor%201&forma=eq.IE-01';
            const programmedRows = await (await fetch(query)).json();
            card.click();
            await new Promise(resolve => setTimeout(resolve, 900));
            const afterUnprogram = stateOf();
            const unprogrammedRows = await (await fetch(query)).json();
            return {before, afterProgram, afterUnprogram, programmedRows,
                    unprogrammedRows, date};
        }""", DATE)
        rows = page.evaluate("""async date => {
            const response = await fetch('/unificado/mapa/api/rest/v1/programacao_pcp?select=*&data_fabricacao=eq.' + date);
            return {status:response.status, rows:await response.json()};
        }""", DATE)
        result["remaining_rows"] = rows
        fixtures = json.loads((Path(__file__).resolve().parents[1] / "fixtures" /
                               "captured-offline.json").read_text(encoding="utf-8"))["requests"]
        expected = next(item for item in fixtures if item.get("method") == "POST"
                        and item.get("path") == "/rest/v1/programacao_pcp"
                        and isinstance(item.get("body"), dict)
                        and item["body"].get("setor") == "Setor 1"
                        and item["body"].get("forma") == "IE-01")
        posted = next((item for item in writes if item["method"] == "POST"), None)
        expected_body = {key: value for key, value in expected["body"].items()
                         if key != "data_hora"}
        actual_body = {key: value for key, value in (posted or {}).get("body", {}).items()
                       if key != "data_hora"}
        result["fixture_fields_equal"] = expected_body == actual_body
        result["write_methods"] = [item["method"] for item in writes]
        result["prefer_equal"] = bool(posted) and posted["prefer"] == expected["headers"]["Prefer"]
        page.screenshot(path=str(OUT / "first-writes-1024x768.png"), full_page=True)
        (OUT / "first-writes.json").write_text(json.dumps(result, indent=2, ensure_ascii=False), encoding="utf-8")
        print(json.dumps({"forma": result["before"]["forma"],
                          "classes": [result[key]["classes"] for key in
                                      ("before", "afterProgram", "afterUnprogram")],
                          "fixture_fields_equal": result["fixture_fields_equal"],
                          "prefer_equal": result["prefer_equal"],
                          "write_methods": result["write_methods"],
                          "programmed_rows": len(result["programmedRows"]),
                          "unprogrammed_rows": len(result["unprogrammedRows"]),
                          "remaining_rows": len(rows.get("rows", [])),
                          "http": rows["status"]}, ensure_ascii=False))
        context.close()
        browser.close()


if __name__ == "__main__":
    main()
