"""Read-only computed-style audit of internal states on the published desktop."""

import json
from pathlib import Path
import subprocess
import sys
from playwright.sync_api import sync_playwright

sys.path.insert(0, str(Path(__file__).parent / "mapa" / "e2e"))
from operacao_smoke import credentials, login_operacao, CHROME

BASE = "https://concrefer.concretrack.com.br"
OUT = Path(__file__).resolve().parents[1] / ".work-mapa-unificado" / "internal-layout"


def style(page, selector):
    return page.locator(selector).first.evaluate("""node => {
      const s=getComputedStyle(node);
      return {background:s.backgroundColor,borderRadius:s.borderRadius,
              boxShadow:s.boxShadow,color:s.color,display:s.display};
    }""")


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    raw = subprocess.check_output(["ssh", "vps-staging", "cat",
                                   "/etc/mapa-unificado/pcp-auth-probe.env"], text=True)
    pcp = dict(line.split("=", 1) for line in raw.splitlines() if "=" in line)
    mapa = credentials()
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True, executable_path=CHROME)
        context = browser.new_context(viewport={"width": 1366, "height": 768}, service_workers="block")
        page = context.new_page()
        login_operacao(page, mapa["MAPA_TEST_USER"], mapa["MAPA_TEST_PASSWORD"])
        page.evaluate("setMode('PROD_ANALISE')")
        page.locator("#paBtnToggleFiltros").click()
        mapa_styles = {"drawer": style(page, "#paFiltrosDrawer .mi-drawer-content"),
                       "modal": style(page, ".modal-box")}
        page.screenshot(path=str(OUT / "mapa-drawer-057.png"), animations="disabled")
        page.goto(BASE + "/unificado/login.html?next=pcp/usuarios/")
        page.locator('#unificado-login-form [name="username"]').fill(pcp["PCP_TEST_USER"])
        page.locator('#unificado-login-form [name="password"]').fill(pcp["PCP_TEST_PASSWORD"])
        page.locator('#unificado-login-form button[type="submit"]').click()
        page.wait_for_url("**/unificado/pcp/usuarios/", timeout=20000)
        pcp_styles = {"card": style(page, ".section-card"),
                      "button": style(page, ".btn-accent"),
                      "table": style(page, ".table-responsive")}
        page.screenshot(path=str(OUT / "pcp-usuarios-057.png"), animations="disabled")
        context.close()
        browser.close()
    report = {"version": "0.5.7", "mapa": mapa_styles, "pcp": pcp_styles}
    (OUT / "styles-057.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(json.dumps(report))


if __name__ == "__main__":
    main()
