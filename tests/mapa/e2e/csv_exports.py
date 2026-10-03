"""Download both Mapa CSV exports from the published test operation."""

from __future__ import annotations

from pathlib import Path
import tempfile

from playwright.sync_api import sync_playwright

from operacao_smoke import CHROME, credentials, login_operacao


def main() -> None:
    account = credentials()
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True, executable_path=CHROME)
        context = browser.new_context(viewport={"width": 1366, "height": 768},
                                      accept_downloads=True, service_workers="block")
        page = context.new_page()
        login_operacao(page, account["MAPA_TEST_USER"], account["MAPA_TEST_PASSWORD"])
        page.evaluate("""async () => {
          setMode('PROD_ANALISE');
          document.getElementById('paDataInicio').value='2026-10-02';
          document.getElementById('paDataFim').value='2026-10-03';
          await carregarProdutividadeConcretagem();
        }""")
        counts = page.evaluate("""() => ({
          rows:state.paLastRows?.length ?? -1,
          pauses:state.paLastMetricas?.paradasList?.length ?? -1
        })""")
        assert counts["rows"] >= 0 and counts["pauses"] >= 0, counts
        with tempfile.TemporaryDirectory() as directory:
            for button_id, prefix, header, expected_rows in (
                ("paBtnExportarDadosCSV", "dados_concretagem_",
                 "Forma;Setor;Tipo de Concreto;Data;Horario;Operador", counts["rows"]),
                ("paBtnExportarCSV", "paradas_concretagem_",
                 "Data;Horario Inicio;Horario Fim;Duracao (min);Setor;Produto;Classificacao",
                 counts["pauses"]),
            ):
                if button_id == "paBtnExportarCSV":
                    page.locator("#paBtnToggleFiltros").click()
                with page.expect_download() as event:
                    page.locator("#" + button_id).click()
                download = event.value
                assert download.suggested_filename.startswith(prefix)
                target = Path(directory) / download.suggested_filename
                download.save_as(target)
                content = target.read_text(encoding="utf-8-sig")
                lines = content.splitlines()
                assert lines[0] == header
                assert len(lines) - 1 == expected_rows, (button_id, len(lines), expected_rows)
                print(f"csv={prefix} rows={expected_rows} header=ok download=ok")
        context.close()
        browser.close()


if __name__ == "__main__":
    main()
