"""Check the original ODIN denial for an APONTADOR account."""

from __future__ import annotations

import json
from pathlib import Path

from playwright.sync_api import sync_playwright

from operacao_smoke import CHROME, OUT, URL, credentials, login_operacao


BEFORE = Path(__file__).resolve().parents[3] / ".work-mapa-unificado" / "operacao" / "index-before-desktop.html"


def main() -> None:
    account = credentials()
    original = BEFORE.read_text(encoding="utf-8")
    variants = []
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True, executable_path=CHROME)
        for variant in ("original", "unificado"):
            context = browser.new_context(viewport={"width": 1024, "height": 768},
                                          service_workers="block")
            page = context.new_page()
            writes = []
            page.on("request", lambda request: writes.append(request.url)
                    if "/rest/v1/" in request.url and
                    request.method in {"POST", "PATCH", "DELETE"} else None)
            login_operacao(page, account["MAPA_TEST_USER"],
                           account["MAPA_TEST_PASSWORD"], "APONTADOR")
            if variant == "original":
                page.route(URL, lambda route: route.fulfill(status=200,
                    content_type="text/html; charset=utf-8", body=original))
                page.goto(URL, wait_until="domcontentloaded")
                page.wait_for_function("state.authUser?.role === 'APONTADOR'")
            result = page.evaluate("""async () => {
              setMode('LIBERACAO_S3');
              el.libData.value='2026-10-03';
              el.libData.dispatchEvent(new Event('change',{bubbles:true}));
              await new Promise(resolve=>setTimeout(resolve,1200));
              const toggle=document.getElementById('kioskOdinCheckbox');
              if(!toggle.checked) toggle.click();
              const card=document.querySelector('#libSetor3Cols .forma-card');
              if(!card) throw new Error('Card missing');
              card.click();
              await new Promise(resolve=>setTimeout(resolve,150));
              return {feedback:el.libFeedback.textContent,
                      feedbackClass:el.libFeedback.className,
                      modal:!!document.querySelector('#correcaoConcretagemModal.modal-visible')};
            }""")
            assert "Sem permissao" in result["feedback"] and not result["modal"]
            assert writes == [], (variant, writes)
            variants.append(result)
            context.close()
        browser.close()
    assert variants[0] == variants[1], variants
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "odin-apontador-denied.json").write_text(
        json.dumps(variants, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({"role": "APONTADOR", "odin": "denied_equal",
                      "writes": 0}, ensure_ascii=False))


if __name__ == "__main__":
    main()
