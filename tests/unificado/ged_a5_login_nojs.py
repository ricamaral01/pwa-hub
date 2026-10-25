"""Verify GED login never serializes password in URL without hydration/JS."""
from __future__ import annotations

import json
from playwright.sync_api import sync_playwright

URL = "https://concrefer.concretrack.com.br/unificado/ged/login"
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"


def main():
    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True, executable_path=CHROME)
        context = browser.new_context(java_script_enabled=False, service_workers="block")
        page = context.new_page()
        response = page.goto(URL, wait_until="domcontentloaded")
        assert response.status == 200
        assert page.locator("form").get_attribute("method").lower() == "post"
        page.locator('input[type="email"]').fill("dummy@local.invalid")
        page.locator('input[type="password"]').fill("DUMMY_NOT_A_PASSWORD")
        with page.expect_request(lambda request: request.is_navigation_request() and request.method == "POST") as sent:
            page.locator('button[type="submit"]').click()
        request = sent.value
        assert "password" not in request.url.lower() and "DUMMY_NOT_A_PASSWORD" not in request.url
        print(json.dumps({"nojs_login": "PASS", "request_method": request.method,
                          "url_contains_credentials": False}))
        context.close()
        browser.close()


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"No-JS login check failed: {type(error).__name__}")
        raise SystemExit(1) from None
