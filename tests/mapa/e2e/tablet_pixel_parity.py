"""Compare before/after Mapa operation pixels below desktop breakpoint."""

from __future__ import annotations

import json
from pathlib import Path

from PIL import Image, ImageChops
from playwright.sync_api import sync_playwright

from operacao_smoke import CHROME, OUT, URL, credentials, login_operacao


BEFORE = Path(__file__).resolve().parents[3] / ".work-mapa-unificado" / "operacao" / "index-before-desktop.html"
CAPTURES = OUT / "tablet-layout"


def setup(page, kiosk: bool) -> None:
    page.evaluate("""async kiosk => {
      setMode('LIBERACAO_S1');
      el.libData.value='2026-10-02';
      el.libData.dispatchEvent(new Event('change',{bubbles:true}));
      if (kiosk) document.body.classList.add('kiosk-active');
      await new Promise(resolve=>setTimeout(resolve,1800));
    }""", kiosk)


def main() -> None:
    CAPTURES.mkdir(parents=True, exist_ok=True)
    source = BEFORE.read_text(encoding="utf-8")
    account = credentials()
    results = []
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True, executable_path=CHROME)
        for width, height, kiosk in ((1024, 768, False), (768, 1024, False), (1024, 768, True)):
            context = browser.new_context(viewport={"width": width, "height": height},
                                          service_workers="block")
            paths = []
            for variant in ("antes", "depois"):
                page = context.new_page()
                if variant == "antes":
                    login_operacao(page, account["MAPA_TEST_USER"], account["MAPA_TEST_PASSWORD"])
                    page.route(URL, lambda route: route.fulfill(status=200,
                               content_type="text/html; charset=utf-8", body=source))
                    page.goto(URL, wait_until="domcontentloaded")
                else:
                    page.goto(URL, wait_until="domcontentloaded")
                page.wait_for_function("state.authUser?.role === 'GERENCIA'", timeout=15000)
                setup(page, kiosk)
                assert not page.locator("#unificadoSidebar").is_visible() if variant == "depois" else True
                label = f"{width}x{height}" + ("-quiosque" if kiosk else "")
                path = CAPTURES / f"mapa-{label}-{variant}.png"
                page.screenshot(path=str(path), full_page=True, animations="disabled")
                paths.append(path)
                page.close()
            with Image.open(paths[0]) as left, Image.open(paths[1]) as right:
                assert left.size == right.size, (left.size, right.size)
                diff = ImageChops.difference(left.convert("RGB"), right.convert("RGB"))
                changed = sum(1 for pixel in diff.getdata() if pixel != (0, 0, 0))
                total = left.width * left.height
                ratio = changed / total
            results.append({"viewport": label, "changed_pixels": changed,
                            "total_pixels": total, "ratio": ratio})
            context.close()
        browser.close()
    (CAPTURES / "manifest.json").write_text(json.dumps(results, indent=2), encoding="utf-8")
    print(json.dumps(results))


if __name__ == "__main__":
    main()
