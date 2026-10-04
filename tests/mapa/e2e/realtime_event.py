"""Check original Realtime event delivery and second-tablet card update."""

from __future__ import annotations

import json
import time

from playwright.sync_api import sync_playwright

from operacao_smoke import CHROME, credentials, login_operacao


DATE = "2026-10-03"


def main() -> None:
    account = credentials()
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True, executable_path=CHROME)
        contexts = [browser.new_context(viewport={"width": 1024, "height": 768},
                                        service_workers="block") for _ in range(2)]
        observer, writer = (context.new_page() for context in contexts)
        frames = []
        def attached(socket):
            socket.on('framereceived', lambda raw: frames.append(json.loads(raw))
                      if 'realtime/v1/websocket' in socket.url else None)
        observer.on('websocket', attached)
        created_id = None
        try:
            for page in (observer, writer):
                login_operacao(page, account["MAPA_TEST_USER"], account["MAPA_TEST_PASSWORD"])
                page.evaluate("""async day => {
                  setMode('LIBERACAO_S1');
                  el.libData.value=day;
                  el.libData.dispatchEvent(new Event('change',{bubbles:true}));
                  await new Promise(resolve=>setTimeout(resolve,1500));
                }""", DATE)
            observer.wait_for_function("() => !!document.querySelector('#libSetor1Cols .forma-card')")
            observer.wait_for_timeout(500)
            assert any(isinstance(frame, list) and len(frame) == 5 and frame[3] == 'phx_reply'
                       and frame[4].get('status') == 'ok' for frame in frames)
            assert 'is-saved' not in observer.locator('#libSetor1Cols .forma-card').first.get_attribute('class')
            before = writer.evaluate("""async day => {
              const response=await fetch('/unificado/mapa/api/rest/v1/producao?select=id'
                +'&data_fabricacao=eq.'+day+'&setor=eq.Setor%201&forma=eq.IE-01');
              return (await response.json()).length;
            }""", DATE)
            assert before == 0, f"Fixture form already has production: {before}"
            start = time.monotonic()
            created_id = writer.evaluate("""async day => {
              const response=await fetch('/unificado/mapa/api/rest/v1/producao', {
                method:'POST', headers:{'Content-Type':'application/json','Prefer':'return=representation'},
                body:JSON.stringify({data_fabricacao:day,setor:'Setor 1',forma:'IE-01',
                  modelo:'9x200',descricao_poste:'9x200',codigo_produto:'678',
                  tipo_concreto:'Concreto Seco - Vibrado',colaborador:'Captura',
                  data_hora:new Date().toISOString(),status:'LIBERADO'})
              });
              if (!response.ok) throw new Error('Synthetic insert HTTP '+response.status);
              return (await response.json())[0].id;
            }""", DATE)
            observer.wait_for_function("""() => document.querySelector(
                '#libSetor1Cols .forma-card')?.classList.contains('is-saved')""", timeout=8000)
            latency = round(time.monotonic() - start, 2)
            events = [frame for frame in frames if isinstance(frame, list) and len(frame) == 5
                      and frame[3] == 'postgres_changes' and frame[4].get('data', {}).get('table') == 'producao']
            assert events and events[0][4]['data']['record']['data_fabricacao'] == DATE
            print(json.dumps({"realtime": "equal", "join": "ok", "event": "INSERT",
                              "second_tablet_card": "saved", "latency_seconds": latency,
                              "test_database_only": True}, ensure_ascii=False))
        finally:
            if created_id:
                result = writer.evaluate("""async id => {
                  const response=await fetch('/unificado/mapa/api/rest/v1/producao?id=eq.'+id,
                    {method:'DELETE'});
                  return response.status;
                }""", created_id)
                print(json.dumps({"synthetic_cleanup_http": result}))
            for context in contexts:
                context.close()
            browser.close()


if __name__ == "__main__":
    main()
