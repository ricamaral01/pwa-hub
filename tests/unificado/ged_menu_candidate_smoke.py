"""Preflight candidate shell scripts against the live read-only GED destination."""
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path
from urllib.parse import urlsplit

from playwright.sync_api import sync_playwright

BASE = "https://concrefer.concretrack.com.br"
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
STAGE = "start"
ROOT = Path(__file__).resolve().parents[2]
SCRIPTS = {
    "router.js": ROOT / "unificado/shell/router.js",
    "shell.js": ROOT / "unificado/shell/shell.js",
    "menu.config.js": ROOT / "unificado/shell/menu.config.js",
}
STYLES = {
    "shell.css": ROOT / "unificado/shell/shell.css",
    "shared-menu.css": ROOT / "unificado/shell/shared-menu.css",
}


def main() -> None:
    global STAGE
    mobile = "--mobile" in sys.argv
    published = "--published" in sys.argv
    raw = subprocess.check_output(["ssh", "vps-staging", "cat",
                                   "/etc/mapa-unificado/quality-auth-probe.env"],
                                  text=True, encoding="utf-8")
    creds = dict(line.split("=", 1) for line in raw.splitlines() if "=" in line)
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True, executable_path=CHROME)
        context = browser.new_context(service_workers="block", viewport={"width":390,"height":844} if mobile else {"width":1440,"height":900},
                                      is_mobile=mobile, has_touch=mobile)
        page = context.new_page()
        STAGE = "login"
        page.goto(BASE + "/unificado/login.html", wait_until="domcontentloaded")
        page.locator('#unificado-login-form [name="username"]').fill(creds["MAPA_TEST_USER"])
        page.locator('#unificado-login-form [name="password"]').fill(creds["MAPA_TEST_PASSWORD"])
        page.locator('#unificado-login-form button[type="submit"]').click()
        page.wait_for_url("**/unificado/index.html", timeout=30000)
        if not published:
            for name, path in SCRIPTS.items():
                source = path.read_text(encoding="utf-8")
                page.route("**/unificado/shell/" + name + "*",
                           lambda route, request, source=source: route.fulfill(
                               status=200, content_type="text/javascript", body=source))
            for name, path in STYLES.items():
                source = path.read_text(encoding="utf-8")
                page.route("**/unificado/shell/" + name + "*",
                           lambda route, request, source=source: route.fulfill(
                               status=200, content_type="text/css", body=source))
        STAGE = "candidate-shell"
        page.goto(BASE + "/unificado/", wait_until="domcontentloaded")
        link = page.get_by_role("link", name="GED — Documentos e calibrações").first
        link.wait_for(state="visible", timeout=30000)
        assert urlsplit(link.get_attribute("href") or "").path == "/unificado/ged/"
        assert page.locator(".ged-preview-group .group-title").first.inner_text() == "GED"
        assert page.locator(".ged-preview-group .group-title").first.evaluate(
            "node => getComputedStyle(node).color") == "rgb(139, 92, 246)"
        lab = page.locator('.module-button[data-module="laboratorio"]').first
        if lab.count() and page.locator("body.unificado-shared-menu").count():
            assert lab.locator(".shared-module-dot").evaluate(
                "node => getComputedStyle(node).backgroundColor") == "rgb(234, 179, 8)"
        STAGE = "click"
        link.click()
        frame = page.locator("#module-host iframe.is-active")
        frame.wait_for(state="visible", timeout=30000)
        ged = frame.element_handle().content_frame()
        assert ged is not None
        ged.locator("body").wait_for(state="visible", timeout=30000)
        STAGE = "assert"
        print(json.dumps({"href_path": urlsplit(link.get_attribute("href") or "").path,
                          "frame_path": urlsplit(ged.url).path,
                          "shell_path": urlsplit(page.url).path,
                          "sidebar_visible": page.locator("#sidebar").is_visible(),
                          "breadcrumb": page.locator(".breadcrumb strong").inner_text(),
                          "view": page.evaluate("new URLSearchParams(location.search).get('view')")}, ensure_ascii=False))
        assert urlsplit(ged.url).path in ("/unificado/ged", "/unificado/ged/login")
        assert page.locator("#sidebar").is_visible()
        assert page.locator(".breadcrumb strong").inner_text() == "GED"
        assert page.evaluate("new URLSearchParams(location.search).get('view')") == "ged/"
        STAGE = "return-quality"
        page.evaluate("window.UnificadoRouter.open('/unificado/qualidade/', 'qualidadePainel')")
        page.wait_for_timeout(3000)
        print(json.dumps({"return_breadcrumb": page.locator(".breadcrumb strong").inner_text(),
                          "access_denied": page.locator(".unificado-access-denied").is_visible(),
                          "frame_paths": [urlsplit(frame.url).path for frame in page.frames[1:]]}, ensure_ascii=False))
        page.locator("#module-host iframe.is-active").wait_for(state="visible", timeout=30000)
        assert page.locator(".breadcrumb strong").inner_text() == "Qualidade"
        print(json.dumps({"device": "celular" if mobile else "desktop",
                          "href_path": "/unificado/ged/", "iframe_path": urlsplit(ged.url).path,
                          "same_origin_frame": True, "shell_retained": True,
                          "quality_return": True}))
        context.close()
        browser.close()


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"GED candidate smoke failed: stage={STAGE} error={type(error).__name__}")
        raise SystemExit(1) from None
