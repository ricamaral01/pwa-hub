"""Compare Mandril model, withdrawal and undo in original/unified test UI."""
from __future__ import annotations

import argparse
import hashlib
import json
import re
from pathlib import Path

from playwright.sync_api import sync_playwright

from operacao_smoke import CHROME, OUT, URL, credentials, login_operacao

ROOT = Path(__file__).resolve().parents[3]
BEFORE = ROOT / ".work-mapa-unificado/operacao/index-before-desktop.html"
DATE = "2099-01-19"
FORM = "SC01"
PROD = ("/unificado/mapa/api/rest/v1/producao?select=*"
        f"&data_fabricacao=eq.{DATE}&setor=eq.Setor%203&forma=eq.{FORM}")
SAQUES = f"/unificado/mapa/api/pcp/saques-mandril?data={DATE}"


def stable(row):
    return {key: value for key, value in row.items()
            if key not in {"id", "created_at", "updated_at", "data_hora"}}


def digest(value):
    return hashlib.sha256(json.dumps(value, sort_keys=True, ensure_ascii=False).encode()).hexdigest()


def stable_text(value):
    return re.sub(r"\b\d{2}:\d{2}(?::\d{2})?\b", "[hora]", value)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--role", choices=("GERENCIA", "GESTOR", "APONTADOR"),
                        default="GERENCIA")
    args = parser.parse_args()
    account = credentials()
    snapshots = []
    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True, executable_path=CHROME)
        for variant in ("original", "unificado"):
            context = browser.new_context(viewport={"width": 1024, "height": 768},
                                          service_workers="block")
            page = context.new_page()
            writes = []
            external = []
            def capture(req):
                if any(host in req.url for host in ("pcp.concretrack.com.br/api",
                                                     "supabase.co", "dautomacao.com/api")):
                    external.append(req.url.split("?", 1)[0])
                if req.method in {"POST", "PATCH", "DELETE"} and (
                    "saques-mandril" in req.url or "/rest/v1/producao" in req.url):
                    writes.append({"method": req.method,
                        "path": req.url.split("?", 1)[0].split("/api", 1)[-1],
                        "body": req.post_data_json if req.post_data and
                        "application/json" in req.headers.get("content-type", "") else None})
            page.on("request", capture)
            safe_to_clean = False
            try:
                login_operacao(page, account["MAPA_TEST_USER"],
                               account["MAPA_TEST_PASSWORD"], args.role)
                if variant == "original":
                    page.route(URL, lambda route: route.fulfill(status=200,
                        content_type="text/html; charset=utf-8",
                        body=BEFORE.read_text(encoding="utf-8")))
                    page.goto(URL, wait_until="domcontentloaded")
                    page.wait_for_function(f"state.authUser?.role === '{args.role}'")
                assert page.evaluate("async u => await (await fetch(u)).json()", PROD) == []
                safe_to_clean = True
                page.evaluate("""async date => {
                  const r=await fetch('/unificado/mapa/api/rest/v1/producao',{
                    method:'POST',headers:{'Content-Type':'application/json','Prefer':'return=representation'},
                    body:JSON.stringify({data_fabricacao:date,setor:'Setor 3',forma:'SC01',
                      modelo:'9x200',tipo_concreto:'Concreto Padrão',
                      colaborador:'Captura sintética',data_hora:date+'T12:00:00Z',
                      status:'LIBERADO'})});
                  if(!r.ok) throw new Error('Setup HTTP '+r.status);
                }""", DATE)
                initial = page.evaluate("""async date => {
                  setMode('MANDRIL_CIRCULAR');
                  await new Promise(resolve=>setTimeout(resolve,1200));
                  el.mcFiltroData.value=date;
                  await carregarMandrilCircular();
                  const row=[...document.querySelectorAll('#mcTabelaBody tr')]
                    .find(item=>item.querySelector('.mc-forma-numero')?.textContent==='SC01');
                  if(!row) throw new Error('Mandril row missing');
                  const select=row.querySelector('.mc-modelo-select');
                  return {text:row.innerText,options:[...select.options].map(o=>o.value),
                    value:select.value,action:row.querySelector('[data-mc-saque-forma]')?.innerText};
                }""", DATE)
                assert "Sacar Mandril" in initial["action"]
                chosen = page.evaluate("""async () => {
                  const row=[...document.querySelectorAll('#mcTabelaBody tr')]
                    .find(item=>item.querySelector('.mc-forma-numero')?.textContent==='SC01');
                  const select=row.querySelector('.mc-modelo-select');
                  const value=[...select.options].find(o=>o.value && o.value!==select.value)?.value;
                  if(!value) throw new Error('No alternate Mandril model');
                  select.value=value; select.dispatchEvent(new Event('change',{bubbles:true}));
                  await new Promise(resolve=>setTimeout(resolve,1000));
                  return value;
                }""")
                row_model = page.evaluate("async u => (await (await fetch(u)).json())[0]", PROD)
                assert row_model["modelo"] == chosen, (variant, chosen, row_model.get("modelo"))
                page.locator('#mcTabelaBody [data-mc-saque-forma="SC01"] button').click()
                page.wait_for_function("document.querySelector('[data-mc-saque-forma=\"SC01\"]')?.innerText.includes('Saque')")
                after_saque = page.evaluate("""() => {
                  const row=[...document.querySelectorAll('#mcTabelaBody tr')]
                    .find(item=>item.querySelector('.mc-forma-numero')?.textContent==='SC01');
                  return {model:row.querySelector('.mc-modelo-select')?.value,
                    action:row.querySelector('[data-mc-saque-forma]')?.innerText,
                    text:row.innerText};
                }""")
                saques = page.evaluate("async u => await (await fetch(u)).json()", SAQUES)
                saque_rows = [row for row in saques if row.get("codigo_forma") == FORM]
                assert len(saque_rows) == 1 and saque_rows[0]["data"] == DATE, saques
                assert saque_rows[0].get("data_hora_saque")
                page.evaluate("async () => await window.limparSaque('SC01')")
                page.wait_for_function("document.querySelector('[data-mc-saque-forma=\"SC01\"]')?.innerText.includes('Sacar Mandril')")
                after_undo = page.evaluate("""() => {
                  const row=[...document.querySelectorAll('#mcTabelaBody tr')]
                    .find(item=>item.querySelector('.mc-forma-numero')?.textContent==='SC01');
                  return {model:row.querySelector('.mc-modelo-select')?.value,
                    action:row.querySelector('[data-mc-saque-forma]')?.innerText};
                }""")
                assert not external, external
                assert after_undo["model"] == chosen
                assert "Sacar Mandril" in after_undo["action"]
                assert not [row for row in page.evaluate(
                    "async u => await (await fetch(u)).json()", SAQUES)
                    if row.get("codigo_forma") == FORM]
                initial["text"] = stable_text(initial["text"])
                after_saque["text"] = stable_text(after_saque["text"])
                after_saque["action"] = stable_text(after_saque["action"])
                snapshots.append({"initial": initial, "chosen_model": chosen,
                    "row": stable(row_model), "after_saque": after_saque,
                    "saque_row": {key: ("[generated]" if key == "data_hora_saque" else value)
                                  for key, value in saque_rows[0].items()
                                  if key not in {"id", "created_at", "updated_at"}},
                    "after_undo": after_undo,
                    "write_methods": [w["method"] for w in writes],
                    "write_hashes": [digest({k:v for k,v in w.items() if k!='body'} |
                        {"body": {k:v for k,v in (w["body"] or {}).items()
                                  if k not in {"data_hora", "data_hora_saque"}}}) for w in writes]})
            finally:
                if safe_to_clean:
                    page.evaluate("""async date => {
                      const s=await fetch('/unificado/mapa/api/pcp/saques-mandril?data='+date+'&codigo_forma=SC01',
                        {method:'DELETE'});
                      if(!s.ok) throw new Error('Saque cleanup '+s.status);
                    }""", DATE)
                    page.evaluate("""async u => {
                      const r=await fetch(u.replace('select=*&',''),{method:'DELETE'});
                      if(!r.ok) throw new Error('Production cleanup '+r.status);
                    }""", PROD)
                context.close()
        browser.close()
    OUT.mkdir(parents=True, exist_ok=True)
    path = OUT / f"mandril-ui-{args.role.lower()}.json"
    path.write_text(json.dumps(snapshots, ensure_ascii=False, indent=2), encoding="utf-8")
    assert snapshots[0] == snapshots[1], str(path)
    print(json.dumps({"mandril": "equal", "role": args.role, "cleaned": True}))


if __name__ == "__main__":
    main()
