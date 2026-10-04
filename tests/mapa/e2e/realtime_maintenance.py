"""Check maintenance Realtime delivery and card refresh on a second tablet."""

from __future__ import annotations

import json
import time

from playwright.sync_api import sync_playwright

from operacao_smoke import CHROME, credentials, login_operacao


ROW_ID = "Setor 3_SC29"


def main() -> None:
    account = credentials()
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True, executable_path=CHROME)
        contexts = [browser.new_context(viewport={"width": 1024, "height": 768},
                                        service_workers="block") for _ in range(2)]
        observer, writer = (context.new_page() for context in contexts)
        frames = []
        writes = []

        def attached(socket):
            if "realtime/v1/websocket" in socket.url:
                socket.on("framereceived", lambda raw: frames.append(json.loads(raw)))

        observer.on("websocket", attached)
        writer.on("request", lambda request: writes.append(request)
                  if "/rest/v1/formas_manutencao" in request.url
                  and request.method == "POST" else None)
        cleanup_allowed = False
        try:
            for page in (observer, writer):
                login_operacao(page, account["MAPA_TEST_USER"], account["MAPA_TEST_PASSWORD"])
                page.evaluate("""async () => {
                  setMode('LIBERACAO_S3');
                  el.libData.value='2026-10-03';
                  el.libData.dispatchEvent(new Event('change',{bubbles:true}));
                  await renderLiberacaoDual();
                }""")
                page.wait_for_function("() => !!document.querySelector('#libSetor3Cols [data-forma-numero=\"SC29\"]')")
            before = writer.evaluate("""async id => {
              const response=await fetch('/unificado/mapa/api/rest/v1/formas_manutencao?id=eq.'+id+'&select=*');
              return (await response.json()).length;
            }""", ROW_ID)
            assert before == 0, f"Fixture target already exists: {before}"
            cleanup_allowed = True
            card = observer.locator('#libSetor3Cols [data-forma-numero="SC29"]')
            assert "is-manutencao" not in (card.get_attribute("class") or "")
            start = time.monotonic()
            writer.evaluate("salvarFormaParadaManutencao('Setor 3','SC29','Captura sintética','Verificar')")
            observer.wait_for_function("""() => document.querySelector(
                '#libSetor3Cols [data-forma-numero="SC29"]')?.classList.contains('is-manutencao')""", timeout=10000)
            latency = round(time.monotonic() - start, 2)
            events = [frame for frame in frames if isinstance(frame, list) and len(frame) == 5
                      and frame[3] == "postgres_changes"
                      and frame[4].get("data", {}).get("table") == "formas_manutencao"]
            assert events and events[0][4]["data"]["record"]["id"] == ROW_ID
            assert writes and writes[0].post_data_json["id"] == ROW_ID
            assert "is-manutencao" in (card.get_attribute("class") or "")
            print(json.dumps({"realtime_maintenance": "equal", "event": "INSERT",
                              "second_tablet_card": "is-manutencao",
                              "latency_seconds": latency, "test_database_only": True},
                             ensure_ascii=False))
        finally:
            if cleanup_allowed:
                cleanup = observer.evaluate("""async id => {
                  const response=await fetch('/unificado/mapa/api/rest/v1/formas_manutencao?id=eq.'+id,
                    {method:'DELETE'});
                  return response.status;
                }""", ROW_ID)
                print(json.dumps({"synthetic_cleanup_http": cleanup}))
            for context in contexts:
                context.close()
            browser.close()


if __name__ == "__main__":
    main()
