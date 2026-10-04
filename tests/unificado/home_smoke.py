"""Exercise the unified home using isolated accounts, without external data calls."""

from __future__ import annotations

import json
import subprocess
from urllib.parse import urlsplit

from playwright.sync_api import sync_playwright


BASE = "https://concrefer.concretrack.com.br"
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"


def credentials(filename: str) -> dict[str, str]:
    raw = subprocess.check_output(["ssh", "vps-staging", "cat", filename],
                                  text=True, encoding="utf-8")
    return dict(line.split("=", 1) for line in raw.splitlines() if "=" in line)


def main() -> None:
    accounts = {
        "so_pcp": (credentials("/etc/mapa-unificado/pcp-auth-probe.env"), "PCP"),
        "so_mapa": (credentials("/etc/mapa-unificado/auth-probe.env"), "MAPA"),
    }
    results = []
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True, executable_path=CHROME)
        for kind, (account, prefix) in accounts.items():
            context = browser.new_context(viewport={"width": 1366, "height": 768},
                                          service_workers="block")
            wrong_hosts, errors, responses = [], [], []
            def restrict(route):
                host = urlsplit(route.request.url).hostname
                if host != "concrefer.concretrack.com.br":
                    wrong_hosts.append(host)
                    route.abort()
                else:
                    route.continue_()
            context.route("**/*", restrict)
            page = context.new_page()
            page.on("pageerror", lambda error: errors.append(str(error)[:180]))
            page.on("response", lambda response: responses.append(
                {"path": urlsplit(response.url).path, "status": response.status})
                if "/api/" in urlsplit(response.url).path else None)
            page.goto(BASE + "/unificado/login.html", wait_until="domcontentloaded")
            page.locator('#unificado-login-form [name="username"]').fill(account[prefix + "_TEST_USER"])
            page.locator('#unificado-login-form [name="password"]').fill(account[prefix + "_TEST_PASSWORD"])
            page.locator('#unificado-login-form button[type="submit"]').click()
            page.wait_for_url("**/unificado/index.html", timeout=20000)
            page.wait_for_function("() => document.querySelector('.sample-note')?.textContent.includes('Dados de')",
                                   timeout=20000)
            values = page.locator(".sector-card").evaluate_all("""cards => cards.map(card => ({
              setor:card.dataset.sector,
              programado:card.querySelector('[data-stat=programado]').textContent,
              realizado:card.querySelector('[data-stat=realizado]').textContent
            }))""")
            menu = page.locator(".module-button").all_text_contents()
            linked = page.locator("#sidebar a[href],.sector-actions a[href],.shortcut-list a[href]").evaluate_all(
                "links => links.map(link => new URL(link.href).pathname)")
            results.append({"kind": kind, "menu": menu, "sectors": values,
                            "links": len(linked), "official_links": [path for path in linked
                            if path.startswith("/pages/") or path.startswith("/mapa-concretagem/")],
                            "responses": responses, "external": wrong_hosts, "errors": errors})
            context.close()
        browser.close()
    for result in results:
        assert len(result["sectors"]) == 4 and not result["official_links"]
        assert not result["external"] and not result["errors"]
        assert result["menu"] == (["Planejamento"] if result["kind"] == "so_pcp" else ["Produção"])
        print(json.dumps(result, ensure_ascii=False))


if __name__ == "__main__":
    main()
