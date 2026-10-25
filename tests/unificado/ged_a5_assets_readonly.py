"""Read-only browser probe for GED Next hydration; never submits credentials."""
from __future__ import annotations

import json
from urllib.parse import urlsplit
from playwright.sync_api import sync_playwright

BASE = "https://concrefer.concretrack.com.br/unificado/ged"
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"


def main():
    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True, executable_path=CHROME)
        context = browser.new_context(service_workers="block")
        page = context.new_page()
        failures = []
        errors = []
        assets = []
        page.on("requestfailed", lambda request: failures.append({"path": urlsplit(request.url).path, "error_type": type(request.failure).__name__}))
        page.on("pageerror", lambda error: errors.append(str(error)[:300]))
        page.on("response", lambda response: assets.append({"path": urlsplit(response.url).path, "status": response.status})
                if "/_next/" in response.url and response.status >= 400 else None)
        response = page.goto(BASE + "/login", wait_until="networkidle", timeout=30000)
        scripts = page.locator("script[src]").evaluate_all("els => els.map(x => new URL(x.src).pathname).slice(0, 12)")
        print(json.dumps({"document_status": response.status, "scripts": scripts,
                          "asset_http_errors": assets, "request_failures": failures,
                          "page_errors": errors}, ensure_ascii=False))
        context.close()
        browser.close()


if __name__ == "__main__":
    main()
