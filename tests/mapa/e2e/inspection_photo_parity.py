"""Compare one real inspection checklist and photo on the isolated test server."""

from __future__ import annotations

import json
import base64
import sys
import argparse
import hashlib
import re
from collections import Counter
from pathlib import Path

from playwright.sync_api import sync_playwright

from operacao_smoke import CHROME, OUT, URL, credentials, login_operacao


ROOT = Path(__file__).resolve().parents[3]
BEFORE = ROOT / ".work-mapa-unificado" / "operacao" / "index-before-desktop.html"
sys.path.insert(0, str(ROOT / "tests" / "mapa"))
from contract_photos import PHOTO as PNG_BYTES
DATE = "2099-01-17"
FORMS = {3: "SC29", 4: "C-F1-1"}
PHOTO = "data:image/png;base64," + base64.b64encode(PNG_BYTES).decode()


def normalize(row: dict) -> dict:
    result = {key: value for key, value in row.items() if key not in {
        "id", "record_id", "inicio_inspecao_montagem", "finalizado_em",
        "created_at", "updated_at"}}
    checklists = result.get("checklists")
    if isinstance(checklists, dict):
        result["checklists"] = {
            section: ({key: ("[photo]" if key.endswith("_photo") and value else value)
                       for key, value in values.items()} if isinstance(values, dict) else values)
            for section, values in checklists.items()
            if section not in {"dia_inspecao", "horario_dispositivo", "geolocation"}}
    return result


UUID = re.compile(r"[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}", re.I)
DYNAMIC_FIELDS = {"id", "record_id", "recordId", "key", "inicio_inspecao_montagem",
                  "inicioInspecaoMontagem", "finalizado_em", "finalizadoEm", "created_at",
                  "updated_at", "timestamp", "data_hora", "dia_inspecao", "horario_dispositivo",
                  "geolocation"}


def canonical(value, key=""):
    if isinstance(value, dict):
        return {name: canonical(item, name) for name, item in value.items()
                if name not in DYNAMIC_FIELDS}
    if isinstance(value, list):
        return [canonical(item, key) for item in value]
    if isinstance(value, str):
        if key.endswith("_photo"):
            return "[photo]"
        return UUID.sub("[id]", value)
    return value


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--role", choices=("MONTADOR", "GERENCIA"), default="MONTADOR")
    parser.add_argument("--sector", type=int, choices=(3, 4), default=3)
    parser.add_argument("--approved", action="store_true")
    args = parser.parse_args()
    sector = f"Setor {args.sector}"
    form = FORMS[args.sector]
    account = credentials()
    source = BEFORE.read_text(encoding="utf-8")
    prod_query = ("/unificado/mapa/api/rest/v1/producao?select=*"
                  f"&data_fabricacao=eq.{DATE}&setor=eq.Setor%20{args.sector}&forma=eq.{form}")
    mount_query = ("/unificado/mapa/api/rest/v1/montagem_poste?select=*"
                   f"&data_fabricacao=eq.{DATE}&setor=eq.Setor%20{args.sector}&forma_numero=eq.{form}")
    variants = []
    catalogs = []
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True, executable_path=CHROME)
        for variant in ("original", "unificado"):
            context = browser.new_context(viewport={"width": 1024, "height": 768},
                                          service_workers="block",
                                          geolocation={"latitude": -23.5, "longitude": -46.6})
            context.grant_permissions(["geolocation"])
            page = context.new_page()
            created_key = None
            safe_to_clean = False
            writes = []
            write_items = {}
            def capture(request):
                if "/unificado/mapa/api/" not in request.url or request.method not in {
                    "POST", "PATCH", "DELETE"}:
                    return
                path = request.url.split("/unificado/mapa/api", 1)[-1].split("?", 1)[0]
                content_type = request.headers.get("content-type", "")
                if "multipart/form-data" in content_type:
                    body = {"photo": "PNG enviado e confirmado pela API"}
                elif "application/json" in content_type:
                    body = canonical(request.post_data_json)
                else:
                    body = None
                item = {"method": request.method, "path": UUID.sub("[id]", path),
                        "body": body}
                digest = hashlib.sha256(json.dumps(item, ensure_ascii=False,
                    sort_keys=True).encode()).hexdigest()
                writes.append(digest)
                write_items[digest] = item
            page.on("request", capture)
            try:
                login_operacao(page, account["MAPA_TEST_USER"],
                               account["MAPA_TEST_PASSWORD"], args.role)
                if variant == "original":
                    page.route(URL, lambda route: route.fulfill(status=200,
                        content_type="text/html; charset=utf-8", body=source))
                    page.goto(URL, wait_until="domcontentloaded")
                    page.wait_for_function(f"state.authUser?.role === '{args.role}'")
                assert page.evaluate("async url => await (await fetch(url)).json()", prod_query) == []
                assert page.evaluate("async url => await (await fetch(url)).json()", mount_query) == []
                safe_to_clean = True
                page.evaluate("""async ({date,sector,form}) => {
                  const response=await fetch('/unificado/mapa/api/rest/v1/producao',{
                    method:'POST',headers:{'Content-Type':'application/json','Prefer':'return=representation'},
                    body:JSON.stringify({data_fabricacao:date,setor:sector,forma:form,modelo:'9x200',
                      descricao_poste:'9x200',codigo_produto:'678',
                      tipo_concreto:'Concreto Seco - Vibrado',colaborador:'Captura sintética',
                      data_hora:new Date().toISOString(),status:'LIBERADO'})
                  });
                  if(!response.ok) throw new Error('Setup HTTP '+response.status);
                }""", {"date": DATE, "sector": sector, "form": form})
                opened = page.evaluate("""async ({date,sector,form}) => {
                  setMode('INSPECAO');
                  el.insFiltroData.value=date;
                  const rows=await fetchPolesForDate(date,sector);
                  const pole=rows.find(row=>row.formaNumero===form);
                  if(!pole) throw new Error('Synthetic pole not found');
                  await openInspecaoPosteDetalhe(pole);
                  return {key:state.inspecaoPostesAtual.key,
                          status:state.inspecaoPostesAtual.statusMontagem,
                          mode:state.mode};
                }""", {"date": DATE, "sector": sector, "form": form})
                created_key = opened["key"]
                assert opened["mode"] == "INSPECAO_DETALHE"
                summary = page.evaluate("""async ({photo,approved}) => {
                  const sections=getInspecaoChecklistSections(state.inspecaoPostesAtual.modelo||'');
                  const first=sections[0].itens[0];
                  setInspecaoChecklistAnswer(sections[0].id,first.id,approved?'sim':'nao');
                  if(!approved) await setInspecaoChecklistPhoto(sections[0].id,first.id,photo);
                  for(const section of sections) for(const item of section.itens)
                    if(section.id!==sections[0].id || item.id!==first.id)
                      setInspecaoChecklistAnswer(section.id,item.id,'sim');
                  await new Promise(resolve=>setTimeout(resolve,1200));
                  await finalizarInspecaoPosteAtual();
                  return {status:state.inspecaoPostesAtual?.statusMontagem,
                          reason:state.inspecaoPostesAtual?.motivoRecusa,
                          photo:!!state.inspecaoPostesAtual?.checklists?.[sections[0].id]?.[first.id+'_photo'],
                          header:document.getElementById('insDetalheHeader')?.innerText||''};
                }""", {"photo": PHOTO, "approved": args.approved})
                rows = page.evaluate("async url => await (await fetch(url)).json()", mount_query)
                ins_rows = [row for row in rows if row.get("etapa") == "INSPECAO"]
                history_rows = [row for row in rows if row.get("etapa") == "HISTORICO_REPROVACAO"]
                expected_status = "A" if args.approved else "R"
                assert summary["status"] == expected_status
                assert summary["photo"] is (not args.approved)
                assert len(ins_rows) == 1 and len(history_rows) == (0 if args.approved else 1), rows
                assert ins_rows[0]["status_montagem"] == expected_status
                photos = page.evaluate("""async key => {
                  const response=await fetch('/unificado/mapa/api/inspecoes/'+encodeURIComponent(key)+'/fotos');
                  if(!response.ok) throw new Error('Photo list HTTP '+response.status);
                  return (await response.json()).data;
                }""", created_key)
                assert len(photos) == (0 if args.approved else 1), photos
                photo_sha = page.evaluate("""async url => {
                  const response=await fetch(url);
                  if(!response.ok) throw new Error('Photo read HTTP '+response.status);
                  const digest=await crypto.subtle.digest('SHA-256',await response.arrayBuffer());
                  return [...new Uint8Array(digest)].map(value=>value.toString(16).padStart(2,'0')).join('');
                }""", photos[0]["url"]) if photos else None
                page.wait_for_timeout(800)
                settled_rows = page.evaluate("async url => await (await fetch(url)).json()", mount_query)
                assert any(row.get("etapa") == "INSPECAO" and row.get("status_montagem") == expected_status
                           for row in settled_rows), settled_rows
                list_row = page.evaluate("""async ({date,form}) => {
                  setMode('INSPECAO');
                  el.insFiltroData.value=date;
                  await renderInspecaoLiberados();
                  const row=[...document.querySelectorAll('#insLiberadosBody tr')]
                    .find(item=>item.dataset.formaNumero===form);
                  if(!row) throw new Error('Inspection list row missing');
                  const button=row.querySelector('button');
                  return {classes:row.className,text:row.innerText,
                          buttonColor:button?getComputedStyle(button).backgroundColor:null};
                }""", {"date": DATE, "form": form})
                variants.append({"status": summary["status"], "reason": summary["reason"],
                                 "photo_count": len(photos), "photo_sha256": photo_sha,
                                 "inspection": normalize(ins_rows[0]),
                                 "history": normalize(history_rows[0]) if history_rows else None,
                                 "list_row": list_row,
                                 "request_hashes": sorted(writes)})
                catalogs.append(write_items)
            finally:
                if safe_to_clean:
                    if created_key:
                        page.evaluate("""async key => {
                          const base='/unificado/mapa/api';
                          const response=await fetch(base+'/inspecoes/'+encodeURIComponent(key)+'/fotos');
                          if(response.ok) for(const photo of (await response.json()).data){
                            const removed=await fetch(base+'/fotos/'+photo.id+'?usuario='
                              +encodeURIComponent(state.authUser?.name||'Captura'),{method:'DELETE'});
                            if(!removed.ok) throw new Error('Photo cleanup HTTP '+removed.status);
                          }
                        }""", created_key)
                    for query in (mount_query, prod_query):
                        page.evaluate("""async url => {
                          const response=await fetch(url.replace('select=*&',''),{method:'DELETE'});
                          if(!response.ok) throw new Error('Cleanup HTTP '+response.status);
                        }""", query)
                context.close()
        browser.close()
    OUT.mkdir(parents=True, exist_ok=True)
    if variants[0] != variants[1]:
        left = Counter(variants[0]["request_hashes"])
        right = Counter(variants[1]["request_hashes"])
        difference = {"original_only": [catalogs[0][digest] for digest in (left-right)],
                      "unified_only": [catalogs[1][digest] for digest in (right-left)]}
        (OUT / "inspection-request-diff-private.json").write_text(
            json.dumps(difference, ensure_ascii=False, indent=2), encoding="utf-8")
        assert variants[0] == variants[1], {
            "original_only": sum((left-right).values()),
            "unified_only": sum((right-left).values()),
            "diff_file": str(OUT / "inspection-request-diff-private.json")}
    (OUT / f"inspection-{'approved' if args.approved else 'photo'}-{args.role.lower()}-s{args.sector}.json").write_text(
        json.dumps(variants, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({"inspection": "approved_equal" if args.approved else "photo_equal",
                      "role": args.role, "sector": args.sector,
                      "rows": 1 if args.approved else 2,
                      "photo": 0 if args.approved else 1, "cleaned": True},
                     ensure_ascii=False))


if __name__ == "__main__":
    main()
