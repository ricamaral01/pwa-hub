"""Confere a prévia publicada em um navegador com dimensões de tablet.

As respostas de leitura são simuladas para testar somente interface e bloqueio
de cliques. Não cria contas nem altera dados no servidor.
"""

from pathlib import Path
from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[1]
URL = "https://concrefer.concretrack.com.br/unificado/mapa/consulta/?tela=LIBERACAO_S3"
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"


def main() -> None:
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True, executable_path=CHROME)
        for width, height, label in ((1024, 768, "horizontal"), (768, 1024, "vertical")):
            context = browser.new_context(viewport={"width": width, "height": height}, device_scale_factor=1)
            page = context.new_page()
            writes = []

            def route(request_route):
                req = request_route.request
                if req.method not in {"GET", "HEAD"}:
                    writes.append((req.method, req.url))
                if req.url.endswith("/api/me"):
                    request_route.fulfill(status=200, content_type="application/json", body='{"ok":true,"user":{"id":"preview","name":"Prévia","role":"GERENCIA","setor":"Todos"}}')
                elif "/api/" in req.url:
                    request_route.fulfill(status=200, content_type="application/json", body="[]")
                else:
                    request_route.continue_()

            page.route("**/*", route)
            page.goto(URL, wait_until="domcontentloaded", timeout=30000)
            page.locator("#consulta-banner").wait_for(state="visible", timeout=15000)
            page.locator(".forma-card").first.wait_for(state="visible", timeout=20000)
            count = page.locator(".forma-card").count()
            assert page.locator("#kioskLibData").input_value() == "2026-10-02"
            page.locator(".forma-card").first.click()
            assert "apenas consulta" in page.locator("#consulta-banner").inner_text().lower()
            assert writes == [], writes
            screenshot = ROOT / ".work-mapa-unificado" / f"preview-tablet-{label}.png"
            page.screenshot(path=str(screenshot), full_page=True)
            print(f"TABLET_{label.upper()}_OK formas={count} writes=0 screenshot={screenshot}")
            context.close()
        context = browser.new_context(viewport={"width": 768, "height": 1024})
        page = context.new_page()
        signed_in = [False]

        def login_route(request_route):
            req = request_route.request
            if req.url.endswith("/api/me"):
                request_route.fulfill(status=200 if signed_in[0] else 401, content_type="application/json",
                                      body='{"ok":true,"user":{"id":"preview","name":"Prévia","role":"GERENCIA","setor":"Todos"}}' if signed_in[0] else '{"ok":false}')
            elif req.url.endswith("/api/login"):
                signed_in[0] = True
                request_route.fulfill(status=200, content_type="application/json",
                                      body='{"ok":true,"user":{"primeiro_acesso":false}}')
            elif "/api/" in req.url:
                request_route.fulfill(status=200, content_type="application/json", body="[]")
            else:
                request_route.continue_()

        page.route("**/*", login_route)
        page.goto(URL, wait_until="domcontentloaded", timeout=30000)
        page.wait_for_url("**/unificado/login.html?next=mapa/consulta/", timeout=15000)
        page.locator('input[name="username"]').fill("preview")
        page.locator('input[name="password"]').fill("only-for-browser-test")
        page.locator('#unificado-login-form button[type="submit"]').click()
        page.wait_for_url("**/unificado/mapa/consulta/", timeout=15000)
        page.locator("#consulta-banner").wait_for(state="visible", timeout=20000)
        page.locator("#viewHub").wait_for(state="visible", timeout=20000)
        print("TABLET_LOGIN_RETURN_OK")
        context.close()
        browser.close()


if __name__ == "__main__":
    main()
