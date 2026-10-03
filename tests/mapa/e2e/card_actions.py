"""Exercise liberation and concrete card flows in four sectors on the test DB."""

from __future__ import annotations

import json

from playwright.sync_api import sync_playwright

from operacao_smoke import CHROME, OUT, URL, credentials


DATE = "2026-10-03"


def main() -> None:
    account = credentials()
    OUT.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True, executable_path=CHROME)
        context = browser.new_context(viewport={"width": 1024, "height": 768}, service_workers="block")
        page = context.new_page()
        page.on("dialog", lambda dialog: dialog.accept())
        writes = []
        def capture(request):
            if "/rest/v1/" in request.url and request.method in {"POST", "PATCH", "DELETE"}:
                writes.append({"method": request.method, "path": request.url.split("/rest/v1/", 1)[1].split("?", 1)[0],
                               "body": json.loads(request.post_data) if request.post_data else None,
                               "prefer": request.headers.get("prefer")})
        page.on("request", capture)
        page.goto(URL, wait_until="domcontentloaded", timeout=30000)
        page.wait_for_function("typeof loginWithRole === 'function'", timeout=15000)
        page.wait_for_timeout(900)
        page.locator("#loginNome").fill(account["MAPA_TEST_USER"])
        page.locator("#loginSenha").fill(account["MAPA_TEST_PASSWORD"])
        page.locator("#loginEntrar").click()
        page.wait_for_function("state.authUser?.role === 'GERENCIA'", timeout=15000)
        results = []
        for sector in range(1, 4):
            start = len(writes)
            try:
                value = page.evaluate("""async ({sector,date}) => {
                    setMode(`LIBERACAO_S${sector}`); el.libData.value=date;
                    el.libData.dispatchEvent(new Event('change', {bubbles:true}));
                    await new Promise(resolve => setTimeout(resolve, 1500));
                    const selector = sector === 4 ? '#libSetor4Cols .s4-forma-cell'
                                                  : `#libSetor${sector}Cols .forma-card`;
                    const card = document.querySelector(selector);
                    if (!card) throw new Error('No sector card');
                    const release = document.getElementById('kioskLibCheckbox');
                    const program = document.getElementById('kioskProgCheckbox');
                    if (program?.checked) program.click();
                    if (!release.checked) release.click();
                    const person = document.getElementById('kioskLibColaborador');
                    if (person) person.value='Jeferson';
                    if (el.libColaborador) el.libColaborador.value='Jeferson';
                    await new Promise(resolve => setTimeout(resolve, 150));
                    const before={classes:card.className,text:card.innerText.slice(0,120)};
                    card.click();
                    await new Promise(resolve => setTimeout(resolve, 800));
                    const afterRelease={classes:card.className,text:card.innerText.slice(0,120),
                      concretePopup:!!document.querySelector('#concretoTypePopup.modal-visible')};
                    if (release.checked) release.click();
                    await new Promise(resolve => setTimeout(resolve, 100));
                    card.click();
                    await new Promise(resolve => setTimeout(resolve, 130));
                    const select=document.getElementById('concretoModeloSelect');
                    const model=select && [...select.options].find(option=>option.value)?.value;
                    if (model) select.value=model;
                    const type=document.querySelector('.btn-concreto-rich[data-tipo="Concreto Seco - Vibrado"]');
                    if (type) type.click();
                    await new Promise(resolve => setTimeout(resolve, 850));
                    const afterConcrete={classes:card.className,text:card.innerText.slice(0,120),
                      modelSelected:model||null,typeButton:!!type};
                    return {before,afterRelease,afterConcrete};
                }""", {"sector": sector, "date": DATE})
                table_rows = page.evaluate("""async ({sector,date}) => {
                    const base='/unificado/mapa/api/rest/v1/';
                    const filter='?select=*&data_fabricacao=eq.'+date+'&setor=eq.Setor%20'+sector;
                    const lib=await (await fetch(base+'liberacao_formas'+filter)).json();
                    const prod=await (await fetch(base+'producao'+filter)).json();
                    return {lib,prod};
                }""", {"sector": sector, "date": DATE})
                results.append({"sector": sector, "ui": value,
                                "writes": writes[start:],
                                "lib_rows": table_rows["lib"],
                                "prod_rows": table_rows["prod"]})
            except Exception as error:
                results.append({"sector": sector, "error": str(error)[:350], "writes": writes[start:]})
        (OUT / "card-actions-private.json").write_text(
            json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8")
        for item in results:
            print(json.dumps({"sector": item["sector"], "error": item.get("error"),
                              "writes": [(x["method"], x["path"]) for x in item["writes"]],
                              "lib_rows": len(item.get("lib_rows", [])),
                              "prod_rows": len(item.get("prod_rows", [])),
                              "classes": [item["ui"][key]["classes"] for key in
                                          ("before", "afterRelease", "afterConcrete")]
                                          if "ui" in item else []}, ensure_ascii=False))
        context.close()
        browser.close()


if __name__ == "__main__":
    main()
