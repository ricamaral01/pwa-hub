"""Capture Quality pages inside the Unificado shell without logging credentials."""
from __future__ import annotations

import argparse
import json
import subprocess
from pathlib import Path

from playwright.sync_api import sync_playwright

BASE = "https://concrefer.concretrack.com.br"
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
ROUTES = {
    "cadastros": "qualidade/cadastros",
    "painel": "qualidade/",
    "abertura": "qualidade/abrir",
    "tratativa": "qualidade/nc/4b2c6f6f-34a4-4672-a88b-3ae8cddca71d",
}
STAGE = "start"


def account() -> dict[str, str]:
    raw = subprocess.check_output(
        ["ssh", "vps-staging", "cat", "/etc/mapa-unificado/quality-auth-probe.env"],
        text=True, encoding="utf-8",
    )
    return dict(line.split("=", 1) for line in raw.splitlines() if "=" in line)


def capture(browser, creds: dict[str, str], phase: str, device: str, output: Path) -> list[dict]:
    global STAGE
    viewport = {"width": 1440, "height": 900} if device == "desktop" else {"width": 390, "height": 844}
    context = browser.new_context(viewport=viewport, device_scale_factor=1, service_workers="block",
                                  is_mobile=device == "celular", has_touch=device == "celular")
    page = context.new_page()
    STAGE = f"{device}:login"
    page.goto(BASE + "/unificado/login.html", wait_until="domcontentloaded")
    page.locator('#unificado-login-form [name="username"]').fill(creds["MAPA_TEST_USER"])
    page.locator('#unificado-login-form [name="password"]').fill(creds["MAPA_TEST_PASSWORD"])
    page.locator('#unificado-login-form button[type="submit"]').click()
    page.wait_for_url("**/unificado/index.html", timeout=30000)
    result = []
    for name, route in ROUTES.items():
        STAGE = f"{device}:{name}:navigation"
        if name == "cadastros":
            response = page.goto(BASE + "/unificado/?view=qualidade/", wait_until="domcontentloaded", timeout=30000)
        STAGE = f"{device}:{name}:frame"
        frame_element = page.locator("#module-host iframe.is-active")
        frame_element.wait_for(state="visible", timeout=30000)
        frame = frame_element.element_handle().content_frame()
        assert frame is not None
        frame.evaluate("""route => {
          const path = '/unificado/' + route;
          history.pushState({}, '', path);
          dispatchEvent(new PopStateEvent('popstate'));
        }""", route)
        STAGE = f"{device}:{name}:heading"
        frame.locator("h1").first.wait_for(state="visible", timeout=30000)
        page.wait_for_timeout(500)
        shot = output / f"{phase}-{name}-{device}.png"
        page.screenshot(path=str(shot), full_page=True, animations="disabled")
        dimensions = frame.evaluate("() => ({width: document.documentElement.scrollWidth, viewport: innerWidth})")
        short_targets = frame.evaluate("""() => [...document.querySelectorAll('button, select, input[type=file], a.button')]
          .filter(el => el.getBoundingClientRect().width > 0 && el.getBoundingClientRect().height > 0)
          .filter(el => el.getBoundingClientRect().height < 43)
          .map(el => (el.textContent || el.getAttribute('type') || '').trim().slice(0, 30))""")
        result.append({"page": name, "device": device, "status": response.status if response else None,
                       "horizontal_overflow": dimensions["width"] > dimensions["viewport"] + 1,
                       "short_targets": short_targets,
                       "screenshot": str(shot)})
        if phase == "after" and name == "cadastros":
            frame.get_by_role("tab", name="Gravidade").click()
            frame.get_by_role("button", name="Novo item").click()
            frame.get_by_label("Prazo final (dias)").wait_for(state="visible")
        if phase == "after" and name == "abertura":
            frame.get_by_role("button", name="Abertura rápida").click()
            quick = output / f"after-abertura-rapida-{device}.png"
            page.screenshot(path=str(quick), full_page=True, animations="disabled")
            quick_dimensions = frame.evaluate("() => ({width: document.documentElement.scrollWidth, viewport: innerWidth})")
            result.append({"page": "abertura-rapida", "device": device,
                           "horizontal_overflow": quick_dimensions["width"] > quick_dimensions["viewport"] + 1,
                           "screenshot": str(quick)})
    context.close()
    return result


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("phase", choices=("before", "after"))
    args = parser.parse_args()
    output = Path("docs/porting/capturas-qualidade-20261015")
    output.mkdir(parents=True, exist_ok=True)
    creds = account()
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True, executable_path=CHROME)
        try:
            result = []
            for device in ("desktop", "celular"):
                result.extend(capture(browser, creds, args.phase, device, output))
            print(json.dumps(result, ensure_ascii=False))
        finally:
            browser.close()


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"quality_layout_capture failed: stage={STAGE} error={type(error).__name__}")
        raise SystemExit(1) from None
