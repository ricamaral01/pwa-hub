"""Compare original and unified montage UI writes on the isolated test database."""
from __future__ import annotations

import argparse
import hashlib
import json
import re
from pathlib import Path

from playwright.sync_api import sync_playwright

from inspection_photo_parity import DATE, PHOTO, canonical, normalize
from operacao_smoke import CHROME, OUT, URL, credentials, login_operacao

ROOT = Path(__file__).resolve().parents[3]
BEFORE = ROOT / ".work-mapa-unificado/operacao/index-before-desktop.html"
UUID = re.compile(r"[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}", re.I)
FORMS = {1: "IE-01", 2: "TCR-1"}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--role", choices=("MONTADOR", "GERENCIA"), default="MONTADOR")
    parser.add_argument("--sector", type=int, choices=(1, 2), default=1)
    parser.add_argument("--rejected", action="store_true")
    args = parser.parse_args()
    form = FORMS[args.sector]
    sector = f"Setor {args.sector}"
    prod_query = ("/unificado/mapa/api/rest/v1/producao?select=*"
                  f"&data_fabricacao=eq.{DATE}&setor=eq.Setor%20{args.sector}&forma=eq.{form}")
    mount_query = ("/unificado/mapa/api/rest/v1/montagem_poste?select=*"
                   f"&data_fabricacao=eq.{DATE}&setor=eq.Setor%20{args.sector}&forma_numero=eq.{form}")
    account = credentials()
    snapshots = []
    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True, executable_path=CHROME)
        for variant in ("original", "unificado"):
            context = browser.new_context(viewport={"width": 1024, "height": 768},
                                          service_workers="block",
                                          geolocation={"latitude": -23.5, "longitude": -46.6})
            context.grant_permissions(["geolocation"])
            page = context.new_page()
            writes = []
            write_items = {}
            created_key = None
            safe_to_clean = False

            def capture(req):
                if "/unificado/mapa/api/" not in req.url or req.method not in {"POST", "PATCH", "DELETE"}:
                    return
                path = req.url.split("/unificado/mapa/api", 1)[-1].split("?", 1)[0]
                ctype = req.headers.get("content-type", "")
                body = (canonical(req.post_data_json) if "application/json" in ctype
                        else {"photo": "PNG"} if "multipart/form-data" in ctype else None)
                item = {"method": req.method, "path": UUID.sub("[id]", path), "body": body}
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
                        content_type="text/html; charset=utf-8", body=BEFORE.read_text(encoding="utf-8")))
                    page.goto(URL, wait_until="domcontentloaded")
                    page.wait_for_function(f"state.authUser?.role === '{args.role}'")
                assert page.evaluate("async u => await (await fetch(u)).json()", prod_query) == []
                assert page.evaluate("async u => await (await fetch(u)).json()", mount_query) == []
                safe_to_clean = True
                page.evaluate("""async ({date,sector,form}) => {
                  const r=await fetch('/unificado/mapa/api/rest/v1/producao',{
                    method:'POST',headers:{'Content-Type':'application/json','Prefer':'return=representation'},
                    body:JSON.stringify({data_fabricacao:date,setor:sector,forma:form,modelo:'9x200',
                      descricao_poste:'9x200',codigo_produto:'678',
                      tipo_concreto:'Concreto Seco - Vibrado',colaborador:'Captura sintética',
                      data_hora:new Date().toISOString(),status:'LIBERADO'})});
                  if(!r.ok) throw new Error('Setup '+r.status);
                }""", {"date": DATE, "sector": sector, "form": form})
                started = page.evaluate("""async ({date,sector,form}) => {
                  setMode('MONTAGEM_POSTES'); el.mpFiltroData.value=date; el.mpSetor.value=sector;
                  const rows=await fetchPolesForDate(date,sector);
                  const pole=rows.find(row=>row.formaNumero===form);
                  if(!pole) throw new Error('Synthetic pole missing');
                  await openMontagemPosteDetalhe(pole);
                  return {key:state.montagemPostesAtual.key,mode:state.mode};
                }""", {"date": DATE, "sector": sector, "form": form})
                created_key = started["key"]
                assert started["mode"] == "MONTAGEM_POSTES_DETALHE"
                page.evaluate("""async ({photo,rejected}) => {
                  const sections=getMontagemChecklistSections(state.montagemPostesAtual.modelo||'');
                  const first=sections[0].itens[0];
                  setMontagemChecklistAnswer(sections[0].id,first.id,rejected?'nao':'sim');
                  if(rejected) await setMontagemChecklistPhoto(sections[0].id,first.id,photo);
                  for(const section of sections) for(const item of section.itens)
                    if(section.id!==sections[0].id || item.id!==first.id)
                      setMontagemChecklistAnswer(section.id,item.id,'sim');
                  setMontagemStatus(rejected?'R':'A');
                  await new Promise(resolve=>setTimeout(resolve,1200));
                  await finalizarMontagemPosteAtual();
                }""", {"photo": PHOTO, "rejected": args.rejected})
                rows = page.evaluate("async u => await (await fetch(u)).json()", mount_query)
                actual = [r for r in rows if r.get("etapa") != "HISTORICO_REPROVACAO"]
                history = [r for r in rows if r.get("etapa") == "HISTORICO_REPROVACAO"]
                assert len(actual) == 1 and actual[0]["status_montagem"] == ("R" if args.rejected else "A"), rows
                photos = page.evaluate("""async key => {
                  const r=await fetch('/unificado/mapa/api/inspecoes/'+encodeURIComponent(key)+'/fotos');
                  if(!r.ok) throw new Error('Photos '+r.status);
                  return (await r.json()).data;
                }""", created_key)
                assert len(photos) == (1 if args.rejected else 0), photos
                page.wait_for_timeout(750)
                card = page.evaluate("""async ({date,sector,form}) => {
                  setMode('MONTAGEM_POSTES'); el.mpFiltroData.value=date; el.mpSetor.value=sector;
                  await renderMontagemPostesLiberados();
                  const row=[...document.querySelectorAll('#mpLiberadosBody tr')]
                    .find(item=>item.dataset.formaNumero===form);
                  if(!row) throw new Error('Montage row missing');
                  const button=row.querySelector('button');
                  return {classes:row.className,text:row.innerText,
                    buttonColor:button?getComputedStyle(button).backgroundColor:null};
                }""", {"date": DATE, "sector": sector, "form": form})
                snapshots.append({"requests": sorted(writes), "row": normalize(actual[0]),
                                  "history": [normalize(r) for r in history],
                                  "photos": len(photos), "card": card,
                                  "request_catalog": write_items})
            finally:
                if safe_to_clean:
                    if created_key:
                        page.evaluate("""async key => {
                          const base='/unificado/mapa/api';
                          const r=await fetch(base+'/inspecoes/'+encodeURIComponent(key)+'/fotos');
                          if(r.ok) for(const photo of (await r.json()).data){
                            const d=await fetch(base+'/fotos/'+photo.id+'?usuario=Captura',{method:'DELETE'});
                            if(!d.ok) throw new Error('Photo cleanup '+d.status);
                          }
                        }""", created_key)
                    for query in (mount_query, prod_query):
                        page.evaluate("""async u => {
                          const r=await fetch(u.replace('select=*&',''),{method:'DELETE'});
                          if(!r.ok) throw new Error('Cleanup '+r.status);
                        }""", query)
                context.close()
        browser.close()
    OUT.mkdir(parents=True, exist_ok=True)
    path = OUT / f"montage-{'rejected' if args.rejected else 'approved'}-{args.role.lower()}-s{args.sector}.json"
    path.write_text(json.dumps(snapshots, ensure_ascii=False, indent=2), encoding="utf-8")
    assert snapshots[0] == snapshots[1], str(path)
    print(json.dumps({"montage": "equal", "role": args.role, "sector": args.sector,
                      "rejected": args.rejected, "photos": snapshots[0]["photos"], "cleaned": True}))


if __name__ == "__main__":
    main()
