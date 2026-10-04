"""Compare ODIN correction and cancellation against the original Mapa UI."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from playwright.sync_api import sync_playwright

from operacao_smoke import CHROME, OUT, URL, credentials, login_operacao


ROOT = Path(__file__).resolve().parents[3]
BEFORE = ROOT / ".work-mapa-unificado" / "operacao" / "index-before-desktop.html"
FIXTURE = ROOT / "tests" / "mapa" / "fixtures" / "captured-offline.json"
FORMS = {1: "IE-01", 2: "TCR-1", 3: "SC29", 4: "C-F1-1"}
DATE = "2026-10-03"


def stable(row: dict) -> dict:
    return {key: value for key, value in row.items()
            if key not in {"id", "data_hora", "created_at", "updated_at"}}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--role", choices=("GERENCIA", "GESTOR"), default="GERENCIA")
    parser.add_argument("--sector", type=int, choices=range(1, 5), default=3)
    args = parser.parse_args()
    sector, form = args.sector, FORMS[args.sector]
    account = credentials()
    source = BEFORE.read_text(encoding="utf-8")
    requests = json.loads(FIXTURE.read_text(encoding="utf-8"))["requests"]
    expected = [item for item in requests if item.get("flow") ==
                "ODIN: alterar tipo e cancelar concretagem"
                and item.get("method") in {"PATCH", "DELETE"}]
    assert [item["method"] for item in expected] == ["PATCH", "DELETE"]
    query = ("/unificado/mapa/api/rest/v1/producao?select=*"
             f"&data_fabricacao=eq.{DATE}&setor=eq.Setor%20{sector}&forma=eq.{form}")
    variants = []
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True, executable_path=CHROME)
        for variant in ("original", "unificado"):
            context = browser.new_context(viewport={"width": 1024, "height": 768},
                                          service_workers="block")
            page = context.new_page()
            page.on("dialog", lambda dialog: dialog.accept())
            writes = []
            redo_writes = []
            capture_redo = [False]
            page.on("request", lambda request: writes.append({
                "method": request.method, "body": request.post_data_json,
                "url": request.url}) if "/rest/v1/producao" in request.url
                and request.method in {"PATCH", "DELETE"} else None)
            page.on("request", lambda request: redo_writes.append({
                "body": request.post_data_json, "prefer": request.headers.get("prefer")})
                if capture_redo[0] and "/rest/v1/producao" in request.url
                and request.method == "POST" else None)
            safe_to_clean = False
            try:
                login_operacao(page, account["MAPA_TEST_USER"],
                               account["MAPA_TEST_PASSWORD"], args.role)
                if variant == "original":
                    page.route(URL, lambda route: route.fulfill(status=200,
                        content_type="text/html; charset=utf-8", body=source))
                    page.goto(URL, wait_until="domcontentloaded")
                    page.wait_for_function(f"state.authUser?.role === '{args.role}'")
                assert page.evaluate("async url => await (await fetch(url)).json()", query) == []
                safe_to_clean = True
                inserted = page.evaluate("""async ({sector,form,date}) => {
                  const response=await fetch('/unificado/mapa/api/rest/v1/producao',{
                    method:'POST',headers:{'Content-Type':'application/json','Prefer':'return=representation'},
                    body:JSON.stringify({data_fabricacao:date,setor:`Setor ${sector}`,forma:form,
                      modelo:'9x200',descricao_poste:'9x200',codigo_produto:'678',
                      tipo_concreto:'Concreto Padrão',colaborador:'Captura sintética',
                      data_hora:new Date().toISOString(),status:'LIBERADO'})
                  });
                  if(!response.ok) throw new Error('Setup HTTP '+response.status);
                  return (await response.json())[0].id;
                }""", {"sector": sector, "form": form, "date": DATE})
                capture_redo[0] = True
                selector = (f"#libSetor{sector}Cols [data-forma-numero=\"{form}\"]")
                before = page.evaluate("""async ({sector,date,selector}) => {
                  setMode(`LIBERACAO_S${sector}`);
                  el.libData.value=date;
                  el.libData.dispatchEvent(new Event('change',{bubbles:true}));
                  await loadClickedFormsFromSupabase(date);
                  await renderLiberacaoDual();
                  const card=document.querySelector(selector);
                  if (!card) throw new Error('Missing ODIN card '+selector);
                  const toggle=document.getElementById('kioskOdinCheckbox');
                  if (!toggle.checked) toggle.click();
                  return {classes:card.className,text:card.innerText};
                }""", {"sector": sector, "date": DATE, "selector": selector})
                page.evaluate("selector => document.querySelector(selector).click()", selector)
                page.wait_for_function("() => document.getElementById('correcaoConcretagemModal')?.classList.contains('modal-visible')")
                selected = page.evaluate("""() => {
                  const select=document.getElementById('correcaoConcretagemTipo');
                  const option=[...select.options].find(item=>item.value!==select.value);
                  if(!option) throw new Error('Alternative type missing');
                  select.value=option.value;
                  return option.value;
                }""")
                page.evaluate("async () => await document.getElementById('correcaoConcretagemSalvar').onclick()")
                corrected_rows = page.evaluate("async url => await (await fetch(url)).json()", query)
                corrected = page.evaluate("""selector => {
                  const card=document.querySelector(selector);
                  return {classes:card.className,text:card.innerText};
                }""", selector)
                assert len(corrected_rows) == 1 and corrected_rows[0]["tipo_concreto"] == selected
                page.evaluate("selector => document.querySelector(selector).click()", selector)
                page.wait_for_function("() => document.getElementById('correcaoConcretagemModal')?.classList.contains('modal-visible')")
                page.evaluate("async () => await document.getElementById('correcaoConcretagemCancelar').onclick()")
                cancelled_rows = page.evaluate("async url => await (await fetch(url)).json()", query)
                cancelled = page.evaluate("""selector => {
                  const card=document.querySelector(selector);
                  return {classes:card.className,text:card.innerText};
                }""", selector)
                assert cancelled_rows == []
                assert [write["method"] for write in writes] == ["PATCH", "DELETE"]
                assert writes[0]["body"] == expected[0]["body"]
                assert all(f"id=eq.{inserted}" in write["url"] for write in writes)
                if sector < 4:
                    assert "is-saved" in corrected["classes"] and selected in corrected["text"], (corrected, selected)
                    assert "is-idle" in cancelled["classes"], cancelled
                page.evaluate("""() => {
                  const toggle=document.getElementById('kioskOdinCheckbox');
                  if(toggle.checked) toggle.click();
                  const person=document.getElementById('kioskLibColaborador');
                  if(person) person.value='Jeferson';
                  if(el.libColaborador) el.libColaborador.value='Jeferson';
                }""")
                page.evaluate("selector => document.querySelector(selector).click()", selector)
                page.wait_for_function("() => document.getElementById('concretoTipoModal')?.classList.contains('modal-visible')")
                page.evaluate("""() => {
                  const select=document.getElementById('concretoModeloSelect');
                  const model=select && [...select.options].find(option=>option.value)?.value;
                  if(model) select.value=model;
                  const button=document.querySelector('.btn-concreto-rich[data-tipo="Concreto Seco - Vibrado"]');
                  if(!button) throw new Error('Concrete type missing for redo');
                  button.click();
                }""")
                page.wait_for_timeout(1000)
                redone_rows = page.evaluate("async url => await (await fetch(url)).json()", query)
                redone = page.evaluate("""selector => {
                  const card=document.querySelector(selector);
                  return {classes:card.className,text:card.innerText};
                }""", selector)
                assert len(redone_rows) == 1 and len(redo_writes) == 1
                assert redone_rows[0]["tipo_concreto"] == "Concreto Seco - Vibrado"
                for field, value in stable(redo_writes[0]["body"]).items():
                    if field in redone_rows[0]:
                        assert redone_rows[0][field] == value, (variant, sector, field)
                variants.append({"before": before, "corrected": corrected,
                                 "cancelled": cancelled, "redone": redone,
                                 "row": stable(corrected_rows[0]),
                                 "redo_row": stable(redone_rows[0]),
                                 "patch": writes[0]["body"], "selected": selected,
                                 "redo_request": stable(redo_writes[0]["body"]),
                                 "redo_prefer": redo_writes[0]["prefer"]})
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
    (OUT / f"odin-{args.role.lower()}-s{sector}.json").write_text(
        json.dumps(variants, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({"role": args.role, "sector": sector,
                      "patch": "equal", "delete": "equal", "redo": "equal",
                      "card": "equal",
                      "cleaned": True}, ensure_ascii=False))


if __name__ == "__main__":
    main()
