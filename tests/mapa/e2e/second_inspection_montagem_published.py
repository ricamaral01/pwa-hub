"""Use visible controls to verify second inspection in published Montagem de Postes.

Creates one temporary Mapa account and two synthetic posts in the new database,
then removes them even if a browser assertion fails. No official host is written.
"""
from __future__ import annotations

import json
import secrets
import subprocess
import uuid

from argon2 import PasswordHasher
from playwright.sync_api import sync_playwright


ORIGIN = "https://concrefer.concretrack.com.br"
DATE = "2099-01-23"
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"


def sql(statement: str) -> str:
    result = subprocess.run(
        ["ssh", "vps-staging", "sudo -u postgres psql -d mapa_unificado_teste -AtX -v ON_ERROR_STOP=1"],
        input=statement, text=True, capture_output=True,
    )
    if result.returncode:
        error = next((line for line in result.stderr.splitlines() if "ERROR:" in line),
                     "Database setup or cleanup failed")
        raise RuntimeError(error)
    return result.stdout.strip()


def dismiss_message(frame) -> None:
    button = frame.locator("#msgbox-overlay.msgbox-visible .msgbox-btn:visible")
    if button.count():
        button.first.click()


def main() -> None:
    login = "e2e-montagem-" + secrets.token_hex(5)
    password = secrets.token_urlsafe(18)
    hashed = PasswordHasher().hash(password)
    viewports = ((1366, 768), (768, 1024))
    posts = [(str(uuid.uuid4()), "ZZ" + secrets.token_hex(3).upper(), result, viewport)
             for viewport in viewports for result in ("approved", "loss")]
    created = True
    try:
        sql(f"""insert into public.usuarios (id,nome,perfil,senha_hash,ativo,setor,primeiro_acesso)
             values ('{login}','Teste montagem','MONTADOR','{hashed}',true,'Setor 1',false);
             """ + "\n".join(
            f"""insert into public.producao
                (id,data_hora,setor,forma,modelo,tipo_concreto,colaborador,data_fabricacao,status)
                values ('{record_id}',now(),'Setor 1','{form}','9x200','Concreto Seco - Vibrado',
                        'Teste sintetico','{DATE}','LIBERADO');
                insert into public.montagem_poste
                (id,record_id,data_fabricacao,setor,forma_numero,modelo,status_montagem,
                 etapa,inicio_inspecao_montagem,finalizado_em,checklists)
                values ('{record_id}||{DATE}||Setor 1||{form}','{record_id}','{DATE}',
                        'Setor 1','{form}','9x200','R','FINALIZACAO',now() - interval '1 hour',
                        now() - interval '30 minutes',
                        '{{"checagem_inicial":{{"homogeneidade_concreto":"nao"}}}}'::jsonb);"""
            for record_id, form, _, _ in posts))
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(headless=True, executable_path=CHROME)
            results = []
            for width, height in viewports:
                context = browser.new_context(viewport={"width": width, "height": height},
                                              service_workers="block",
                                              permissions=["geolocation"],
                                              geolocation={"latitude": 0, "longitude": 0})
                page = context.new_page()
                page.goto(ORIGIN + "/unificado/login.html", wait_until="domcontentloaded")
                page.locator('input[name="username"]').fill(login)
                page.locator('input[name="password"]').fill(password)
                page.locator('#unificado-login-form button[type="submit"]').click()
                page.wait_for_function("location.pathname !== '/unificado/login.html'", timeout=30000)
                page.goto(ORIGIN + "/unificado/?view=mapa%2Foperacao%2F%3Ftela%3DMONTAGEM_POSTES",
                          wait_until="domcontentloaded")
                frame = page.frame_locator("iframe.is-active")
                frame.locator("#viewMontagemPostes").wait_for(state="visible", timeout=30000)
                frame.locator("#mpSetor").select_option("Setor 1")
                frame.locator("#mpFiltroData").fill(DATE)
                frame.locator("#mpCarregarLiberados").click()
                for record_id, form, result, viewport in posts:
                    if viewport != (width, height):
                        continue
                    row = frame.locator(f'#mpLiberadosBody tr[data-forma-numero="{form}"]')
                    row.wait_for(state="visible", timeout=30000)
                    row.locator(".mp-ver-checklist-btn").click()
                    choice = frame.locator('#unificado-second-choice [data-action="second"]:visible')
                    choice.wait_for(state="visible", timeout=10000)
                    report_entry = result == "loss"
                    if report_entry:
                        frame.locator('#unificado-second-choice [data-action="report"]:visible').click()
                        report = frame.locator('#visualizarChecklistModal.modal-visible')
                        report.wait_for(state="visible", timeout=15000)
                        frame.locator('#unificado-report-second:visible').click()
                    else:
                        choice.click()
                    frame.locator("#viewMontagemPostesDetalhe").wait_for(state="visible", timeout=15000)
                    for _ in range(40):
                        dismiss_message(frame)
                        button = frame.locator('#mpChecklistSections button[data-mp-value="sim"]:visible:not([disabled]):not(.active)').first
                        if not button.count():
                            break
                        button.click()
                    else:
                        raise AssertionError("Checklist did not finish")
                    dismiss_message(frame)
                    if result == "loss":
                        frame.locator('#mpChecklistSections button[data-mp-value="nao"]:visible:not([disabled])').last.click()
                        dismiss_message(frame)
                        frame.locator('#mpStatusButtons button[data-mp-status="R"]:visible').click()
                    else:
                        frame.locator('#mpStatusButtons button[data-mp-status="A"]:visible').click()
                    frame.locator("#mpFinalizarPoste:visible").click()
                    frame.locator("#mpResumoModal.modal-visible #mpResumoOkBtn:visible").wait_for(
                        state="visible", timeout=30000)
                    frame.locator("#mpResumoModal.modal-visible #mpResumoOkBtn:visible").click()
                    frame.locator("#viewMontagemPostes").wait_for(state="visible", timeout=15000)
                    rows = sql(f"""select status_montagem || '|' ||
                        coalesce(checklists #>> '{{__segunda_inspecao,resultado}}','')
                        from public.montagem_poste where id=
                        '{record_id}||{DATE}||Setor 1||{form}';""")
                    expected = "RR|APROVADO_RETRABALHADO" if result == "approved" else "R|SEGREGADO"
                    assert rows == expected, (rows, expected)
                    first_preserved = sql(f"""select count(*) from public.montagem_poste
                        where record_id='{record_id}' and etapa='HISTORICO_REPROVACAO'
                          and checklists #>> '{{checagem_inicial,homogeneidade_concreto}}'='nao';""")
                    assert int(first_preserved) >= 1, first_preserved
                    results.append({"viewport": f"{width}x{height}", "result": result,
                                    "choice_visible": True, "saved": rows,
                                    "entry": "report" if report_entry else "list",
                                    "first_inspection_preserved": True})
                    frame.locator("#mpCarregarLiberados").click()
                context.close()
            browser.close()
            print(json.dumps(results, ensure_ascii=False))
    finally:
        if created:
            sql("\n".join(
                f"delete from public.montagem_poste where record_id='{record_id}';\n"
                f"delete from public.producao where id='{record_id}';"
                for record_id, _, _, _ in posts) +
                f"\ndelete from public.usuarios where id='{login}';")


if __name__ == "__main__":
    main()
