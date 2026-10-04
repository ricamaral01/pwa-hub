"""Compare original PCP page HTML with published pages at mobile width."""
from __future__ import annotations

import argparse
import io
import json
from pathlib import Path
import re
import subprocess

from PIL import Image, ImageChops
from playwright.sync_api import sync_playwright

from pages_smoke import PAGES

ROOT = Path(__file__).resolve().parents[2]
BASE = "https://concrefer.concretrack.com.br"
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
OUT = ROOT / ".work-mapa-unificado/pcp-e2e/mobile-parity"


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--only", choices=PAGES)
    parser.add_argument("--width", type=int, default=390)
    parser.add_argument("--height", type=int, default=844)
    args = parser.parse_args()
    assert 320 <= args.width <= 1024 and 500 <= args.height <= 1200
    raw = subprocess.check_output(
        ["ssh", "vps-staging", "cat", "/etc/mapa-unificado/pcp-auth-probe.env"],
        text=True, encoding="utf-8")
    account = dict(line.split("=", 1) for line in raw.splitlines() if "=" in line)
    OUT.mkdir(parents=True, exist_ok=True)
    results = []
    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True, executable_path=CHROME)
        context = browser.new_context(viewport={"width": args.width, "height": args.height},
                                      service_workers="block")
        entry = context.new_page()
        entry.goto(BASE + "/unificado/login.html?next=pcp/dashboard/")
        entry.locator('#unificado-login-form [name="username"]').fill(account["PCP_TEST_USER"])
        entry.locator('#unificado-login-form [name="password"]').fill(account["PCP_TEST_PASSWORD"])
        entry.locator('#unificado-login-form button[type="submit"]').click()
        entry.wait_for_url("**/unificado/pcp/dashboard/", timeout=20000)
        entry.close()
        for name in (PAGES if args.only is None else (args.only,)):
            url = BASE + f"/unificado/pcp/{name}/"
            original = (ROOT / "unificado/pcp" / name / "index.html").read_text(encoding="utf-8")
            if name != "formas-por-setor":
                original = original.replace(
                    "</head>", '<link rel="stylesheet" href="/unificado/pcp/static/css/inter-original.css"></head>')
            before = context.new_page()
            before.route(url, lambda route, _request, html=original: route.fulfill(
                status=200, content_type="text/html; charset=utf-8", body=html))
            before.route(re.compile(r"^https://concrefer\.concretrack\.com\.br/api/"),
                         lambda route: route.continue_(url=route.request.url.replace(
                             BASE + "/api/", BASE + "/unificado/pcp/api/", 1)))
            after = context.new_page()
            try:
                before.goto(url, wait_until="networkidle", timeout=30000)
                after.goto(url, wait_until="networkidle", timeout=30000)
                before.evaluate("document.fonts.ready")
                after.evaluate("document.fonts.ready")
                left = Image.open(io.BytesIO(before.screenshot(animations="disabled"))).convert("RGB")
                right = Image.open(io.BytesIO(after.screenshot(animations="disabled"))).convert("RGB")
                assert left.size == right.size
                changed = sum(pixel != (0, 0, 0)
                              for pixel in ImageChops.difference(left, right).getdata())
                if changed:
                    left.save(OUT / f"{name}-{args.width}x{args.height}-before.png")
                    right.save(OUT / f"{name}-{args.width}x{args.height}-after.png")
                results.append({"page": name, "changed_pixels": changed,
                                "before_path": before.url.split(BASE)[-1],
                                "after_path": after.url.split(BASE)[-1]})
            finally:
                before.close()
                after.close()
        browser.close()
    (OUT / f"results-{args.width}x{args.height}.json").write_text(
        json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({"viewport": f"{args.width}x{args.height}",
                      "pages": len(results), "pixel_equal": sum(item["changed_pixels"] == 0
                       for item in results), "different": [item for item in results
                       if item["changed_pixels"]]}, ensure_ascii=False))


if __name__ == "__main__":
    main()
