"""Stage 2 regression in the isolated :18446 environment only."""

from __future__ import annotations

import json
from pathlib import Path
import subprocess
from playwright.sync_api import expect, sync_playwright

BASE = "https://concrefer.concretrack.com.br:18446"
DATABASE = "pcp_unificado_homolog_20261016"
DATE = "2099-10-17"
CAPTURE = Path("docs/maodeobra-mobile/etapa-2-desktop-homolog.png")


def credentials():
    raw = subprocess.check_output(
        ["ssh", "vps-staging", "cat", "/etc/mapa-unificado/pcp-auth-admin-probe.env"],
        text=True, encoding="utf-8",
    )
    return dict(line.split("=", 1) for line in raw.splitlines() if "=" in line)


def cleanup():
    sql = f"""BEGIN;
DELETE FROM maodeobra_rateio WHERE maodeobra_id IN (SELECT id FROM maodeobra WHERE data = '{DATE}');
DELETE FROM maodeobra WHERE data = '{DATE}';
DELETE FROM maodeobra_dias WHERE data = '{DATE}';
COMMIT;"""
    subprocess.run(
        ["ssh", "vps-staging", f"sudo -u postgres psql -X -v ON_ERROR_STOP=1 -d {DATABASE} -q"],
        input=sql, text=True, capture_output=True, check=True,
    )


def main():
    cleanup()
    account = credentials()
    result = {}
    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1440, "height": 900}, ignore_https_errors=True)
        page = context.new_page()
        page.goto(BASE + "/unificado/login.html?next=pcp/maodeobra/", wait_until="domcontentloaded")
        page.locator('#unificado-login-form [name="username"]').fill(account["PCP_TEST_USER"])
        page.locator('#unificado-login-form [name="password"]').fill(account["PCP_TEST_PASSWORD"])
        page.locator('#unificado-login-form button[type="submit"]').click()
        page.wait_for_url("**/unificado/?view=pcp%2Fmaodeobra%2F", timeout=20000)
        frame = page.frame_locator("#module-host iframe.is-active")
        frame.locator("#mdo-data").fill(DATE)
        expect(frame.locator("#tbody-mdo-grid .mdo-qtd")).to_have_count(7, timeout=15000)
        frame.locator('#tbody-mdo-grid .mdo-qtd[data-tipo="MOD"]').first.fill("12,5")
        frame.locator('#tbody-mdo-grid .mdo-qtd[data-tipo="MOI"]').first.fill("1")
        expect(frame.locator("#mdo-total")).to_have_text("13,5")
        frame.locator("#btn-salvar-lote").click()
        expect(frame.locator("#mdo-dia-estado")).to_contain_text("salvo", timeout=15000)
        day = frame.locator("body").evaluate(
            "async (_, d) => API.get(`/api/maodeobra/dia?data=${d}&grupo_setor=12`)", DATE)
        assert day["salvo_em"] and day["salvo_por"]["id"] and day["salvo_por"]["nome"]
        assert day["data"] == DATE and day["grupo_setor"] == "12" and day["motivo"] is None
        result["desktop_save"] = True
        CAPTURE.parent.mkdir(parents=True, exist_ok=True)
        page.screenshot(path=str(CAPTURE), full_page=True)

        frame.locator('#tbody-mdo-grid .mdo-qtd[data-tipo="MOD"]').first.fill("10,5")
        frame.locator("#btn-salvar-lote").click()
        expect(frame.locator("#mdo-total")).to_have_text("11,5", timeout=15000)
        day = frame.locator("body").evaluate(
            "async (_, d) => API.get(`/api/maodeobra/dia?data=${d}&grupo_setor=12`)", DATE)
        assert sum(float(item["quantidade_pessoas"]) for item in day["itens"]) == 11.5
        result["desktop_resend"] = True

        page.on("dialog", lambda dialog: dialog.accept())
        frame.locator("#btn-sem-producao").click()
        expect(frame.locator("#mdo-dia-estado")).to_contain_text("Sem produção", timeout=15000)
        day = frame.locator("body").evaluate(
            "async (_, d) => API.get(`/api/maodeobra/dia?data=${d}&grupo_setor=12`)", DATE)
        assert day["sem_producao"] and all(float(item["quantidade_pessoas"]) == 0 for item in day["itens"])
        result["desktop_sem_producao"] = True

        server_checks = frame.locator("body").evaluate("""async (_, date) => {
          const activities = await API.get('/api/atividades-maodeobra?grupo_setor=12&ativo=true');
          const zero = activities.map(item => ({atividade_id:item.id,quantidade_pessoas:0}));
          const saved = await API.post('/api/maodeobra/grupo',
            {data:date,grupo_setor:'12',sem_producao:true,motivo:'Chuva',itens:zero});
          const withReason = await API.get(`/api/maodeobra/dia?data=${date}&grupo_setor=12`);
          let invalidHalf = false;
          try { await API.post('/api/maodeobra/grupo',
            {data:date,grupo_setor:'12',sem_producao:false,
             itens:zero.map((item,index) => ({...item,quantidade_pessoas:index ? 0 : 1.25}))}); }
          catch (_) { invalidHalf = true; }
          const production = await API.post('/api/maodeobra/grupo',
            {data:date,grupo_setor:'12',sem_producao:false,itens:zero});
          const cleared = await API.get(`/api/maodeobra/dia?data=${date}&grupo_setor=12`);
          let invalidPeriod = false;
          try { await API.get('/api/maodeobra/resumo?data_inicio=2099-10-01&data_fim=2099-11-01'); }
          catch (_) { invalidPeriod = true; }
          return {saved,withReason,invalidHalf,production,cleared,invalidPeriod};
        }""", DATE)
        assert server_checks["saved"]["motivo"] == "Chuva"
        assert server_checks["withReason"]["motivo"] == "Chuva"
        assert server_checks["invalidHalf"] and server_checks["invalidPeriod"]
        assert server_checks["production"]["motivo"] is None
        assert server_checks["cleared"]["motivo"] is None
        result["reason_clear_validation_limit"] = True

        statuses = frame.locator("body").evaluate("""async (_, date) => {
          const activities = await API.get('/api/atividades-maodeobra?grupo_setor=12&ativo=true');
          const itens = activities.map((item,index) =>
            ({atividade_id:item.id,quantidade_pessoas:index ? 0 : 1.25}));
          const headers = {'Content-Type':'application/json',
            'Authorization':`Bearer ${API.getToken()}`,'X-Unificado-Screen':'maodeobra'};
          const half = await fetch('/unificado/pcp/api/maodeobra/grupo',
            {method:'POST',headers,body:JSON.stringify({data:date,grupo_setor:'12',itens})});
          const period = await fetch('/unificado/pcp/api/maodeobra/resumo?data_inicio=2099-10-01&data_fim=2099-11-01',
            {headers});
          return {half:half.status,period:period.status};
        }""", DATE)
        assert statuses == {"half": 422, "period": 400}, statuses
        result["http_validation"] = statuses

        summary = frame.locator("body").evaluate(
            "async (_, d) => API.get(`/api/maodeobra/resumo?data_inicio=${d}&data_fim=${d}`)", DATE)
        groups = summary["dias"][0]["grupos"]
        assert groups[0]["lancado"] and not groups[0]["sem_producao"] and groups[0]["total"] == 0
        assert not groups[1]["lancado"]
        result["summary"] = True
        browser.close()
    cleanup()
    print(json.dumps(result, ensure_ascii=False))


if __name__ == "__main__":
    main()
