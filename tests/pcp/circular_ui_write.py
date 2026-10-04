"""Exercise original PCP circular programming in the isolated test database."""
from __future__ import annotations

import argparse
import json
import subprocess

from playwright.sync_api import sync_playwright

BASE = "https://concrefer.concretrack.com.br"
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
DATE = "2099-02-06"


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--sector", choices=("3", "4"), required=True)
    parser.add_argument("--role", choices=("ADMIN", "PCP"), required=True)
    args = parser.parse_args()
    api = f"/api/programacao-circular-s{args.sector}"
    raw = subprocess.check_output(
        ["ssh", "vps-staging", "cat", "/etc/mapa-unificado/pcp-auth-probe.env"],
        text=True, encoding="utf-8")
    account = dict(line.split("=", 1) for line in raw.splitlines() if "=" in line)
    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True, executable_path=CHROME)
        context = browser.new_context(viewport={"width": 1366, "height": 768},
                                      service_workers="block")
        page = context.new_page()
        writes = []
        form = None
        def capture(req):
            if f"/unificado/pcp/api/programacao-circular-s{args.sector}/" in req.url \
                    and req.method in {"POST", "PATCH", "DELETE"}:
                writes.append({"method": req.method,
                               "path": req.url.split("/unificado/pcp/api", 1)[-1].split("?", 1)[0],
                               "body": req.post_data_json if req.post_data else None})
        page.on("request", capture)
        try:
            page.goto(BASE + f"/unificado/login.html?next=pcp/programacao-circular-s{args.sector}/",
                      wait_until="domcontentloaded")
            page.locator('#unificado-login-form [name="username"]').fill(account["PCP_TEST_USER"])
            page.locator('#unificado-login-form [name="password"]').fill(account["PCP_TEST_PASSWORD"])
            page.locator('#unificado-login-form button[type="submit"]').click()
            page.wait_for_url(f"**/unificado/pcp/programacao-circular-s{args.sector}/", timeout=20000)
            page.locator("#start-date").fill(DATE)
            page.locator("#days-count").fill("1")
            page.locator("#load-period").click()
            page.wait_for_function("() => state.dates[0] === '" + DATE + "' && !state.loading")
            assert not page.evaluate("() => [...state.rows.values()].length")
            button = page.locator("#forms-body button[data-form][data-model]").first
            button.wait_for(state="visible")
            form = button.get_attribute("data-form")
            model = button.get_attribute("data-model")
            button.click()
            page.locator("#save-period").click()
            page.wait_for_function("() => state.rows.size === 1 && !state.loading", timeout=15000)
            rows = page.evaluate("async path => await API.get(path)",
                                 f"{api}?data_inicio={DATE}&dias=1")
            assert len(rows) == 1 and rows[0]["data"] == DATE
            assert rows[0]["codigo_forma"] == form and rows[0]["modelo"] == model
            assert writes[0] == {"method": "POST", "path": f"{api.removeprefix('/api')}/periodo",
                                 "body": {"data_inicio": DATE, "dias": 1,
                                          "selecoes": [{"codigo_forma": form, "modelo": model}],
                                          "limpar_formas": []}}, writes
            page.locator('input[name="edit-mode"][value="dia"]').check()
            page.locator(f'#forms-body button[data-form="{form}"][data-model="{model}"]').click()
            page.wait_for_function("() => state.rows.size === 0 && !state.loading", timeout=15000)
            assert page.evaluate("async path => await API.get(path)",
                                 f"{api}?data_inicio={DATE}&dias=1") == []
            assert [item["method"] for item in writes] == ["POST", "DELETE"], writes
            form = None
            print(json.dumps({"role": args.role, "sector": args.sector,
                              "circular_ui": "equal", "row_cleaned": True}))
        finally:
            if form is not None:
                page.evaluate("async ([path, day, code]) => await API.delete(path+'/dia?data='"
                              "+day+'&codigo_forma='+encodeURIComponent(code))",
                              [api, DATE, form])
            context.close()
            browser.close()


if __name__ == "__main__":
    main()
