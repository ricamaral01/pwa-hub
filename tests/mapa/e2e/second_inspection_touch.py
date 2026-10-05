"""Exercise rejected-post reinspection through visible user controls only."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
import sys

from playwright.sync_api import sync_playwright

from operacao_smoke import CHROME, OUT, credentials, login_operacao

ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT / "tests" / "mapa"))
from contract_photos import PHOTO

DATE = "2099-01-21"
FORMS = {"approved": "SC29", "loss": "SC30"}


def answer_visible_checklist(page, *, approved: bool, photo: Path) -> None:
    buttons = page.locator('#insChecklistSections button[data-ins-value="sim"]:visible')
    assert buttons.count() > 0
    for index in range(buttons.count()):
        buttons.nth(index).click()
        alert = page.locator("#msgbox-overlay.msgbox-visible")
        if alert.count():
            alert.locator(".msgbox-btn:visible").first.click()
    if not approved:
        page.locator('#insChecklistSections button[data-ins-value="nao"]:visible').first.click()
        file_input = page.locator('#insChecklistSections input[type="file"]').first
        file_input.set_input_files(str(photo))
        page.wait_for_timeout(500)


def close_message(page) -> None:
    button = page.locator("#msgbox-overlay.msgbox-visible .msgbox-btn:visible")
    if button.count():
        button.first.click()


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--result", choices=("approved", "loss"), required=True)
    parser.add_argument("--role", choices=("GERENCIA", "MONTADOR"), default="GERENCIA")
    args = parser.parse_args()
    form = FORMS[args.result]
    account = credentials()
    photo = OUT / "second-inspection-touch.png"
    OUT.mkdir(parents=True, exist_ok=True)
    photo.write_bytes(PHOTO)
    query_prod = ("/unificado/mapa/api/rest/v1/producao?select=*&data_fabricacao=eq."
                  f"{DATE}&setor=eq.Setor%203&forma=eq.{form}")
    query_mount = ("/unificado/mapa/api/rest/v1/montagem_poste?select=*&data_fabricacao=eq."
                   f"{DATE}&setor=eq.Setor%203&forma_numero=eq.{form}")
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True, executable_path=CHROME)
        context = browser.new_context(viewport={"width": 768, "height": 1024}, service_workers="block")
        page = context.new_page()
        writes = []
        page.on("request", lambda request: writes.append((request.method, request.url))
                if request.method in {"POST", "PATCH", "DELETE"}
                and "/unificado/mapa/api/" in request.url else None)
        login_operacao(page, account["MAPA_TEST_USER"], account["MAPA_TEST_PASSWORD"], args.role)
        try:
            page.evaluate("""async ({prod,mount,date,form}) => {
              for(const query of [mount,prod]) await fetch(query.replace('select=*&',''),{method:'DELETE'});
              const response=await fetch('/unificado/mapa/api/rest/v1/producao',{
                method:'POST',headers:{'Content-Type':'application/json','Prefer':'return=representation'},
                body:JSON.stringify({data_fabricacao:date,setor:'Setor 3',forma:form,modelo:'9x200',
                  descricao_poste:'9x200',codigo_produto:'678',tipo_concreto:'Concreto Seco - Vibrado',
                  colaborador:'Teste sintético',data_hora:new Date().toISOString(),status:'LIBERADO'})});
              if(!response.ok) throw Error('setup '+response.status);
            }""", {"prod": query_prod, "mount": query_mount, "date": DATE, "form": form})
            page.locator('.hub-icon-btn[data-hub-mode="INSPECAO"]:visible').click()
            page.locator("#insFiltroData").fill(DATE)
            page.locator("#insFiltroData").press("Tab")
            row = page.locator(f'#insLiberadosBody tr[data-forma-numero="{form}"]')
            row.wait_for(state="visible", timeout=20000)
            row.locator("button:visible").click()
            page.locator("#viewInspecaoDetalhe").wait_for(state="visible", timeout=15000)
            answer_visible_checklist(page, approved=False, photo=photo)
            page.locator("#insFinalizarPoste:visible").click()
            page.wait_for_timeout(1000)
            close_message(page)
            summary = page.locator("#mpResumoModal.modal-visible #mpResumoOkBtn:visible")
            if summary.count():
                summary.click()
            page.locator("#viewInspecao").wait_for(state="visible", timeout=15000)
            page.locator("#insFiltroData").fill(DATE)
            page.locator("#insFiltroData").press("Tab")
            rejected = page.locator(f'#insLiberadosBody tr[data-forma-numero="{form}"]')
            rejected.wait_for(state="visible", timeout=20000)
            action = rejected.locator("button:visible")
            assert "2ª inspeção" in action.inner_text()
            action.click()
            choice = page.locator('#unificado-second-choice [data-action="second"]:visible')
            choice.wait_for(state="visible", timeout=10000)
            choice.click()
            page.locator("#viewInspecaoDetalhe").wait_for(state="visible", timeout=15000)
            answer_visible_checklist(page, approved=args.result == "approved", photo=photo)
            page.locator("#insFinalizarPoste:visible").click()
            page.wait_for_timeout(1200)
            close_message(page)
            summary = page.locator("#mpResumoModal.modal-visible #mpResumoOkBtn:visible")
            if summary.count():
                summary.click()
            rows = page.evaluate("async u => await (await fetch(u)).json()", query_mount)
            final = [row for row in rows if row.get("etapa") == "INSPECAO"]
            history = [row for row in rows if row.get("etapa") == "HISTORICO_REPROVACAO"]
            assert len(final) == 1 and len(history) >= 1, rows
            expected_status = "RR" if args.result == "approved" else "R"
            expected_marker = "APROVADO_RETRABALHADO" if args.result == "approved" else "SEGREGADO"
            assert final[0]["status_montagem"] == expected_status
            assert final[0]["checklists"]["__segunda_inspecao"]["resultado"] == expected_marker
            assert len([item for item in writes if item[0] in {"POST", "PATCH"}]) >= 4
            print(json.dumps({"result": args.result, "role": args.role, "touch": "real", "choice_visible": True,
                              "final_status": expected_status, "first_inspection_preserved": True,
                              "writes": len(writes)}, ensure_ascii=False))
        finally:
            page.evaluate("""async ({prod,mount}) => {
              const base='/unificado/mapa/api';
              const rows=await (await fetch(mount)).json();
              for(const row of rows){
                const key=`${row.data_fabricacao}|${row.setor}|${row.forma_numero}`;
                const photos=await fetch(base+'/inspecoes/'+encodeURIComponent(key)+'/fotos');
                if(photos.ok) for(const item of (await photos.json()).data)
                  await fetch(base+'/fotos/'+item.id+'?usuario=Teste',{method:'DELETE'});
              }
              for(const query of [mount,prod]) await fetch(query.replace('select=*&',''),{method:'DELETE'});
            }""", {"prod": query_prod, "mount": query_mount})
            context.close(); browser.close()
            photo.unlink(missing_ok=True)


if __name__ == "__main__":
    main()
