"""Desktop and phone captures of the test-only FL-SGQ-07 opening/treatment UI."""
from __future__ import annotations

from pathlib import Path

from playwright.sync_api import sync_playwright

from homolog_session import test_cookie_for


BASE = "https://concrefer.concretrack.com.br:18446"
RNC_ID = "910922c7-68c4-4f28-87e7-3ba419b9f79c"
OUT = Path("docs/qualidade/capturas-fl-sgq-07-20261016")
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"


def fill_opening(page):
    page.get_by_label("Título", exact=True).fill("Pedra britada 1/2 contaminada - EMBU")
    page.locator("label:has-text('Origem') select").first.select_option(label="Fornecedor")
    page.get_by_label("Descrever o problema").fill(
        "Pedra britada de 1/2 contaminada com pedaços de madeira.")
    page.locator("label:has-text('Área emitente') select").select_option(label="SGQ")
    page.locator("label:has-text('Local') select").first.select_option(label="Recebimento")
    page.locator("label:has-text('Atividade') select").first.select_option(label="Inspeção de recebimento")
    page.get_by_label("Processo emitente").fill("Recebimento")
    page.get_by_label("Nome do emitente").fill("Alex")
    page.get_by_label("Data da emissão").fill("2023-07-13")
    page.get_by_label("Identificação").fill("EMBU")
    page.get_by_label("Evidência objetiva").fill(
        "Material recebido com as NFe: 180866 de 05/Jul; 180780 de 05/Jul; "
        "180978 de 06/Jul e 181082 de 06/Jul.")


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    token = test_cookie_for("user-ricardo")
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True, executable_path=CHROME)
        for name, viewport, phone in (
            ("desktop", {"width": 1440, "height": 900}, False),
            ("celular", {"width": 390, "height": 844}, True),
        ):
            context = browser.new_context(viewport=viewport, is_mobile=phone,
                                          has_touch=phone, device_scale_factor=1,
                                          service_workers="block")
            context.add_cookies([{
                "name": "unificado_homolog_qualidade_session", "value": token,
                "domain": "concrefer.concretrack.com.br", "path": "/unificado/qualidade/",
                "secure": True, "httpOnly": True, "sameSite": "Lax",
            }])
            page = context.new_page()
            response = page.goto(BASE + "/unificado/qualidade/abrir", wait_until="domcontentloaded")
            print(name, "opening status", response.status if response else None,
                  "url", page.url, "body", page.locator("body").inner_text()[:180])
            page.get_by_role("heading", name="Nova RNC").wait_for(timeout=15000)
            print(name, "labels", page.locator("label").all_inner_texts()[:18])
            fill_opening(page)
            page.screenshot(path=str(OUT / f"{name}-abertura.png"), full_page=True)
            page.goto(BASE + f"/unificado/qualidade/nc/{RNC_ID}", wait_until="domcontentloaded")
            page.get_by_role("heading", name="FL-SGQ-07 · dados do formulário").wait_for(timeout=15000)
            page.screenshot(path=str(OUT / f"{name}-tratativa.png"), full_page=True)
            width = page.evaluate("document.documentElement.scrollWidth")
            assert width <= viewport["width"], (name, width, viewport["width"])
            print(name, "opening and treatment captured; width", width)
            context.close()
        browser.close()


if __name__ == "__main__":
    main()
