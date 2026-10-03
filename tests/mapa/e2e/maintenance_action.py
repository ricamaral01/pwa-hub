"""Check maintenance writes, local state and card classes on the published route."""

from __future__ import annotations

import json
from pathlib import Path

from playwright.sync_api import sync_playwright

from operacao_smoke import CHROME, OUT, credentials, login_operacao


ROOT = Path(__file__).resolve().parents[3]
FIXTURE = ROOT / "tests" / "mapa" / "fixtures" / "captured-offline.json"
KEY = "Setor 3_SC29"


def main() -> None:
    expected = [item for item in json.loads(FIXTURE.read_text(encoding="utf-8"))["requests"]
                if "inativar e liberar forma" in item.get("flow", "") and item.get("method") == "POST"]
    assert len(expected) == 2
    account = credentials()
    writes = []
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True, executable_path=CHROME)
        context = browser.new_context(viewport={"width": 1024, "height": 768},
                                      service_workers="block")
        page = context.new_page()
        page.on("request", lambda request: writes.append({
            "method": request.method, "path": request.url.split("/rest/v1/", 1)[1].split("?", 1)[0],
            "body": json.loads(request.post_data) if request.post_data else None,
            "prefer": request.headers.get("prefer")}) if
            "/rest/v1/formas_manutencao" in request.url and request.method == "POST" else None)
        login_operacao(page, account["MAPA_TEST_USER"], account["MAPA_TEST_PASSWORD"])
        results = []
        for action in ("stop", "release"):
            result = page.evaluate("""async action => {
                setMode('LIBERACAO_S3');
                el.libData.value='2026-10-03';
                if (action==='stop')
                    salvarFormaParadaManutencao('Setor 3','SC29','Captura sintética','Verificar');
                else
                    liberarFormaManutencao('Setor 3','SC29','Captura sintética');
                await new Promise(resolve => setTimeout(resolve, 450));
                await renderLiberacaoDual();
                const card=document.querySelector('#libSetor3Cols [data-forma-numero="SC29"]');
                const response=await fetch('/unificado/mapa/api/rest/v1/formas_manutencao?id=eq.Setor%203_SC29&select=*');
                return {local:isFormaEmManutencao('Setor 3','SC29')?.status||null,
                        row:(await response.json())[0]||null,
                        card:card?{classes:card.className,text:card.innerText,title:card.title}:null};
            }""", action)
            results.append(result)
        context.close()
        browser.close()
    assert len(writes) == 2
    static = ("id", "setor", "forma_numero", "status", "motivo_parada",
              "acao_necessaria", "obs_liberacao")
    for index, (write, result) in enumerate(zip(writes, results)):
        assert write["path"] == expected[index]["path"].split("/rest/v1/", 1)[1]
        assert write["method"] == expected[index]["method"]
        assert result["row"] is not None
        for field in static:
            assert result["row"].get(field) == write["body"].get(field), (index, field)
            assert write["body"].get(field) == expected[index]["body"].get(field), (index, field)
        assert result["card"] is not None
    assert results[0]["local"] == "PARADA" and "is-manutencao" in results[0]["card"]["classes"]
    assert results[1]["local"] is None and "is-manutencao" not in results[1]["card"]["classes"]
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "maintenance-private.json").write_text(json.dumps({"writes": writes, "results": results},
                                                       ensure_ascii=False, indent=2), encoding="utf-8")
    print("maintenance_fixture_static_fields=equal db_rows=equal card_stopped=equal card_released=equal")


if __name__ == "__main__":
    main()
