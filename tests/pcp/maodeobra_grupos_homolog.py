"""Check the unified labour entry in the isolated homolog environment."""

from __future__ import annotations

import json
import os
from pathlib import Path
import subprocess

from playwright.sync_api import expect, sync_playwright


BASE = os.environ.get("UNIFICADO_BASE_URL", "https://concrefer.concretrack.com.br:18446")
DATABASE = os.environ.get("MAODEOBRA_TEST_DATABASE", "pcp_unificado_homolog_20261016")
DATE = "2099-03-04"
ZERO_DATE = "2099-03-05"
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
CAPTURES = Path(os.environ.get("MAODEOBRA_TEST_CAPTURES", "docs/porting/maodeobra-grupos"))


def credentials() -> dict[str, str]:
    raw = subprocess.check_output(
        ["ssh", "vps-concrefer", "cat", "/etc/mapa-unificado/pcp-auth-admin-probe.env"],
        text=True, encoding="utf-8",
    )
    return dict(line.split("=", 1) for line in raw.splitlines() if "=" in line)


def cleanup() -> None:
    sql = f"""
    BEGIN;
    DELETE FROM maodeobra_rateio WHERE maodeobra_id IN
      (SELECT id FROM maodeobra WHERE data IN ('{DATE}', '{ZERO_DATE}'));
    DELETE FROM maodeobra WHERE data IN ('{DATE}', '{ZERO_DATE}');
    DELETE FROM maodeobra_dias WHERE data IN ('{DATE}', '{ZERO_DATE}');
    DELETE FROM atividades_mao_de_obra
      WHERE grupo_setor = '34' AND descricao IN ('Atividade de teste MO', 'Atividade de teste editada');
    COMMIT;
    """
    subprocess.run(
        ["ssh", "vps-concrefer", f"sudo -u postgres psql -v ON_ERROR_STOP=1 -d {DATABASE} -q"],
        input=sql, text=True, capture_output=True, check=True,
    )


def main() -> None:
    account = credentials()
    CAPTURES.mkdir(parents=True, exist_ok=True)
    errors: list[str] = []
    results: dict[str, object] = {}
    cleanup()
    try:
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(headless=True, executable_path=CHROME)
            context = browser.new_context(viewport={"width": 1440, "height": 900}, service_workers="block")
            page = context.new_page()
            page.on("pageerror", lambda error: errors.append(str(error)[:160]))
            api_responses = []
            page.on("response", lambda response: api_responses.append((response.url.split('?')[0], response.status))
                    if '/api/maodeobra' in response.url or '/api/atividades-maodeobra' in response.url else None)
            page.goto(BASE + "/unificado/login.html?next=pcp/maodeobra/", wait_until="domcontentloaded")
            page.locator('#unificado-login-form [name="username"]').fill(account["PCP_TEST_USER"])
            page.locator('#unificado-login-form [name="password"]').fill(account["PCP_TEST_PASSWORD"])
            page.locator('#unificado-login-form button[type="submit"]').click()
            page.wait_for_url("**/unificado/?view=pcp%2Fmaodeobra%2F", timeout=20000)
            frame = page.frame_locator("#module-host iframe.is-active")
            try:
                frame.locator("#mdo-data").wait_for(timeout=8000)
            except Exception:
                print(json.dumps({
                    "url": page.url,
                    "frames": [item.url for item in page.frames],
                    "body": page.locator("body").inner_text()[:600],
                }, ensure_ascii=False))
                page.screenshot(path=str(CAPTURES / "debug-shell.png"))
                raise

            frame.locator("#mdo-data").fill(DATE)
            try:
                expect(frame.locator('#tbody-mdo-grid .mdo-qtd')).to_have_count(7, timeout=10000)
            except Exception:
                print(json.dumps({"estado": frame.locator('#mdo-dia-estado').inner_text(),
                                  "tabela": frame.locator('#tbody-mdo-grid').inner_text(),
                                  "toast": frame.locator('#toast-container').inner_text(),
                                  "api": api_responses[-10:], "errors": errors}, ensure_ascii=False))
                raise
            frame.locator('#tbody-mdo-grid .mdo-qtd[data-tipo="MOD"]').first.fill("12,5")
            frame.locator('#tbody-mdo-grid .mdo-qtd[data-tipo="MOI"]').first.fill("1")
            expect(frame.locator("#mdo-subtotal-mod")).to_have_text("12,5")
            expect(frame.locator("#mdo-subtotal-moi")).to_have_text("1")
            expect(frame.locator("#mdo-total")).to_have_text("13,5")
            frame.locator("#btn-salvar-lote").click()
            expect(frame.locator("#toast-container")).to_contain_text("Lançamentos salvos.", timeout=15000)
            rows = frame.locator("body").evaluate("async (element,date) => await API.get(`/api/maodeobra?data_inicio=${date}&data_fim=${date}`)", DATE)
            assert len(rows) == 7
            assert sum(float(row["quantidade_pessoas"]) for row in rows) == 13.5

            page.reload(wait_until="domcontentloaded")
            frame.locator("#mdo-data").fill(DATE)
            expect(frame.locator("#mdo-total")).to_have_text("13,5", timeout=15000)
            frame.locator('#tbody-mdo-grid .mdo-qtd[data-tipo="MOD"]').first.fill("10,5")
            frame.locator("#btn-salvar-lote").click()
            expect(frame.locator("#mdo-total")).to_have_text("11,5", timeout=15000)
            rows = frame.locator("body").evaluate("async (element,date) => await API.get(`/api/maodeobra?data_inicio=${date}&data_fim=${date}`)", DATE)
            assert len(rows) == 7 and sum(float(row["quantidade_pessoas"]) for row in rows) == 11.5
            results["s12_upsert"] = True

            # Os dois endpoints antigos também precisam respeitar (data, atividade).
            moi_id = int(frame.locator('.mdo-qtd[data-tipo="MOI"]').first.get_attribute("data-atividade-id"))
            moi_row = next(row for row in rows if row["atividade_id"] == moi_id)
            for _ in range(2):
                direct = frame.locator("body").evaluate(
                    "async (element,payload) => await API.post('/api/maodeobra',payload)",
                    {"data": DATE, "atividade_id": moi_id, "setor_id": None, "quantidade_pessoas": 1},
                )
                assert direct["id"] == moi_row["id"]
                rateio = frame.locator("body").evaluate(
                    "async (element,payload) => await API.post('/api/maodeobra-com-rateio',payload)",
                    {"data": DATE, "atividade_id": moi_id, "quantidade_pessoas": 1,
                     "rateio": [{"setor_id": 1, "quantidade_rateada": 1},
                                {"setor_id": 2, "quantidade_rateada": 0}]},
                )
                assert rateio["id"] == moi_row["id"] and len(rateio["rateios"]) == 2
            results["legacy_upsert"] = True

            frame.locator("label[for='mdo-grupo-34']").click()
            expect(frame.locator('#tbody-mdo-grid .mdo-qtd')).to_have_count(9, timeout=15000)
            frame.locator('#tbody-mdo-grid .mdo-qtd[data-tipo="MOD"]').first.fill("2,5")
            frame.locator('#tbody-mdo-grid .mdo-qtd[data-tipo="MOI"]').first.fill("1")
            expect(frame.locator("#mdo-total")).to_have_text("3,5")
            frame.locator("#btn-salvar-lote").click()
            expect(frame.locator("#mdo-dia-estado")).to_contain_text("salvo", timeout=15000)
            rows = frame.locator("body").evaluate("async (element,date) => await API.get(`/api/maodeobra?data_inicio=${date}&data_fim=${date}`)", DATE)
            assert len(rows) == 16 and sum(float(row["quantidade_pessoas"]) for row in rows) == 15
            results["s34_same_day"] = True

            frame.locator("#mdo-data").fill(ZERO_DATE)
            expect(frame.locator("#mdo-dia-estado")).to_contain_text("Ainda não lançado", timeout=15000)
            frame.locator("#btn-sem-producao").click()
            expect(frame.locator("#mdo-dia-estado")).to_contain_text("Sem produção", timeout=15000)
            results["zero_day"] = True

            page.set_viewport_size({"width": 390, "height": 844})
            frame.locator("#mdo-data").fill(DATE)
            expect(frame.locator("#mdo-total")).to_have_text("3,5", timeout=15000)
            results["mobile_no_horizontal_scroll"] = frame.locator(".section-card").first.evaluate(
                "element => element.scrollWidth <= element.clientWidth"
            )
            assert results["mobile_no_horizontal_scroll"]

            page.set_viewport_size({"width": 1440, "height": 900})
            frame.locator("#mdo-cadastro summary").click()
            frame.locator("#cad-nome").fill("Atividade de teste MO")
            frame.locator("#cad-tipo").select_option("MOI")
            frame.locator("#cad-ordem").fill("99")
            frame.locator("#cad-responsavel").fill("Pessoa de teste")
            frame.locator("#cad-fator").fill("0,50")
            frame.locator("#cad-salvar").click()
            expect(frame.locator('#tbody-mdo-grid .mdo-qtd')).to_have_count(10, timeout=15000)
            item = frame.locator(".mdo-cadastro-item").filter(has_text="Atividade de teste MO")
            item.get_by_role("button", name="Editar").click()
            frame.locator("#cad-nome").fill("Atividade de teste editada")
            frame.locator("#cad-salvar").click()
            expect(frame.locator("#cad-lista")).to_contain_text("Atividade de teste editada", timeout=15000)
            page.on("dialog", lambda dialog: dialog.accept())
            item = frame.locator(".mdo-cadastro-item").filter(has_text="Atividade de teste editada")
            item.get_by_role("button", name="Desativar").click()
            expect(frame.locator('#tbody-mdo-grid .mdo-qtd')).to_have_count(9, timeout=15000)
            results["cadastro_incluir_editar_desativar"] = True
            assert not errors, errors
            results["page_errors"] = 0
            context.close()

            for viewport, mobile in [({"width": 1440, "height": 1200}, False), ({"width": 390, "height": 844}, True)]:
                capture_context = browser.new_context(viewport=viewport, service_workers="block")
                capture_page = capture_context.new_page()
                capture_page.goto(BASE + "/unificado/login.html?next=pcp/maodeobra/", wait_until="domcontentloaded")
                capture_page.locator('#unificado-login-form [name="username"]').fill(account["PCP_TEST_USER"])
                capture_page.locator('#unificado-login-form [name="password"]').fill(account["PCP_TEST_PASSWORD"])
                capture_page.locator('#unificado-login-form button[type="submit"]').click()
                capture_page.wait_for_url("**/unificado/?view=pcp%2Fmaodeobra%2F", timeout=20000)
                capture_frame = capture_page.frame_locator("#module-host iframe.is-active")
                capture_frame.locator("#mdo-data").fill(DATE)
                expect(capture_frame.locator("#mdo-total")).to_have_text("11,5", timeout=15000)
                if not mobile:
                    capture_frame.locator('#tbody-mdo-grid .mdo-qtd[data-tipo="MOD"]').first.fill("12,5")
                    expect(capture_frame.locator("#mdo-total")).to_have_text("13,5")
                    capture_frame.locator(".section-card").first.screenshot(path=str(CAPTURES / "s12-desktop.png"))
                capture_frame.locator("label[for='mdo-grupo-34']").click()
                expect(capture_frame.locator("#mdo-total")).to_have_text("3,5", timeout=15000)
                if mobile:
                    capture_page.screenshot(path=str(CAPTURES / "s34-celular-topo.png"))
                    capture_frame.locator("#mdo-total").scroll_into_view_if_needed()
                    capture_page.screenshot(path=str(CAPTURES / "s34-celular-total.png"))
                else:
                    capture_frame.locator(".section-card").first.screenshot(path=str(CAPTURES / "s34-desktop.png"))
                capture_context.close()
            browser.close()
    finally:
        cleanup()
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True, executable_path=CHROME)
        context = browser.new_context(viewport={"width": 1440, "height": 1600}, service_workers="block")
        page = context.new_page()
        page.goto(BASE + "/unificado/login.html?next=pcp/maodeobra/", wait_until="domcontentloaded")
        page.locator('#unificado-login-form [name="username"]').fill(account["PCP_TEST_USER"])
        page.locator('#unificado-login-form [name="password"]').fill(account["PCP_TEST_PASSWORD"])
        page.locator('#unificado-login-form button[type="submit"]').click()
        page.wait_for_url("**/unificado/?view=pcp%2Fmaodeobra%2F", timeout=20000)
        frame = page.frame_locator("#module-host iframe.is-active")
        frame.locator("#mdo-cadastro summary").click()
        frame.locator("#mdo-cadastro").screenshot(path=str(CAPTURES / "cadastro-desktop.png"))
        context.close()
        browser.close()
    print(json.dumps(results, ensure_ascii=False))


if __name__ == "__main__":
    main()
