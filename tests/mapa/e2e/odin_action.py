"""Check ODIN correction/cancellation against original requests and test DB."""

from __future__ import annotations

import json
from pathlib import Path

from playwright.sync_api import sync_playwright

from operacao_smoke import CHROME, OUT, credentials, login_operacao


ROOT = Path(__file__).resolve().parents[3]
FIXTURE = ROOT / "tests" / "mapa" / "fixtures" / "captured-offline.json"


def main() -> None:
    expected = [item for item in json.loads(FIXTURE.read_text(encoding="utf-8"))["requests"]
                if item.get("flow") == "ODIN: alterar tipo e cancelar concretagem"
                and item.get("method") in {"PATCH", "DELETE"}]
    assert [item["method"] for item in expected] == ["PATCH", "DELETE"]
    account = credentials()
    writes = []
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True, executable_path=CHROME)
        context = browser.new_context(viewport={"width": 1024, "height": 768},
                                      service_workers="block")
        page = context.new_page()
        page.on("dialog", lambda dialog: dialog.accept())
        page.on("request", lambda request: writes.append({
            "method": request.method,
            "path": request.url.split("/rest/v1/", 1)[1].split("?", 1)[0],
            "query": request.url.split("?", 1)[1] if "?" in request.url else "",
            "body": json.loads(request.post_data) if request.post_data else None}) if
            "/rest/v1/producao" in request.url and request.method in {"PATCH", "DELETE"} else None)
        login_operacao(page, account["MAPA_TEST_USER"], account["MAPA_TEST_PASSWORD"])
        result = page.evaluate("""async () => {
            setMode('LIBERACAO_S3'); el.libData.value='2026-10-02';
            await renderLiberacaoDual();
            const selectRows = async () => (await (await fetch(
              '/unificado/mapa/api/rest/v1/producao?select=*&data_fabricacao=eq.2026-10-02&setor=eq.Setor%203&forma=eq.SC29'
            )).json());
            const cardState = () => {
              const card=document.querySelector('#libSetor3Cols [data-forma-numero="SC29"]');
              return card?{classes:card.className,text:card.innerText}:null;
            };
            const before=await selectRows();
            if(before.length!==1) throw new Error('Expected one existing SC29 production');
            await cancelarConcretagemOdin('SC29','Setor 3');
            const modal=document.getElementById('correcaoConcretagemModal');
            if(!modal?.classList.contains('modal-visible')) throw new Error('ODIN modal absent');
            const select=document.getElementById('correcaoConcretagemTipo');
            const next=[...select.options].find(option=>option.value!==select.value);
            if(!next) throw new Error('Alternative concrete type absent');
            select.value=next.value;
            await document.getElementById('correcaoConcretagemSalvar').onclick();
            const corrected={rows:await selectRows(),card:cardState(),type:next.value};
            await cancelarConcretagemOdin('SC29','Setor 3');
            if(!modal.classList.contains('modal-visible')) throw new Error('ODIN cancellation modal absent');
            await document.getElementById('correcaoConcretagemCancelar').onclick();
            const cancelled={rows:await selectRows(),card:cardState()};
            return {before,corrected,cancelled};
        }""")
        context.close()
        browser.close()
    assert len(writes) == 2 and [item["method"] for item in writes] == ["PATCH", "DELETE"]
    assert all(item["path"] == "producao" for item in writes)
    assert writes[0]["body"] == expected[0]["body"]
    assert result["corrected"]["rows"][0]["tipo_concreto"] == result["corrected"]["type"]
    assert result["cancelled"]["rows"] == []
    assert result["corrected"]["card"] and result["cancelled"]["card"]
    assert result["corrected"]["card"]["classes"] == "forma-card is-saved"
    assert result["corrected"]["type"] in result["corrected"]["card"]["text"]
    assert result["cancelled"]["card"]["classes"] == "forma-card is-idle"
    assert result["cancelled"]["card"]["text"].strip() == "SC29"
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "odin-private.json").write_text(json.dumps({"writes": writes, "result": result},
                                                ensure_ascii=False, indent=2), encoding="utf-8")
    print("odin_fixture_methods=equal correction_body=equal db_updated=ok db_deleted=ok card_classes_text=equal")


if __name__ == "__main__":
    main()
