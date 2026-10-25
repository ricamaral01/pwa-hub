"""Read-only GED menu/iframe diagnostic; never logs auth material."""
from __future__ import annotations

import json
import subprocess
from urllib.parse import urlsplit

from playwright.sync_api import sync_playwright

BASE = "https://concrefer.concretrack.com.br"
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"


def main() -> None:
    raw = subprocess.check_output(["ssh", "vps-staging", "cat",
                                   "/etc/mapa-unificado/quality-auth-probe.env"],
                                  text=True, encoding="utf-8")
    creds = dict(line.split("=", 1) for line in raw.splitlines() if "=" in line)
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True, executable_path=CHROME)
        context = browser.new_context(service_workers="block")
        page = context.new_page()
        page.goto(BASE + "/unificado/login.html", wait_until="domcontentloaded")
        page.locator('#unificado-login-form [name="username"]').fill(creds["MAPA_TEST_USER"])
        page.locator('#unificado-login-form [name="password"]').fill(creds["MAPA_TEST_PASSWORD"])
        page.locator('#unificado-login-form button[type="submit"]').click()
        page.wait_for_url("**/unificado/index.html", timeout=30000)
        link = page.get_by_role("link", name="GED — Documentos e calibrações").first
        link.wait_for(state="visible")
        href = link.get_attribute("href")
        page.evaluate("""() => {
          const frame = document.createElement('iframe');
          frame.id = 'ged-diagnostic-frame';
          frame.src = '/unificado/ged/';
          document.body.append(frame);
        }""")
        frame = page.locator("#ged-diagnostic-frame").element_handle().content_frame()
        frame.locator("body").wait_for(state="visible", timeout=30000)
        frame_path = urlsplit(frame.url).path
        link.click()
        page.wait_for_load_state("domcontentloaded")
        print(json.dumps({"menu_href_path": urlsplit(href or "").path,
                          "same_origin_frame_path": frame_path,
                          "after_click_path": urlsplit(page.url).path}, ensure_ascii=False))
        context.close()
        browser.close()


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"GED menu diagnostic failed: {type(error).__name__}")
        raise SystemExit(1) from None
