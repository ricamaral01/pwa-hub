"""Compare the existing PCP standalone page before/after shell at mobile width."""

from __future__ import annotations

import io
from pathlib import Path
import subprocess

from PIL import Image, ImageChops
from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[2]
URL = "https://concrefer.concretrack.com.br/unificado/pcp/formas-por-setor/"
LOGIN = "https://concrefer.concretrack.com.br/unificado/login.html?next=pcp/dashboard/"
ORIGINAL = (ROOT / "unificado/pcp/formas-por-setor/index.html").read_text(encoding="utf-8")
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"


def main() -> None:
    raw = subprocess.check_output(
        ["ssh", "vps-staging", "cat", "/etc/mapa-unificado/pcp-auth-probe.env"], text=True)
    account = dict(line.split("=", 1) for line in raw.splitlines() if "=" in line)
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True, executable_path=CHROME)
        context = browser.new_context(viewport={"width": 390, "height": 844}, service_workers="block")
        entry = context.new_page()
        entry.goto(LOGIN)
        entry.locator('#unificado-login-form [name="username"]').fill(account["PCP_TEST_USER"])
        entry.locator('#unificado-login-form [name="password"]').fill(account["PCP_TEST_PASSWORD"])
        entry.locator('#unificado-login-form button[type="submit"]').click()
        entry.wait_for_url("**/unificado/pcp/dashboard/")
        entry.close()
        before = context.new_page()
        before.route(URL, lambda route: route.fulfill(
            status=200, content_type="text/html; charset=utf-8", body=ORIGINAL))
        after = context.new_page()
        before.goto(URL, wait_until="networkidle")
        after.goto(URL, wait_until="networkidle")
        before.evaluate("document.fonts.ready")
        after.evaluate("document.fonts.ready")
        out = ROOT / ".work-mapa-unificado/pcp-e2e"
        out.mkdir(parents=True, exist_ok=True)
        left = Image.open(io.BytesIO(before.screenshot(animations="disabled"))).convert("RGB")
        right = Image.open(io.BytesIO(after.screenshot(animations="disabled"))).convert("RGB")
        left.save(out / "formas-mobile-before.png")
        right.save(out / "formas-mobile-after.png")
        assert left.size == right.size
        changed = sum(pixel != (0, 0, 0) for pixel in ImageChops.difference(left, right).getdata())
        print(f"pcp_formas_mobile_changed_pixels={changed} viewport=390x844")
        browser.close()
        assert changed == 0


if __name__ == "__main__":
    main()
