"""Captura o PWA já carregado; em 'antes', injeta somente o CSS anterior."""
from __future__ import annotations

import argparse
import json
import subprocess
from pathlib import Path

from playwright.sync_api import sync_playwright

from check_layout_shell import ROOT, AUDIT_JS, context_for


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("phase", choices=("antes", "depois"))
    args = parser.parse_args()
    root = Path("docs/porting/suprimentos/capturas/layout-fix") / args.phase
    root.mkdir(parents=True, exist_ok=True)
    passwords = json.loads(Path("C:/Users/Admin/Downloads/suprimentos-homolog-logins-20261025.json").read_text(encoding="utf-8"))
    token = ""  # O PWA é exercitado só com o solicitante sintético.
    original_css = None
    if args.phase == "antes":
        original_css = subprocess.check_output(
            ["git", "show", "HEAD:unificado/suprimentos/pwa/app.css"]
        ).decode("utf-8")

    results = []
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        for width, height in ((390, 844), (360, 780)):
            for zoom in (100, 125):
                context = context_for(browser, "e2e-suprimentos-sol", width, height, zoom, passwords, token)
                if original_css is not None:
                    context.route("**/unificado/suprimentos/pwa/app.css*", lambda route: route.fulfill(
                        status=200, content_type="text/css; charset=utf-8", body=original_css
                    ))
                page = context.new_page()
                errors = []
                missing = []
                page.on("console", lambda msg: errors.append(msg.text) if msg.type == "error" else None)
                page.on("pageerror", lambda err: errors.append(str(err)))
                page.on("response", lambda response: missing.append(response.url) if response.status == 404 else None)
                page.goto(ROOT + "/unificado/suprimentos/pwa/", wait_until="domcontentloaded", timeout=20000)
                page.locator(".app-nav").wait_for(timeout=15000)
                stem = f"pwa-{width}x{height}-z{zoom}"
                page.screenshot(path=str(root / (stem + ".png")), full_page=False)
                results.append({"size": f"{width}x{height}", "zoom": zoom,
                                "css": "HEAD anterior" if original_css is not None else "homologacao 1.0.60",
                                "audit": page.evaluate(AUDIT_JS), "errors": errors,
                                "missing": missing, "screenshot": stem + ".png"})
                context.close()
        browser.close()
    (root / "diagnostico-pwa-loaded.json").write_text(
        json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    assert len(results) == 4
    assert all(not row["audit"]["horizontal"] and not row["errors"] and not row["missing"] for row in results)
    print(f"PWA_LOADED_OK {args.phase} 4/4")


if __name__ == "__main__":
    main()
