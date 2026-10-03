"""Capture the published operation at tablet, kiosk and desktop dimensions."""

from __future__ import annotations

import json

from playwright.sync_api import sync_playwright

from operacao_smoke import CHROME, OUT, URL, credentials


SIZES = ((1024, 768, False), (768, 1024, False), (1024, 768, True),
         (1366, 768, False), (1920, 1080, False))


def main() -> None:
    account = credentials()
    OUT.mkdir(parents=True, exist_ok=True)
    results = []
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True, executable_path=CHROME)
        for width, height, kiosk in SIZES:
            context = browser.new_context(viewport={"width": width, "height": height},
                                          service_workers="block")
            page = context.new_page()
            page.goto(URL, wait_until="domcontentloaded", timeout=30000)
            page.wait_for_function("typeof loginWithRole === 'function'", timeout=15000)
            page.wait_for_timeout(800)
            page.locator("#loginNome").fill(account["MAPA_TEST_USER"])
            page.locator("#loginSenha").fill(account["MAPA_TEST_PASSWORD"])
            page.locator("#loginEntrar").click()
            page.wait_for_function("state.authUser?.role === 'GERENCIA'", timeout=15000)
            page.evaluate("""({kiosk,desktop}) => {
                setMode(desktop ? 'PROD_ANALISE' : 'LIBERACAO_S1'); el.libData.value='2026-10-02';
                if (kiosk) document.body.classList.add('kiosk-active');
                if (!desktop) renderLiberacaoDual();
            }""", {"kiosk": kiosk, "desktop": width >= 1025})
            page.wait_for_timeout(1200)
            label = f"{width}x{height}" + ("-quiosque" if kiosk else "")
            page.screenshot(path=str(OUT / f"viewport-{label}.png"), full_page=True)
            result = page.evaluate("""() => ({
                mode:state.mode,
                cards:document.querySelectorAll('#libSetor1Cols .forma-card').length,
                banner:document.querySelector('#ambiente-teste')?.getBoundingClientRect().height,
                bodyWidth:document.body.scrollWidth,
                windowWidth:window.innerWidth,
                menuVisible:[...document.querySelectorAll('.sidebar')].some(e=>getComputedStyle(e).display!=='none')
            })""")
            results.append({"viewport": label, **result})
            context.close()
        browser.close()
    (OUT / "viewports.json").write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(results, ensure_ascii=False))


if __name__ == "__main__":
    main()
