"""Viewport image parity for all 18 Mapa modes before/after the desktop shell."""

from __future__ import annotations

import io
import json
import argparse
from pathlib import Path

from PIL import Image, ImageChops
from playwright.sync_api import sync_playwright

from operacao_smoke import CHROME, OUT, URL, credentials, login_operacao


ROOT = Path(__file__).resolve().parents[3]
BEFORE = ROOT / ".work-mapa-unificado" / "operacao" / "index-before-desktop.html"
FIXTURE = ROOT / "tests" / "mapa" / "fixtures" / "role-sector-navigation.json"
DEST = OUT / "tablet-matrix"


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument('--limit', type=int, default=0)
    parser.add_argument('--mode', default='')
    args = parser.parse_args()
    source = BEFORE.read_text(encoding="utf-8")
    modes = list(dict.fromkeys(item["mode"] for item in
                               json.loads(FIXTURE.read_text(encoding="utf-8"))["cases"]))
    if args.limit:
        modes = modes[:args.limit]
    if args.mode:
        modes = [mode for mode in modes if mode == args.mode]
        if not modes:
            raise ValueError('Unknown mode')
    account = credentials()
    DEST.mkdir(parents=True, exist_ok=True)
    rows = []
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True, executable_path=CHROME)
        for width, height, kiosk in ((1024, 768, False), (768, 1024, False), (1024, 768, True)):
            context = browser.new_context(viewport={"width": width, "height": height},
                                          service_workers="block")
            pages = {}
            for variant in ("antes", "depois"):
                page = context.new_page()
                if variant == "antes":
                    login_operacao(page, account["MAPA_TEST_USER"], account["MAPA_TEST_PASSWORD"])
                else:
                    page.goto(URL, wait_until="domcontentloaded")
                if variant == "antes":
                    page.route(URL, lambda route: route.fulfill(status=200,
                        content_type="text/html; charset=utf-8", body=source))
                    page.goto(URL, wait_until="domcontentloaded")
                page.wait_for_function("state.authUser?.role === 'GERENCIA'", timeout=15000)
                pages[variant] = page
            for mode in modes:
                for page in pages.values():
                    page.evaluate("setMode('HUB')")
                    page.wait_for_timeout(250)
                    page.evaluate("""({mode,kiosk}) => {
                      setMode(mode);
                      if (el.libData) {
                        el.libData.value='2026-10-02';
                        el.libData.dispatchEvent(new Event('change',{bubbles:true}));
                      }
                      if (kiosk) document.body.classList.add('kiosk-active');
                    }""", {"mode": mode, "kiosk": kiosk})
                pages["antes"].wait_for_timeout(1800)
                pages["depois"].wait_for_timeout(1800)
                pages["antes"].evaluate("document.fonts.ready")
                pages["depois"].evaluate("document.fonts.ready")
                before = pages["antes"].screenshot(animations="disabled")
                after = pages["depois"].screenshot(animations="disabled")
                left = Image.open(io.BytesIO(before)).convert("RGB")
                right = Image.open(io.BytesIO(after)).convert("RGB")
                if left.size != right.size:
                    changed = None
                else:
                    changed = sum(pixel != (0, 0, 0) for pixel in
                                  ImageChops.difference(left, right).getdata())
                row = {"viewport": f"{width}x{height}" + ("-quiosque" if kiosk else ""),
                       "mode": mode, "changed_pixels": changed,
                       "total_pixels": width * height}
                rows.append(row)
                if changed:
                    label = row["viewport"] + "-" + mode.lower()
                    (DEST / (label + "-antes.png")).write_bytes(before)
                    (DEST / (label + "-depois.png")).write_bytes(after)
            context.close()
        browser.close()
    (DEST / "manifest.json").write_text(json.dumps(rows, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({"cases": len(rows), "equal": sum(row["changed_pixels"] == 0 for row in rows),
                      "different": [row for row in rows if row["changed_pixels"] != 0]}, ensure_ascii=False))


if __name__ == "__main__":
    main()
