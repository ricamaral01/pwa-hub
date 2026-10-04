"""Check the corrected defect total with a profile from an earlier release."""

from __future__ import annotations

import json
from pathlib import Path

from playwright.sync_api import sync_playwright

from paired_navigation_published import BASE, CHROME, credentials, login


OUT = Path("docs/capturas-ricardo-20261004")


def main() -> None:
    with sync_playwright() as playwright:
        context = playwright.chromium.launch_persistent_context(
            ".work-mapa-unificado/browser-old-cache", headless=True,
            executable_path=CHROME, viewport={"width": 1366, "height": 768})
        page = context.pages[0] if context.pages else context.new_page()
        login(page, credentials())
        page.goto(BASE + "/unificado/mapa/operacao/")
        page.wait_for_function("typeof state !== 'undefined' && state.authUser?.role === 'GERENCIA'", timeout=20000)
        page.wait_for_function("navigator.serviceWorker.controller !== null", timeout=20000)
        page.wait_for_timeout(1200)
        page.wait_for_function("typeof state !== 'undefined' && state.authUser?.role === 'GERENCIA'", timeout=20000)
        result = page.evaluate("""async () => {
          setMode('DASHBOARD_DEFEITOS');
          document.getElementById('dfDataInicio').value='2026-10-01';
          document.getElementById('dfDataFim').value='2026-10-04';
          document.getElementById('dfFiltroSetor').value='';
          await carregarDashboardDefeitos(true);
          return {version:document.getElementById('unificado-version').textContent.trim(),
                  total:miDefeitosExportData.kpis.total_erros,
                  url:location.href};
        }""")
        page.screenshot(path=str(OUT / "dashboard-defeitos-old-cache.png"))
        context.close()
    assert result["total"] == 14, result
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "dashboard-defeitos-old-cache.json").write_text(
        json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(result, ensure_ascii=True))


if __name__ == "__main__":
    main()
