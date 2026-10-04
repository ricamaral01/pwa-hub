"""Compare all 52 S3 sequence upserts from original and unified UI."""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path

from playwright.sync_api import sync_playwright

from operacao_smoke import CHROME, OUT, URL, credentials, login_operacao

ROOT = Path(__file__).resolve().parents[3]
BEFORE = ROOT / ".work-mapa-unificado/operacao/index-before-desktop.html"
DATE = "2099-01-23"
QUERY = ("/unificado/mapa/api/rest/v1/prog_s3_s4?select=*"
         f"&data=eq.{DATE}&setor=eq.Setor%203")


def row_fields(row):
    return {key: row.get(key) for key in ("data", "forma", "setor", "modelo")}


def sha(value):
    return hashlib.sha256(json.dumps(value, ensure_ascii=False,
                                     sort_keys=True).encode()).hexdigest()


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--role", choices=("GERENCIA", "GESTOR", "APONTADOR", "MONTADOR"),
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
            safe_to_clean = False
            def capture(req):
                if "/rest/v1/prog_s3_s4" not in req.url or req.method not in {"POST", "PATCH"}:
                    return
                writes.append({"method": req.method,
                    "path": req.url.split("/api", 1)[-1].split("?", 1)[0],
                    "query": req.url.split("?", 1)[-1] if "?" in req.url else "",
                    "body": req.post_data_json,
                    "prefer": req.headers.get("prefer")})
            page.on("request", capture)
            try:
                login_operacao(page, account["MAPA_TEST_USER"],
                               account["MAPA_TEST_PASSWORD"], args.role)
                if variant == "original":
                    page.route(URL, lambda route: route.fulfill(status=200,
                        content_type="text/html; charset=utf-8",
                        body=BEFORE.read_text(encoding="utf-8")))
                    page.goto(URL, wait_until="domcontentloaded")
                    page.wait_for_function(f"state.authUser?.role === '{args.role}'")
                assert page.evaluate("async u => await (await fetch(u)).json()", QUERY) == []
                safe_to_clean = True
                view = page.evaluate("""async date => {
                  setMode('SEQUENCIA_S3');
                  await new Promise(resolve=>setTimeout(resolve,600));
                  el.seqS3Data.value=date;
                  await renderSequenciaS3();
                  const selects=[...document.querySelectorAll('.seq-s3-select')];
                  if(selects.length!==52) throw new Error('Expected 52 forms');
                  const first=selects.find(s=>s.dataset.forma==='SC01');
                  const model=[...first.options].find(o=>o.value)?.value;
                  if(!model) throw new Error('No SC01 model');
                  first.value=model;
                  const before={count:selects.length, first:first.value,
                    total:document.querySelector('#seqS3TotalCount')?.innerText};
                  await saveSequenciaS3();
                  return before;
                }""", DATE)
                rows = page.evaluate("async u => await (await fetch(u)).json()", QUERY)
                assert len(rows) == 52, (variant, len(rows))
                actual = sorted((row_fields(row) for row in rows), key=lambda row: row["forma"])
                assert actual[0]["modelo"] == view["first"]
                assert all(row["modelo"] == "" for row in actual[1:]), actual
                # Reopen through the same UI to check the visible persisted choice.
                persisted = page.evaluate("""async date => {
                  if(window.closeMsgBox) closeMsgBox();
                  setMode('SEQUENCIA_S3');
                  await new Promise(resolve=>setTimeout(resolve,600));
                  el.seqS3Data.value=date;
                  await renderSequenciaS3();
                  return {count:document.querySelectorAll('.seq-s3-select').length,
                    first:document.querySelector('.seq-s3-select[data-forma="SC01"]')?.value,
                    total:document.querySelector('#seqS3TotalCount')?.innerText};
                }""", DATE)
                assert persisted["first"] == view["first"]
                assert len(writes) == 52
                snapshots.append({"view": view, "persisted": persisted,
                                  "rows_sha256": sha(actual),
                                  "request_hashes": sorted(sha(item) for item in writes),
                                  "request_count": len(writes)})
            finally:
                if safe_to_clean:
                    page.evaluate("""async u => {
                      const r=await fetch(u.replace('select=*&',''),{method:'DELETE'});
                      if(!r.ok) throw new Error('Cleanup HTTP '+r.status);
                    }""", QUERY)
                context.close()
        browser.close()
    OUT.mkdir(parents=True, exist_ok=True)
    path = OUT / f"sequence-s3-{args.role.lower()}.json"
    path.write_text(json.dumps(snapshots, ensure_ascii=False, indent=2), encoding="utf-8")
    assert snapshots[0] == snapshots[1], str(path)
    print(json.dumps({"sequence_s3": "equal", "role": args.role,
                      "upserts": 52, "cleaned": True}))


if __name__ == "__main__":
    main()
