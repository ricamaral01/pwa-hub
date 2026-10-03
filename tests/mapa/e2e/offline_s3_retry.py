"""Retry one S3 queue item through the published operation, test DB only."""

from __future__ import annotations

import json
from pathlib import Path

from playwright.sync_api import sync_playwright

from operacao_smoke import CHROME, credentials, login_operacao


def main() -> None:
    account = credentials()
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True, executable_path=CHROME)
        context = browser.new_context(viewport={"width": 1024, "height": 768},
                                      service_workers="block")
        page = context.new_page()
        writes = []
        page.on("request", lambda request: writes.append(request)
                if "/rest/v1/prog_s3_s4" in request.url and request.method == "POST" else None)
        login_operacao(page, account["MAPA_TEST_USER"], account["MAPA_TEST_PASSWORD"])
        before = page.evaluate("""async () => {
          const url='/unificado/mapa/api/rest/v1/prog_s3_s4?select=*'
            +'&data=eq.2026-10-03&forma=eq.SC23&setor=eq.Setor%203';
          return (await (await fetch(url)).json()).length;
        }""")
        assert before == 0, f"fixture target already exists: {before}"
        context.set_offline(True)
        queued = page.evaluate("""() => {
          const key='2026-10-03||SC23||Setor 3';
          const db=readProgS3S4Db();
          db.programacoes[key]={data:'2026-10-03',forma:'SC23',setor:'Setor 3',
            modelo:'12X600',pendingSync:true};
          writeProgS3S4Db(db);
          return readProgS3S4Db().programacoes[key].pendingSync;
        }""")
        assert queued
        context.set_offline(False)
        page.evaluate("syncOfflineData()")
        page.wait_for_function("""() =>
          readProgS3S4Db().programacoes['2026-10-03||SC23||Setor 3']?.pendingSync === false
        """, timeout=20000)
        result = page.evaluate("""async () => {
          const url='/unificado/mapa/api/rest/v1/prog_s3_s4?select=*'
            +'&data=eq.2026-10-03&forma=eq.SC23&setor=eq.Setor%203';
          return {rows:await (await fetch(url)).json(),
            pending:readProgS3S4Db().programacoes['2026-10-03||SC23||Setor 3'].pendingSync};
        }""")
        assert result["pending"] is False
        assert len(result["rows"]) == 1 and result["rows"][0]["modelo"] == "12X600"
        fixture = json.loads((Path(__file__).resolve().parents[1] / "fixtures" /
                              "captured-offline.json").read_text(encoding="utf-8"))
        expected = next(item for item in fixture["requests"]
                        if item.get("id") == "offline-199")
        expected_body = {**expected["body"], "data": "2026-10-03"}
        assert any(request.post_data_json == expected_body
                   and request.headers.get("prefer") == expected["headers"]["Prefer"]
                   and ("on_conflict=data%2Cforma%2Csetor" in request.url
                        or "on_conflict=data,forma,setor" in request.url)
                   for request in writes)
        print("offline_s3_queue=created retry=ok row=1 pending=false fixture_fields=equal")
        context.close()
        browser.close()


if __name__ == "__main__":
    main()
