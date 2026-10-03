"""Compare published operation navigation across roles and sectors to original."""

from __future__ import annotations

import json
from pathlib import Path
import subprocess
from urllib.parse import urlsplit

from playwright.sync_api import sync_playwright

from operacao_smoke import CHROME, OUT, URL, credentials


ROOT = Path(__file__).resolve().parents[3]
EXPECTED = ROOT / "tests" / "mapa" / "fixtures" / "role-sector-navigation.json"


def profiles() -> dict:
    original = credentials()
    raw = subprocess.check_output(
        ["ssh", "vps-staging", "cat", "/etc/mapa-unificado/operacao-test-profiles.env"], text=True)
    others = dict(line.split("=", 1) for line in raw.splitlines() if "=" in line)
    return {"GERENCIA": (original["MAPA_TEST_USER"], original["MAPA_TEST_PASSWORD"]),
            **{role: ("e2e-" + role.lower(), others[role + "_PASSWORD"])
               for role in ("GESTOR", "MONTADOR", "APONTADOR")}}


def main() -> None:
    expected = {(item["role"], item["sector"], item["mode"]): item
                for item in json.loads(EXPECTED.read_text(encoding="utf-8"))["cases"]}
    modes = list(dict.fromkeys(item["mode"] for item in expected.values()))
    results = []
    external = []
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True, executable_path=CHROME)
        for role, (user, password) in profiles().items():
            context = browser.new_context(viewport={"width": 1024, "height": 768},
                                          service_workers="block")
            def restrict(route):
                url = urlsplit(route.request.url)
                if url.hostname != "concrefer.concretrack.com.br":
                    external.append({"role": role, "method": route.request.method,
                                     "host": url.hostname, "path": url.path})
                    route.abort()
                else:
                    route.continue_()
            context.route("**/*", restrict)
            page = context.new_page()
            page.goto(URL, wait_until="domcontentloaded", timeout=30000)
            page.wait_for_function("typeof loginWithRole === 'function'", timeout=15000)
            page.wait_for_timeout(800)
            page.locator("#loginNome").fill(user)
            page.locator("#loginSenha").fill(password)
            page.locator("#loginEntrar").click()
            page.wait_for_function("state.authUser?.role === " + json.dumps(role), timeout=15000)
            for sector in range(1, 5):
                actual = page.evaluate("""({sector,modes}) => {
                    state.authUser.setor = 'Setor ' + sector;
                    setAccessByRole(state.authUser.role);
                    return modes.map(mode => {
                        const allowed = isModeAllowed(mode);
                        setMode(mode);
                        return {mode, allowed, actual: state.mode};
                    });
                }""", {"sector": sector, "modes": modes})
                for item in actual:
                    source = expected[(role, sector, item["mode"])]
                    results.append({"role": role, "sector": sector, "mode": item["mode"],
                                    "equal": item["allowed"] == source["allowed"]
                                    and item["actual"] == source["actual"],
                                    "actual": item["actual"], "expected": source["actual"]})
            context.close()
        browser.close()
    OUT.mkdir(parents=True, exist_ok=True)
    report = {"total": len(results), "equal": sum(item["equal"] for item in results),
              "different": [item for item in results if not item["equal"]],
              "external_blocked": external}
    (OUT / "live-navigation.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({"total": report["total"], "equal": report["equal"],
                      "different": len(report["different"]), "external_blocked": len(external)}))


if __name__ == "__main__":
    main()
