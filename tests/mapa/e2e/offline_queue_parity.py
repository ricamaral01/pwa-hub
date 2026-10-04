"""Compare offline queue retry for four Mapa record types on the test DB."""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
from urllib.parse import urlsplit

from playwright.sync_api import sync_playwright

from operacao_smoke import CHROME, OUT, URL, credentials, login_operacao

ROOT = Path(__file__).resolve().parents[3]
BEFORE = ROOT / ".work-mapa-unificado/operacao/index-before-desktop.html"
DATE = "2099-02-02"
FORMS = {1: "100-1", 2: "A-36", 3: "SC29", 4: "C-F1-1"}
TABLES = {"s3": "prog_s3_s4", "liberacao": "liberacao_formas",
          "inspecao": "montagem_poste", "montagem": "montagem_poste"}


def query_for(scenario, sector):
    table = TABLES[scenario]
    form = "SC23" if scenario == "s3" else FORMS[sector]
    if scenario == "s3":
        filters = f"data=eq.{DATE}&forma=eq.{form}&setor=eq.Setor%203"
    else:
        field = "forma_numero" if scenario in {"inspecao", "montagem"} else "forma"
        filters = (f"data_fabricacao=eq.{DATE}&setor=eq.Setor%20{sector}"
                   f"&{field}=eq.{form}")
    return table, form, f"/unificado/mapa/api/rest/v1/{table}?select=*&{filters}"


def canonical(value):
    if isinstance(value, dict):
        return {key: canonical(item) for key, item in value.items()
                if key not in {"id", "created_at", "updated_at"}}
    if isinstance(value, list):
        return [canonical(item) for item in value]
    return value


def digest(value):
    return hashlib.sha256(json.dumps(value, ensure_ascii=False,
                                     sort_keys=True).encode()).hexdigest()


def run_variant(browser, variant, role, account, scenario, sector):
    context = browser.new_context(viewport={"width": 1024, "height": 768},
                                  service_workers="block")
    page = context.new_page()
    writes = []

    def capture(req):
        if "/unificado/mapa/api/rest/v1/" not in req.url or req.method not in {
                "POST", "PATCH", "DELETE"}:
            return
        parts = urlsplit(req.url)
        writes.append({"method": req.method, "path": parts.path,
                       "query": parts.query, "body": req.post_data_json if req.post_data else None,
                       "prefer": req.headers.get("prefer", "")})

    page.on("request", capture)
    login_operacao(page, account["MAPA_TEST_USER"],
                   account["MAPA_TEST_PASSWORD"], role)
    if variant == "original":
        page.route(URL, lambda route: route.fulfill(status=200,
            content_type="text/html; charset=utf-8",
            body=BEFORE.read_text(encoding="utf-8")))
        page.goto(URL, wait_until="domcontentloaded")
        page.wait_for_function(f"state.authUser?.role === '{role}'")
    table, form, query = query_for(scenario, sector)
    before = page.evaluate("""async query => {
      const response=await fetch(query);
      if(!response.ok) throw Error('preflight '+response.status);
      return (await response.json()).length;
    }""", query)
    assert before == 0, (scenario, before)
    production_query = None
    if scenario in {"inspecao", "montagem"}:
        production_query = ("/unificado/mapa/api/rest/v1/producao?select=*"
                            f"&data_fabricacao=eq.{DATE}&setor=eq.Setor%20{sector}&forma=eq.{form}")
        seeded = page.evaluate("""async ({query,date,sector,form}) => {
          const prior=await (await fetch(query)).json();
          if(prior.length) throw Error('production fixture exists');
          const response=await fetch('/unificado/mapa/api/rest/v1/producao',{
            method:'POST',headers:{'Content-Type':'application/json',
              'Prefer':'return=representation'},
            body:JSON.stringify({data_fabricacao:date,setor:sector,forma:form,
              modelo:'Modelo E2E',tipo_concreto:'Concreto Padrão',
              colaborador:'E2E offline',data_hora:'2099-02-02T09:00:00-03:00',
              status:'LIBERADO'})});
          if(!response.ok) throw Error('production setup '+response.status);
          return (await response.json()).length;
        }""", {"query": production_query, "date": DATE,
                 "sector": f"Setor {sector}", "form": form})
        assert seeded == 1
    writes.clear()  # fixture setup is not an offline queue request
    context.set_offline(True)
    queued = page.evaluate("""({scenario,sector,form}) => {
      const date='2099-02-02';
      if(scenario==='s3'){
        const db=readProgS3S4Db();
        db.programacoes[date+'||SC23||Setor 3']={data:date,forma:'SC23',
          setor:'Setor 3',modelo:'12X600',pendingSync:true};
        writeProgS3S4Db(db);
        return db.programacoes[date+'||SC23||Setor 3'].pendingSync;
      }
      if(scenario==='liberacao'){
        const db=readDb();
        db.events.push({id:'offline-l-20990202',etapa:'LIBERACAO',
          timestamp:'2099-02-02T09:15:00-03:00',setor:'Setor '+sector,
          formaNumero:form,dataFabricacao:date,colaborador:'E2E',
          modelo:'Modelo E2E',tipoConcreto:'Padrão',status:'LIBERADO',
          pendingSync:true});
        writeDb(db);
        return db.events.at(-1).pendingSync;
      }
      const entry={key:'offline-'+scenario+'-20990202',
        recordId:'offline-'+scenario+'-record',dataFabricacao:date,
        setor:'Setor '+sector,formaNumero:form,
        modelo:'Modelo E2E',statusMontagem:'A',motivoRecusa:'',
        etapa:scenario==='inspecao'?'INSPECAO':'MONTAGEM',
        inicioInspecaoMontagem:'2099-02-02T09:15:00-03:00',
        finalizadoEm:'2099-02-02T09:20:00-03:00',
        checklists:{},observacoesMontagem:'E2E offline',pendingSync:true};
      if(scenario==='montagem'){
        const db=readMontagemPostesDb();db.postes[entry.key]=entry;
        writeMontagemPostesDb(db);
        return db.postes[entry.key].pendingSync;
      }
      const db=readDb();
      db.records.push({id:entry.recordId,dataFabricacao:date,setor:entry.setor,
        formaNumero:entry.formaNumero,modelo:entry.modelo,
        inspecoes:[{status:'A',pendingSync:true,colaborador:'E2E',
          observacoes:'E2E offline',codigos:[]}]});
      db.events.push({id:'offline-i-20990202',etapa:'INSPECAO',
        recordId:entry.recordId,timestamp:'2099-02-02T09:20:00-03:00',
        pendingSync:true});
      writeDb(db);
      return db.events.at(-1).pendingSync;
    }""", {"scenario": scenario, "sector": sector, "form": form})
    assert queued
    context.set_offline(False)
    page.wait_for_function("""scenario => {
      if(scenario==='s3') return readProgS3S4Db().programacoes[
        '2099-02-02||SC23||Setor 3']?.pendingSync===false;
      if(scenario==='montagem') return readMontagemPostesDb().postes[
        'offline-montagem-20990202']?.pendingSync===false;
      const db=readDb();
      const ev=db.events.find(item=>item.id===
        (scenario==='liberacao'?'offline-l-20990202':'offline-i-20990202'));
      return ev?.pendingSync===false;
    }""", arg=scenario, timeout=20000)
    row = page.evaluate("""async query => {
      const response=await fetch(query);
      if(!response.ok) throw Error('row '+response.status);
      return await response.json();
    }""", query)
    assert len(row) == 1, (scenario, row)
    # Browser state is checked before the cleanup request.
    queue = page.evaluate("""scenario => {
      if(scenario==='s3') return readProgS3S4Db().programacoes[
        '2099-02-02||SC23||Setor 3'].pendingSync;
      if(scenario==='montagem') return readMontagemPostesDb().postes[
        'offline-montagem-20990202'].pendingSync;
      const db=readDb();
      return db.events.find(item=>item.id===
        (scenario==='liberacao'?'offline-l-20990202':'offline-i-20990202')).pendingSync;
    }""", scenario)
    assert queue is False
    if scenario == "s3":
        card = page.evaluate("""async date => {
          setMode('SEQUENCIA_S3');el.seqS3Data.value=date;
          await renderSequenciaS3();
          const select=document.querySelector('#seqS3List select[data-forma="SC23"]');
          return {model:select?.value||'',classes:select?.closest('.seq-s3-item')?.className||'',
            text:select?.closest('.seq-s3-item')?.innerText||''};
        }""", DATE)
    elif scenario == "liberacao":
        card = page.evaluate("""async ({date,sector,form}) => {
          el.libData.value=date;el.kioskLibData.value=date;
          setMode('LIBERACAO_S'+sector);await loadClickedFormsFromSupabase();
          renderLiberacaoDual();
          const node=document.querySelector('#libSetor'+sector+'Cols .forma-card[data-forma-numero="'+form+'"]');
          if(!node) throw Error('offline liberation card missing');
          return {text:node.innerText,classes:node.className,
            color:getComputedStyle(node).backgroundColor};
        }""", {"date": DATE, "sector": sector, "form": form})
    elif scenario == "inspecao":
        card = page.evaluate("""async ({date,sector,form}) => {
          setMode('INSPECAO');el.insFiltroData.value=date;
          state.activeInsSector='Setor '+sector;await renderInspecaoLiberados();
          const node=[...document.querySelectorAll('#insLiberadosBody tr')]
            .find(row=>row.dataset.formaNumero===form);
          if(!node) throw Error('offline inspection card missing');
          return {text:node.innerText,classes:node.className,
            color:getComputedStyle(node).backgroundColor};
        }""", {"date": DATE, "sector": sector, "form": form})
    else:
        card = page.evaluate("""async ({date,sector,form}) => {
          setMode('MONTAGEM_POSTES');el.mpFiltroData.value=date;el.mpSetor.value='Setor '+sector;
          await renderMontagemPostesLiberados();
          const node=[...document.querySelectorAll('#mpLiberadosBody tr')]
            .find(row=>row.dataset.formaNumero===form);
          if(!node) throw Error('offline montage card missing');
          const button=node.querySelector('button');
          return {text:node.innerText,classes:node.className,
            color:button?getComputedStyle(button).backgroundColor:null};
        }""", {"date": DATE, "sector": sector, "form": form})
    tested_writes = list(writes)
    cleanup = page.evaluate("""async query => {
      const response=await fetch(query.replace('select=*&',''),{method:'DELETE'});
      return response.status;
    }""", query)
    assert cleanup in {200, 204}, (scenario, cleanup)
    if production_query:
        production_cleanup = page.evaluate("""async query => {
          const response=await fetch(query.replace('select=*&',''),{method:'DELETE'});
          return response.status;
        }""", production_query)
        assert production_cleanup in {200, 204}, production_cleanup
    residue = page.evaluate("""async query => (await (await fetch(query)).json()).length""", query)
    assert residue == 0, (scenario, residue)
    context.close()
    return {"writes": tested_writes, "row": canonical(row[0]), "card": card,
            "queue_pending": queue, "cleanup_residue": residue}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--role", choices=("GERENCIA", "GESTOR", "MONTADOR", "APONTADOR"),
                        default="GERENCIA")
    parser.add_argument("--scenario", choices=tuple(TABLES), required=True)
    parser.add_argument("--sector", type=int)
    args = parser.parse_args()
    if args.sector is None:
        args.sector = 3 if args.scenario in {"s3", "inspecao"} else 1
    allowed = {"s3": {3}, "liberacao": {1, 2, 3},
               "inspecao": {3, 4}, "montagem": {1, 2}}
    if args.sector not in allowed[args.scenario]:
        parser.error("sector does not apply to scenario")
    account = credentials()
    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True, executable_path=CHROME)
        original = run_variant(browser, "original", args.role, account,
                               args.scenario, args.sector)
        unified = run_variant(browser, "unificado", args.role, account,
                              args.scenario, args.sector)
        browser.close()
    OUT.mkdir(parents=True, exist_ok=True)
    path = OUT / f"offline-{args.scenario}-{args.role.lower()}-s{args.sector}.json"
    path.write_text(json.dumps({"original": original, "unificado": unified},
                               ensure_ascii=False, indent=2), encoding="utf-8")
    assert original == unified, str(path)
    print(json.dumps({"scenario": args.scenario, "role": args.role,
                      "sector": args.sector,
                      "parity": "equal", "writes": len(original["writes"]),
                      "request_hash": digest(original["writes"]),
                      "row_hash": digest(original["row"]), "cleanup_residue": 0}))


if __name__ == "__main__":
    main()
