"""Synthetic HTTPS check of client notice and concession approval."""
from __future__ import annotations

import json
from datetime import date, timedelta
from playwright.sync_api import sync_playwright
from qualidade_lote2_b5_live import API, BASE, CHROME, credentials, call, item


def main():
    account = credentials()
    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True, executable_path=CHROME)
        ctx = browser.new_context(service_workers="block")
        assert ctx.request.post(BASE + "/unificado/mapa/api/unified/login", data={
            "username": account["MAPA_TEST_USER"], "password": account["MAPA_TEST_PASSWORD"]}).status == 200
        assert ctx.request.post(BASE + "/unificado/mapa/api/unified/qualidade-bootstrap").status == 200
        identity = call(ctx, "get", "/contexto")
        company = identity["companies"][0]["id"]
        user = identity["user"]["id"]
        catalog = call(ctx, "get", f"/catalogos?company={company}&unit=pederneiras")
        area = item(catalog, "area", "SGQ")["id"]
        origin = catalog["origem"][0]["id"]
        kind = catalog["tipo"][0]["id"]
        minor = item(catalog, "gravidade", "MENOR")["id"]
        concession = item(catalog, "disposicao", "CONCESSAO")["id"]
        draft = call(ctx, "post", "/nc/rascunhos", {
            "empresa_id": company, "unidade_codigo": "pederneiras",
            "titulo": "Ensaio sintético B5 concessão e cliente",
            "descricao": "Prova sintética de aprovação e comunicação; preservar para limpeza autorizada.",
            "area_emissora_id": area, "setor_pcp_id": "S3", "origem_id": origin,
            "tipo_id": kind, "gravidade_id": minor, "cliente_afetado": True,
            "cliente_texto": "Cliente sintético B5"}, 201)
        nc = draft["id"]
        registered = call(ctx, "post", f"/nc/{nc}/registrar", {"data_deteccao": date.today().isoformat()})
        detail = call(ctx, "get", f"/nc/{nc}")
        assert detail["cliente_pendente"] is True
        assert any(e["tipo"] == "PENDENCIA_CLIENTE" for e in detail["nc_evento"])
        assert ctx.request.post(API + f"/nc/{nc}/confirmar-notificacao-cliente", data={"motivo": ""}).status == 422
        assert call(ctx, "post", f"/nc/{nc}/confirmar-notificacao-cliente", {
            "motivo": "Protocolo sintético B5"})["cliente_pendente"] is False
        assert call(ctx, "get", f"/nc/{nc}")["cliente_pendente"] is False
        call(ctx, "post", f"/nc/{nc}/triagem", {
            "origem_id": origin, "tipo_id": kind, "gravidade_id": minor,
            "area_responsavel_id": area, "responsavel_id": user,
            "prazo_final": (date.today() + timedelta(days=5)).isoformat()})
        assert ctx.request.post(API + f"/nc/{nc}/contencoes", data={
            "disposicao_id": concession, "descricao": "Concessão sintética"}).status == 422
        containment = call(ctx, "post", f"/nc/{nc}/contencoes", {
            "disposicao_id": concession, "descricao": "Concessão sintética",
            "aprovador_id": user}, 201)["id"]
        before = ctx.request.post(API + f"/nc/{nc}/concluir-contencao")
        print(json.dumps({"phase": "before_approval", "status": before.status,
                          "nc": nc, "number": registered["numero"], "containment": containment},
                         ensure_ascii=False))
        if before.status == 409:
            assert call(ctx, "post", f"/nc/{nc}/contencoes/{containment}/aprovar-concessao")["aprovada"]
            assert call(ctx, "post", f"/nc/{nc}/concluir-contencao")["status"] == "ANALISE_CAUSA"
        else:
            assert before.status == 200, before.text()[:300]
            assert call(ctx, "post", f"/nc/{nc}/contencoes/{containment}/aprovar-concessao")["aprovada"]
        detail = call(ctx, "get", f"/nc/{nc}")
        assert detail["nc_contencao"][0]["concessao_aprovada_por"] == user
        assert any(e["tipo"] == "CONCESSAO_APROVADA" for e in detail["nc_evento"])
        print(json.dumps({"b5_concession_client": "PASS" if before.status == 409 else "APPROVAL_GATE_MISSING",
                          "nc": nc, "number": registered["numero"],
                          "events": len(detail["nc_evento"]), "retained": True}, ensure_ascii=False))
        ctx.close()
        browser.close()


if __name__ == "__main__":
    main()
