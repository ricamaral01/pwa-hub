"""Captura e verifica o protótipo visual isolado da etapa 1."""
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[2]
PAGE = ROOT / "unificado/m/maodeobra/prototipo/index.html"
OUT = ROOT / "docs/maodeobra-mobile/capturas-etapa1"
LIVE = sys.argv[1] if len(sys.argv) > 1 else None
if LIVE:
    OUT = ROOT / "docs/maodeobra-mobile/capturas-etapa1-teste"
SCREENS = ["install", "launch", "review", "sent", "error", "no-production", "history"]


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    errors = []
    api_requests = []
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        for width in (360, 390, 430):
            context = browser.new_context(viewport={"width": width, "height": 844}, device_scale_factor=1, ignore_https_errors=True)
            page = context.new_page()
            page.on("pageerror", lambda error: errors.append(str(error)))
            page.on("request", lambda request: api_requests.append(request.url) if "/api/" in request.url else None)
            for number, screen in enumerate(SCREENS):
                page.goto((LIVE or PAGE.as_uri()) + f"?screen={screen}")
                page.locator(".screen").wait_for()
                page.screenshot(path=str(OUT / f"{number:02d}-{screen}-{width}.png"))
                assert page.evaluate("document.documentElement.scrollWidth <= innerWidth"), (screen, width, "horizontal overflow")
                assert page.locator(".prototype-note").count() == 1
            page.goto((LIVE or PAGE.as_uri()) + "?screen=launch")
            assert page.locator(".activity-card").count() == 7
            assert "20,5" in page.locator(".total-row").inner_text()
            page.get_by_role("button", name="S3 / S4").click()
            assert page.locator(".activity-card").count() == 9
            assert page.get_by_text("Fab Armação setor 3").count() == 1
            page.get_by_role("button", name="Conferir e enviar").click()
            assert page.get_by_role("dialog", name="Conferir lançamento").count() == 1
            page.get_by_role("button", name="Voltar e corrigir").click()
            assert page.locator(".activity-card").count() == 9
            context.close()
        browser.close()
    assert not errors, errors
    assert not api_requests, api_requests
    print(f"Etapa 1: 7 telas x 3 larguras = 21 capturas; sem overflow, erro JS ou chamadas à API; navegação, grupos e totais OK. Saída: {OUT}")


if __name__ == "__main__":
    main()
