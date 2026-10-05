"""Published paired-account PCP crawl for hosts, UTF-8 and real menu navigation."""
from __future__ import annotations

import json
from pathlib import Path
import re
import subprocess
from urllib.parse import urljoin, urlsplit

from playwright.sync_api import sync_playwright


BASE = "https://concrefer.concretrack.com.br"
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
BAD = re.compile(r"(?:Ãƒ|Ã‚|â‚¬|ï¿½|\ufffd)")
OUT = Path("test-results/blocker-065/pcp-pair.json")


def account() -> dict:
    raw = subprocess.check_output(
        ["ssh", "vps-staging", "sudo", "cat", "/etc/mapa-unificado/blocker-matrix.json"],
        text=True, encoding="utf-8")
    return next(item for item in json.loads(raw)["accounts"] if item["kind"] == "pair")


def main() -> None:
    acc = account()
    hosts = set()
    api_bad = []
    rows = []
    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True, executable_path=CHROME)
        context = browser.new_context(viewport={"width": 1366, "height": 768},
                                      service_workers="block", locale="pt-BR")
        page = context.new_page()
        page.on("request", lambda request: hosts.add(urlsplit(request.url).hostname or ""))
        def scan_response(response):
            if response.url.endswith("/vendor/xlsx/xlsx.full.min.js"):
                return
            content_type = response.headers.get("content-type", "")
            if not any(value in content_type for value in ("json", "text", "javascript", "xml")):
                return
            try:
                match = BAD.search(response.text())
                if match:
                    api_bad.append({"url": response.url, "marker": match.group(0)})
            except Exception:
                pass
        page.on("response", scan_response)
        page.goto(BASE + "/unificado/login.html?next=%2Funificado%2Findex.html",
                  wait_until="domcontentloaded")
        page.locator('#unificado-login-form [name="username"]').fill(acc["login"].upper())
        page.locator('#unificado-login-form [name="password"]').fill(acc["password"])
        page.locator('#unificado-login-form button[type="submit"]').click()
        page.wait_for_url("**/unificado/index.html", timeout=20_000)
        planning = page.locator('a[href*="/unificado/pcp/dashboard/"]:visible').first
        planning.click()
        page.wait_for_url("**/unificado/pcp/dashboard/", timeout=20_000)
        page.locator("#sidebar nav").wait_for(timeout=20_000)
        links = page.locator('#sidebar nav a.nav-link[href]:not([aria-disabled="true"])')
        routes = list(dict.fromkeys(link.get_attribute("href") for link in links.all()
                                    if link.get_attribute("href") and "/unificado/pcp/" in link.get_attribute("href")))
        for href in routes:
            page.goto(BASE + "/unificado/pcp/dashboard/", wait_until="domcontentloaded")
            link = page.locator(f'#sidebar nav a.nav-link[href="{href}"]').first
            group = link.locator('xpath=ancestor::div[contains(@class,"nav-group")]').first
            if group.count():
                toggle = group.locator(".nav-group-toggle")
                if toggle.get_attribute("aria-expanded") == "false":
                    toggle.click()
            link.click()
            page.wait_for_url("**" + urlsplit(urljoin(BASE, href)).path, timeout=20_000)
            page.wait_for_timeout(250)
            text = page.locator("body").inner_text()
            rows.append({"route": urlsplit(page.url).path,
                         "utf8": BAD.search(text) is None,
                         "neutral": "supabase" not in text.lower(),
                         "login_loop": "/login.html" not in page.url})
        context.close(); browser.close()
    result = {"pages": len(rows), "passed": sum(all((r["utf8"], r["neutral"], r["login_loop"])) for r in rows),
              "hosts": sorted(hosts), "api_mojibake": api_bad, "rows": rows}
    OUT.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({k: result[k] for k in ("pages", "passed", "hosts", "api_mojibake")}, ensure_ascii=True))
    raise SystemExit(0 if result["pages"] == result["passed"] and not api_bad else 1)


if __name__ == "__main__":
    main()
