"""Before/after captures for the published Mapa desktop shell."""

from __future__ import annotations

import json
from pathlib import Path

from playwright.sync_api import sync_playwright

from operacao_smoke import CHROME, OUT, URL, credentials, login_operacao


BEFORE = Path(__file__).resolve().parents[3] / ".work-mapa-unificado" / "operacao" / "index-before-desktop.html"
CAPTURES = OUT / "desktop-layout"
MODES = (("inicio", "HUB"), ("relatorio", "RELATORIO"), ("historico", "HISTORICO"))


def main() -> None:
    assert BEFORE.exists()
    CAPTURES.mkdir(parents=True, exist_ok=True)
    account = credentials()
    results = []
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True, executable_path=CHROME)
        for width, height in ((1366, 768), (1920, 1080)):
            for variant in ("antes", "depois"):
                context = browser.new_context(viewport={"width": width, "height": height},
                                              service_workers="block")
                page = context.new_page()
                errors = []
                page.on("pageerror", lambda error: errors.append(str(error)))
                login_operacao(page, account["MAPA_TEST_USER"], account["MAPA_TEST_PASSWORD"])
                if variant == "antes":
                    original = BEFORE.read_text(encoding="utf-8")
                    page.route(URL, lambda route: route.fulfill(status=200,
                               content_type="text/html; charset=utf-8", body=original))
                    page.goto(URL, wait_until="domcontentloaded")
                    page.wait_for_function("state.authUser?.role === 'GERENCIA'", timeout=15000)
                for name, mode in MODES:
                    page.evaluate("setMode", mode)
                    page.wait_for_timeout(1300)
                    path = CAPTURES / f"mapa-{name}-{width}x{height}-{variant}.png"
                    page.screenshot(path=str(path), full_page=True)
                    data = page.evaluate("""() => ({
                      mode:state.mode,
                      shell:!!document.querySelector('#unificadoSidebar') &&
                        getComputedStyle(document.querySelector('#unificadoSidebar')).display!=='none',
                      originalSidebar:getComputedStyle(document.querySelector('#appSidebar')).display,
                      originalTopbar:getComputedStyle(document.querySelector('.app-main>.topbar')).display,
                      bodyWidth:document.body.scrollWidth,
                      viewportWidth:innerWidth
                    })""")
                    assert data["mode"] == mode and data["bodyWidth"] <= width + 1, data
                    if variant == "depois":
                        assert data["shell"] and data["originalSidebar"] == "none"
                        assert data["originalTopbar"] == "none"
                    results.append({"viewport": f"{width}x{height}", "variant": variant,
                                    "screen": name, "image": str(path), **data})
                assert not errors, errors[:3]
                context.close()
        browser.close()
    (CAPTURES / "manifest.json").write_text(json.dumps(results, ensure_ascii=False, indent=2),
                                               encoding="utf-8")
    print(json.dumps({"captures": len(results), "desktop_shell": "ok",
                      "screens": [mode[0] for mode in MODES]}, ensure_ascii=False))


if __name__ == "__main__":
    main()
