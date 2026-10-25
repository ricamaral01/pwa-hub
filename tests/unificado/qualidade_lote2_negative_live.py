"""Live denied actions and business-rule checks using synthetic accounts."""
from __future__ import annotations

import json
import subprocess
from datetime import date, timedelta

from playwright.sync_api import sync_playwright

from qualidade_lote2_b5_live import API, BASE, CHROME, credentials

DENIED_FILE = "/etc/mapa-unificado/pcp-quality-e2e-probe.env"
MAJOR_CLOSED = "4b2c6f6f-34a4-4672-a88b-3ae8cddca71d"
MOBILE_TRIAGED = "b6e8ea38-f6e3-403d-be56-15343fa1e2f1"


def read_denied():
    raw = subprocess.check_output(["ssh", "vps-staging", "cat", DENIED_FILE], text=True, encoding="utf-8")
    return dict(line.split("=", 1) for line in raw.splitlines() if "=" in line)


def assert_status(context, method, path, payload, wanted):
    result = getattr(context.request, method)(API + path, data=payload)
    assert result.status == wanted, (method, path, result.status, result.text()[:300])
    return wanted


def main():
    results = {}
    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True, executable_path=CHROME)
        full = browser.new_context(service_workers="block")
        c = credentials()
        assert full.request.post(BASE + "/unificado/mapa/api/unified/login",
            data={"username": c["MAPA_TEST_USER"], "password": c["MAPA_TEST_PASSWORD"]}).status == 200
        assert full.request.post(BASE + "/unificado/mapa/api/unified/qualidade-bootstrap").status == 200
        context = full.request.get(API + "/contexto").json()
        company = context["companies"][0]["id"]
        results["invalid_state_close"] = assert_status(full, "post", f"/nc/{MOBILE_TRIAGED}/encerrar", None, 422)
        results["invalid_state_triage"] = assert_status(full, "post", f"/nc/{MAJOR_CLOSED}/triagem", {
            "gravidade_id": "00000000-0000-4000-8000-000000000001", "tipo_id": "00000000-0000-4000-8000-000000000001",
            "area_responsavel_id": "00000000-0000-4000-8000-000000000001", "responsavel_id": "x",
            "prazo_final": (date.today() + timedelta(days=1)).isoformat()}, 404)
        bad = assert_status(full, "post", "/nc/rascunhos", {
            "empresa_id": company, "unidade_codigo": "pederneiras", "descricao": "Falta local no ensaio sintético"}, 201)
        # The draft remains for the synthetic-data inventory; it uses no official number.
        drafts = full.request.get(API + f"/nc?company={company}&status=RASCUNHO").json()["items"]
        draft_id = next(x["id"] for x in drafts if x["descricao"] == "Falta local no ensaio sintético")
        results["mobile_missing_location"] = assert_status(full, "post", f"/nc/{draft_id}/registrar", {"mobile": True}, 422)

        denied = browser.new_context(service_workers="block")
        d = read_denied()
        login = denied.request.post(BASE + "/unificado/mapa/api/unified/login", data={
            "username": d["PCP_TEST_USER"], "password": d["PCP_TEST_PASSWORD"]})
        assert login.status == 200
        assert denied.request.post(BASE + "/unificado/mapa/api/unified/qualidade-bootstrap").status == 200
        results["no_action_draft"] = assert_status(denied, "post", "/nc/rascunhos", {
            "empresa_id": company, "unidade_codigo": "pederneiras", "descricao": "Negado"}, 403)
        results["no_action_triage"] = assert_status(denied, "post", f"/nc/{MOBILE_TRIAGED}/triagem", {}, 403)
        results["no_action_treat"] = assert_status(denied, "post", f"/nc/{MOBILE_TRIAGED}/contencoes", {}, 403)
        results["no_action_approve"] = assert_status(denied, "post", f"/nc/{MOBILE_TRIAGED}/contencoes/00000000-0000-4000-8000-000000000001/aprovar-concessao", None, 403)
        results["no_action_efficacy"] = assert_status(denied, "post", f"/nc/{MOBILE_TRIAGED}/eficacia", {}, 403)
        results["no_action_close"] = assert_status(denied, "post", f"/nc/{MOBILE_TRIAGED}/encerrar", None, 403)
        results["no_action_cadastros"] = assert_status(denied, "post", "/cadastros/origem", {}, 403)
        results["other_nc_hidden"] = assert_status(denied, "get", f"/nc/{MOBILE_TRIAGED}", None, 404)
        unauth = browser.new_context()
        results["unauth_context"] = assert_status(unauth, "get", "/contexto", None, 401)
        print(json.dumps({"b5_negative": "PASS", "results": results,
                          "draft_without_number": draft_id, "retained": True}))
        unauth.close()
        denied.close()
        full.close()
        browser.close()


if __name__ == "__main__":
    main()
