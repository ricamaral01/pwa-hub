"""A second signed-in tablet sees a production write through bridge polling."""

from __future__ import annotations

from playwright.sync_api import sync_playwright

from operacao_smoke import CHROME, credentials, login_operacao


def main() -> None:
    account = credentials()
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True, executable_path=CHROME)
        contexts = [browser.new_context(viewport={"width": 1024, "height": 768},
                                        service_workers="block") for _ in range(2)]
        observer, writer = (context.new_page() for context in contexts)
        for page in (observer, writer):
            login_operacao(page, account["MAPA_TEST_USER"], account["MAPA_TEST_PASSWORD"])
            page.evaluate("""async () => {
                setMode('LIBERACAO_S1'); el.libData.value='2026-10-03';
                el.libData.dispatchEvent(new Event('change', {bubbles:true}));
                await new Promise(resolve=>setTimeout(resolve,1500));
            }""")
        observer.wait_for_selector("#libSetor1Cols .forma-card", timeout=15000)
        first = observer.locator("#libSetor1Cols .forma-card").first
        before = first.get_attribute("class")
        assert before and "is-saved" not in before
        observer.wait_for_timeout(13500)  # Establish the first poll baseline.
        writer.evaluate("""async () => {
            const response = await fetch('/unificado/mapa/api/rest/v1/producao', {
              method:'POST', headers:{'Content-Type':'application/json','Prefer':'return=representation'},
              body:JSON.stringify({data_fabricacao:'2026-10-03',setor:'Setor 1',forma:'IE-01',
                modelo:'9x200',descricao_poste:'9x200',codigo_produto:'678',
                tipo_concreto:'Concreto Seco - Vibrado',colaborador:'Captura',
                data_hora:new Date().toISOString(),status:'LIBERADO'})
            });
            if (!response.ok) throw new Error('Fixture insert failed: '+response.status);
        }""")
        observer.wait_for_function("""() => document.querySelector(
            '#libSetor1Cols .forma-card')?.classList.contains('is-saved')""", timeout=40000)
        after = first.get_attribute("class")
        assert after and "is-saved" in after
        print("realtime_second_tablet_before=idle after=saved polling=ok")
        for context in contexts:
            context.close()
        browser.close()


if __name__ == "__main__":
    main()
