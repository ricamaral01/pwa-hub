"""Save one future-dated PCP test row; retain it as lote-1 evidence."""
from __future__ import annotations

import json
import subprocess
import argparse

from playwright.sync_api import sync_playwright


BASE = "https://concrefer.concretrack.com.br"
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
PROBE = "/etc/mapa-unificado/pcp-auth-admin-probe.env"


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--date", default="2099-10-15")
    date = parser.parse_args().date
    raw = subprocess.check_output(["ssh", "vps-staging", "cat", PROBE],
                                  text=True, encoding="utf-8")
    account = dict(line.split("=", 1) for line in raw.splitlines() if "=" in line)
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, executable_path=CHROME)
        context = browser.new_context(service_workers="block")
        page = context.new_page()
        page.goto(BASE + "/unificado/login.html?next=pcp/programacao/", wait_until="domcontentloaded")
        page.locator('#unificado-login-form [name="username"]').fill(account["PCP_TEST_USER"])
        page.locator('#unificado-login-form [name="password"]').fill(account["PCP_TEST_PASSWORD"])
        page.locator('#unificado-login-form button[type="submit"]').click()
        page.wait_for_url("**/unificado/?view=pcp%2Fprogramacao%2F", timeout=20000)
        frame = page.frame_locator('iframe[src*="/unificado/pcp/programacao/"]')
        frame.locator('#prog-setor option[value="3"]').wait_for(state="attached", timeout=20000)
        existing = frame.locator("body").evaluate("""async (_, date) =>
          await API.get('/api/programacao?data_inicio='+date+'&data_fim='+date+'&setor_id=3')""", date)
        assert not existing, "Future test date already has PCP rows; choose a new date before writing"
        frame.locator("#prog-data").fill(date)
        frame.locator("#prog-setor").select_option("3")
        option = frame.locator("#prog-produto option[value]:not([value=''])").first
        option.wait_for(state="attached", timeout=15000)
        product = option.get_attribute("value")
        frame.locator("#prog-produto").select_option(product)
        frame.locator("#prog-qtd").fill("1")
        frame.locator("#form-prog button[type=submit]").click()
        frame.locator("#toast-container").get_by_text("Programação adicionada").wait_for(
            state="visible", timeout=15000)
        rows = frame.locator("body").evaluate("""async (_, date) =>
          await API.get('/api/programacao?data_inicio='+date+'&data_fim='+date+'&setor_id=3')""", date)
        assert len(rows) == 1 and rows[0]["data"] == date
        print(json.dumps({"pcp_test_save": "ok", "id": rows[0]["id"],
                          "date": date, "setor_id": 3, "retained": True}))
        context.close()
        browser.close()


if __name__ == "__main__":
    main()
