"""Queue and resend a test-only S3 programming action in Android Chrome emulation."""

from __future__ import annotations

import json
import subprocess
from pathlib import Path

from playwright.sync_api import sync_playwright


BASE = "https://concrefer.concretrack.com.br"
DATE = "2099-04-04"
QUERY = ("/unificado/mapa/api/rest/v1/prog_s3_s4?select=*"
         "&data=eq.2099-04-04&forma=eq.SC23&setor=eq.Setor%203")
OUT = Path("docs/capturas-ricardo-20261004/android-offline.json")


def main() -> None:
    raw = subprocess.check_output(
        ["ssh", "vps-staging", "cat", "/etc/mapa-unificado/auth-probe.env"],
        text=True, encoding="utf-8")
    account = dict(line.split("=", 1) for line in raw.splitlines() if "=" in line)
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(
            headless=True, executable_path=r"C:\Program Files\Google\Chrome\Application\chrome.exe")
        context = browser.new_context(**playwright.devices["Galaxy Tab S9 landscape"])
        page = context.new_page()
        page.goto(BASE + "/unificado/login.html")
        page.locator('[name="username"]').fill(account["MAPA_TEST_USER"])
        page.locator('[name="password"]').fill(account["MAPA_TEST_PASSWORD"])
        page.locator('#unificado-login-form button').click()
        page.wait_for_url("**/unificado/index.html", timeout=20000)
        page.goto(BASE + "/unificado/mapa/operacao/")
        page.wait_for_function("typeof state!=='undefined' && state.authUser?.role==='GERENCIA'", timeout=20000)
        page.wait_for_function("navigator.serviceWorker.controller !== null", timeout=20000)
        page.wait_for_timeout(3000)
        page.wait_for_function("typeof state!=='undefined' && state.authUser?.role==='GERENCIA'", timeout=20000)
        before = None
        for _ in range(3):
            try:
                before = page.evaluate("""async q => (await (await fetch(q)).json()).length""", QUERY)
                break
            except Exception:
                page.wait_for_timeout(1000)
        assert before == 0, "Synthetic target already has rows"
        context.set_offline(True)
        page.reload(wait_until="domcontentloaded")
        page.wait_for_function("typeof readProgS3S4Db === 'function'", timeout=10000)
        queued = page.evaluate("""() => {
          const key='2099-04-04||SC23||Setor 3';
          const db=readProgS3S4Db();
          db.programacoes[key]={data:'2099-04-04',forma:'SC23',setor:'Setor 3',
            modelo:'12X600',pendingSync:true};
          writeProgS3S4Db(db);
          return readProgS3S4Db().programacoes[key].pendingSync;
        }""")
        assert queued
        context.set_offline(False)
        page.evaluate("syncOfflineData()")
        page.wait_for_function("""() =>
          readProgS3S4Db().programacoes['2099-04-04||SC23||Setor 3']?.pendingSync === false
        """, timeout=20000)
        result = page.evaluate("""async q => {
          const rows=await (await fetch(q)).json();
          const response=await fetch(q.replace('select=*&',''),{method:'DELETE'});
          return {rows:rows.length,model:rows[0]?.modelo,cleanup:response.status};
        }""", QUERY)
        assert result == {"rows": 1, "model": "12X600", "cleanup": 204}, result
        residue = page.evaluate("""async q => (await (await fetch(q)).json()).length""", QUERY)
        assert residue == 0
        report = {"device": "Galaxy Tab S9 landscape",
                  "version": Path("unificado/VERSION").read_text(encoding="utf-8").strip(),
                  "offline_reload": True, "queued": True, "resent": True,
                  "row_fields": result, "cleanup_residue": residue}
        OUT.parent.mkdir(parents=True, exist_ok=True)
        OUT.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
        print(json.dumps(report, ensure_ascii=True))
        context.close()
        browser.close()


if __name__ == "__main__":
    main()
