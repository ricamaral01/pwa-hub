"""Visual gate for the local GED Documents prototype; no production requests."""
from __future__ import annotations

import json
from pathlib import Path

from playwright.sync_api import sync_playwright


BASE = "http://127.0.0.1:8765/"
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
OUT = Path("docs/ged-nativo/capturas")


def capture(mobile: bool) -> dict:
    device = "celular" if mobile else "desktop"
    viewport = {"width": 390, "height": 844} if mobile else {"width": 1440, "height": 900}
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True, executable_path=CHROME)
        context = browser.new_context(viewport=viewport, is_mobile=mobile, has_touch=mobile)
        page = context.new_page()
        calls = []
        page.on("request", lambda request: calls.append(request.url))
        response = page.goto(BASE, wait_until="networkidle")
        assert response and response.status == 200
        assert page.get_by_role("heading", name="Documentos").is_visible()
        assert page.locator("#document-rows tr").count() == 3
        assert not page.evaluate("document.documentElement.scrollWidth > innerWidth + 1")
        list_capture = OUT / f"documentos-lista-{device}.png"
        page.screenshot(path=str(list_capture), full_page=True, animations="disabled")
        page.get_by_role("button", name="Abrir IT-CQC-03").click()
        assert page.get_by_role("heading", name="Moldagem e rompimento de corpos de prova").is_visible()
        assert page.locator(".version").count() == 2
        assert page.get_by_role("heading", name="Ciência").is_visible()
        assert page.get_by_role("heading", name="Leituras").is_visible()
        assert page.get_by_role("button", name="Confirmar ciência").is_disabled()
        assert not page.evaluate("document.documentElement.scrollWidth > innerWidth + 1")
        detail_capture = OUT / f"documentos-detalhe-{device}.png"
        page.screenshot(path=str(detail_capture), full_page=True, animations="disabled")
        page.locator("#back").click()
        page.get_by_role("button", name="Abrir FL-SGQ-01").click()
        assert page.locator(".science-state.done").count() == 1
        assert page.locator(".read-row").count() == 1
        readings_capture = OUT / f"documentos-ciencia-leituras-{device}.png"
        page.screenshot(path=str(readings_capture), full_page=True, animations="disabled")
        assert all(url.startswith(BASE) for url in calls), calls
        context.close()
        browser.close()
        return {"device": device, "list": str(list_capture), "detail": str(detail_capture),
                "readings": str(readings_capture), "versions": 2, "science": "shown",
                "reads": "shown", "production_requests": 0}


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    print(json.dumps([capture(False), capture(True)], ensure_ascii=False))
