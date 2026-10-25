"""Four retained synthetic NC lifecycle cases through the production HTTPS gateway.

Uses only synthetic credentials kept in root-only destination files. No cleanup.
"""
from __future__ import annotations

import json
import subprocess
from datetime import date, timedelta

from playwright.sync_api import sync_playwright

BASE = "https://concrefer.concretrack.com.br"
API = BASE + "/unificado/qualidade/api"
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
CREDS = "/etc/mapa-unificado/quality-auth-probe.env"


def credentials():
    raw = subprocess.check_output(["ssh", "vps-staging", "cat", CREDS], text=True, encoding="utf-8")
    return dict(line.split("=", 1) for line in raw.splitlines() if "=" in line)


def call(ctx, method, path, payload=None, expected=200):
    result = getattr(ctx.request, method.lower())(API + path, data=payload)
    assert result.status == expected, (method, path, result.status, result.text()[:500])
    return result.json() if result.headers.get("content-type", "").startswith("application/json") else result


def item(catalog, kind, code):
    return next(x for x in catalog[kind] if x["codigo"] == code)


def main():
    account = credentials()
    cases = []
    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True, executable_path=CHROME)
        ctx = browser.new_context(service_workers="block", viewport={"width": 390, "height": 844})
        login = ctx.request.post(BASE + "/unificado/mapa/api/unified/login",
                                 data={"username": account["MAPA_TEST_USER"], "password": account["MAPA_TEST_PASSWORD"]})
        assert login.status == 200, login.status
        bootstrap = ctx.request.post(BASE + "/unificado/mapa/api/unified/qualidade-bootstrap")
        assert bootstrap.status == 200, bootstrap.status
        identity = call(ctx, "get", "/contexto")
        assert len(identity["user"]["actions"]) == 9
        company = identity["companies"][0]["id"]
        user = identity["user"]["id"]
        catalogs = call(ctx, "get", f"/catalogos?company={company}&unit=pederneiras")
        area = item(catalogs, "area", "SGQ")["id"]
        origin = catalogs["origem"][0]["id"]
        kind = catalogs["tipo"][0]["id"]
        disposition = next(x for x in catalogs["disposicao"] if x["codigo"] != "CONCESSAO")["id"]
        major = item(catalogs, "gravidade", "MAIOR")["id"]
        minor = item(catalogs, "gravidade", "MENOR")["id"]
        deadline = (date.today() + timedelta(days=5)).isoformat()

        def begin(label, mobile, gravity):
            draft = call(ctx, "post", "/nc/rascunhos", {
                "empresa_id": company, "unidade_codigo": "pederneiras",
                "titulo": "" if mobile else f"Ensaio sintético B5 {label}",
                "descricao": f"Ensaio sintético B5 {label}; preservar até limpeza aprovada.",
                "area_emissora_id": area, "setor_pcp_id": "S3",
                "origem_id": None if mobile else origin,
                "tipo_id": None if mobile else kind,
                "gravidade_id": None if mobile else gravity,
            }, 201)
            assert draft["numero"] is None and draft["status"] == "RASCUNHO"
            nc = draft["id"]
            # Invalid mobile classification is deferred to triage; registration is atomic.
            reg = call(ctx, "post", f"/nc/{nc}/registrar", {"mobile": mobile,
                "data_deteccao": None if mobile else date.today().isoformat()})
            assert reg["numero"].startswith("NC-2026-") and reg["status"] == "REGISTRADA"
            return nc, reg["numero"]

        def triage(nc, gravity):
            return call(ctx, "post", f"/nc/{nc}/triagem", {
                "origem_id": origin, "tipo_id": kind, "gravidade_id": gravity,
                "area_responsavel_id": area, "responsavel_id": user,
                "prazo_final": deadline})

        def containment(nc):
            created = call(ctx, "post", f"/nc/{nc}/contencoes", {
                "disposicao_id": disposition, "descricao": "Peça segregada no ensaio sintético."}, 201)
            assert created["id"]
            return call(ctx, "post", f"/nc/{nc}/concluir-contencao")

        def cause_and_plan(nc, suffix):
            call(ctx, "put", f"/nc/{nc}/causa", {
                "metodo": "5_PORQUES", "problema": "Desvio sintético", "causa_raiz": "Falha no procedimento de teste",
                "pode_ocorrer_outro_local": False, "porques": ["Procedimento não seguido"]})
            call(ctx, "post", f"/nc/{nc}/concluir-causa")
            action = call(ctx, "post", f"/nc/{nc}/acoes", {
                "tipo": "CORRETIVA", "o_que": "Revisar instrução sintética " + suffix,
                "quem_id": "executor-sintetico", "quando": deadline}, 201)
            call(ctx, "post", f"/nc/{nc}/acoes/{action['id']}/concluir", {"evidencia": "Concluída no ensaio"})
            call(ctx, "post", f"/nc/{nc}/concluir-plano")

        def prepare_and_close(nc):
            call(ctx, "put", f"/nc/{nc}/encerramento", {
                "atualizar_riscos": False, "justificativa_riscos": "Risco inalterado no ensaio",
                "revisar_documento": False, "justificativa_documento": "Documento inalterado no ensaio",
                "conclusao": "Ensaio concluído"})
            return call(ctx, "post", f"/nc/{nc}/encerrar")

        # Case 1: Major, corrective action, effective check, closure.
        nc, number = begin("Maior eficaz", False, major)
        triage(nc, major)
        containment(nc)
        cause_and_plan(nc, "1")
        call(ctx, "post", f"/nc/{nc}/eficacia", {"criterio": "Sem reincidência", "resultado": "EFICAZ"})
        assert prepare_and_close(nc)["status"] == "ENCERRADA"
        pdf = ctx.request.get(API + f"/nc/{nc}/pdf")
        assert pdf.status == 200 and pdf.body().startswith(b"%PDF-")
        cases.append({"case": "maior_eficaz", "id": nc, "number": number})

        # Case 2: Major, ineffective round, reopen to cause, effective second round.
        nc, number = begin("Maior reabertura", False, major)
        triage(nc, major)
        containment(nc)
        cause_and_plan(nc, "2A")
        ineffective = call(ctx, "post", f"/nc/{nc}/eficacia", {
            "criterio": "Persistiu falha", "resultado": "NAO_EFICAZ"})
        assert ineffective["status"] == "ANALISE_CAUSA" and ineffective["rodada"] == 1
        cause_and_plan(nc, "2B")
        effective = call(ctx, "post", f"/nc/{nc}/eficacia", {
            "criterio": "Sem nova falha", "resultado": "EFICAZ"})
        assert effective["rodada"] == 2
        assert prepare_and_close(nc)["status"] == "ENCERRADA"
        cases.append({"case": "maior_ineficaz_reaberta", "id": nc, "number": number})

        # Case 3: Minor with correction and justified skip of corrective action.
        nc, number = begin("Menor correção", False, minor)
        triage(nc, minor)
        call(ctx, "post", f"/nc/{nc}/contencoes", {
            "disposicao_id": disposition, "descricao": "Correção imediata executada"}, 201)
        skip = call(ctx, "post", f"/nc/{nc}/dispensar-corretiva", {
            "motivo": "Ocorrência pontual sem reincidência"})
        assert skip["status"] == "ENCERRAMENTO"
        assert prepare_and_close(nc)["status"] == "ENCERRADA"
        cases.append({"case": "menor_correcao", "id": nc, "number": number})

        # Case 4: mobile minimum, classification and assignment at triage.
        page = ctx.new_page()
        page.goto(BASE + "/unificado/qualidade/", wait_until="domcontentloaded")
        assert page.viewport_size["width"] == 390
        nc, number = begin("Celular triagem", True, minor)
        assert triage(nc, minor)["status"] == "CONTENCAO"
        cases.append({"case": "celular_triagem", "id": nc, "number": number})

        for record in cases:
            detail = call(ctx, "get", "/nc/" + record["id"])
            record["status"] = detail["nc"]["status"]
            record["eventos"] = len(detail["nc_evento"])
            assert record["eventos"] >= 3
        print(json.dumps({"b5": "PASS", "cases": cases, "retained": True}, ensure_ascii=False))
        ctx.close()
        browser.close()


if __name__ == "__main__":
    main()
