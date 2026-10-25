"""Quality FL-SGQ-07 test-environment smoke; never uses production cookies/data."""
from __future__ import annotations

import json
from pathlib import Path
import re
import urllib.error
import urllib.request

from homolog_session import test_cookie_for


BASE = "https://concrefer.concretrack.com.br:18446"
API = BASE + "/unificado/qualidade/api"


def call(path: str, *, method: str = "GET", data=None, cookie: str = ""):
    encoded = json.dumps(data, ensure_ascii=False).encode() if data is not None else None
    req = urllib.request.Request(
        BASE + path, data=encoded, method=method,
        headers={"Cookie": cookie, "Content-Type": "application/json", "Accept": "application/json"},
    )
    try:
        response = urllib.request.urlopen(req, timeout=20)
    except urllib.error.HTTPError as error:
        response = error
    body = response.read()
    return response.status, response.headers, body


def main():
    token = test_cookie_for("user-ricardo")
    map_cookie = f"mapa_unificado_homolog_session={token}"
    status, headers, body = call("/unificado/mapa/api/unified/qualidade-bootstrap",
                                 method="POST", cookie=map_cookie)
    assert status == 200, (status, body[:300])
    quality_cookie = next((value for value in headers.get_all("Set-Cookie", [])
                           if value.startswith("unificado_homolog_qualidade_session=")), "")
    assert quality_cookie, "Quality bootstrap did not set its isolated cookie"
    quality_cookie = quality_cookie.split(";", 1)[0]
    status, _, body = call("/unificado/qualidade/api/contexto", cookie=quality_cookie)
    assert status == 200
    context = json.loads(body)
    company = context["companies"][0]["id"]
    unit = "campinas"

    def quality(path, *, method="GET", data=None, expected=(200,)):
        code, _, payload = call("/unificado/qualidade/api" + path,
                                method=method, data=data, cookie=quality_cookie)
        assert code in expected, (method, path, code, payload[:500])
        return json.loads(payload) if payload and payload[:1] in (b"{", b"[") else payload

    def catalogs():
        return quality(f"/catalogos?company={company}&unit={unit}")

    catalog = catalogs()
    for name, code, label in (("local", "RECEBIMENTO", "Recebimento"),
                              ("atividade", "INSPECAO_RECEBIMENTO", "Inspeção de recebimento")):
        if not any(item["codigo"] == code for item in catalog[name]):
            quality(f"/cadastros/{name}", method="POST", expected=(201,), data={
                "empresa_id": company, "unidade_codigo": unit,
                "codigo": code, "nome": label})
    catalog = catalogs()
    item = lambda name, code: next(row["id"] for row in catalog[name] if row["codigo"] == code)
    origin = item("origem", "FORNECEDOR")
    area = item("area", "SGQ")
    local = item("local", "RECEBIMENTO")
    activity = item("atividade", "INSPECAO_RECEBIMENTO")

    listed = quality(f"/nc?company={company}&unit={unit}&limit=200")["items"]
    old = [row for row in listed if row["legado"]]
    assert len(old) == 3, len(old)
    for row in old:
        assert re.fullmatch(r"RNC-2026-\d{6}", row["numero"]), row["numero"]
        detail = quality("/nc/" + row["id"])
        rename = [e for e in detail["nc_evento"] if e["tipo"] == "NUMERO_RENOMEADO"]
        assert len(rename) == 1 and "NC-2026-000" in rename[0]["descricao"]

    title = "FL-SGQ-07 - EMBU - pedra britada 1/2 contaminada"
    existing = next((row for row in listed if row["titulo"] == title), None)
    if existing:
        rnc_id = existing["id"]
        number = existing["numero"]
    else:
        draft = quality("/nc/rascunhos", method="POST", expected=(201,), data={
            "empresa_id": company, "unidade_codigo": unit,
            "titulo": title,
            "descricao": "Pedra britada de 1/2 contaminada com pedaços de madeira.",
            "origem_id": origin, "area_emissora_id": area,
            "local_id": local, "atividade_id": activity,
            "processo_texto": "Recebimento", "emitente_nome": "Alex",
            "data_emissao": "2023-07-13", "identificacao_texto": "EMBU",
            "evidencias_texto": "Material recebido com as NFe:\n180866 de 05/Jul; 180780 de 05/Jul; 180978 de 06/Jul e 181082 de 06/Jul.",
            "data_deteccao": "2026-10-16T12:00:00Z",
            "data_ocorrencia": "2023-07-13T12:00:00Z",
        })
        rnc_id = draft["id"]
        registration = quality(f"/nc/{rnc_id}/registrar", method="POST", data={"mobile": False})
        number = registration["numero"]
    assert re.fullmatch(r"RNC-2026-\d{6}", number), number
    detail = quality(f"/nc/{rnc_id}")
    assert detail["nc"]["identificacao_texto"] == "EMBU"
    invalid, _, _ = call(f"/unificado/qualidade/api/nc/{rnc_id}/formulario",
                         method="PATCH", data={"descricao": " "}, cookie=quality_cookie)
    assert invalid == 422, invalid
    evidence = "Material recebido com as NFe:\n180866 de 05/Jul; 180780 de 05/Jul; 180978 de 06/Jul e 181082 de 06/Jul."
    if detail["nc"]["evidencias_texto"] != evidence:
        quality(f"/nc/{rnc_id}/formulario", method="PATCH", data={"evidencias_texto": evidence})
    code, headers, pdf = call(f"/unificado/qualidade/api/nc/{rnc_id}/pdf", cookie=quality_cookie)
    assert code == 200 and pdf.startswith(b"%PDF-"), (code, pdf[:100])
    assert "RNC - Eletr" in headers.get("Content-Disposition", "")
    output = Path("output/pdf/RNC-FL-SGQ-07_EMBU_moderno_aprovacao.pdf")
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_bytes(pdf)

    flow_title = "FL-SGQ-07 - ensaio de eficácia não eficaz"
    flow_existing = next((row for row in listed if row["titulo"] == flow_title), None)
    if flow_existing:
        flow_id = flow_existing["id"]
    else:
        flow_draft = quality("/nc/rascunhos", method="POST", expected=(201,), data={
            "empresa_id": company, "unidade_codigo": unit,
            "titulo": flow_title, "descricao": "Ação corretiva de teste; verificar abertura de nova RNC.",
            "origem_id": origin, "area_emissora_id": area,
            "local_id": local, "atividade_id": activity,
            "data_deteccao": "2026-10-16T12:00:00Z"})
        flow_id = flow_draft["id"]
    state = quality(f"/nc/{flow_id}")["nc"]["status"]
    if state == "RASCUNHO":
        quality(f"/nc/{flow_id}/registrar", method="POST", data={"mobile": False})
        state = "REGISTRADA"
    if state == "REGISTRADA":
        quality(f"/nc/{flow_id}/formulario", method="PATCH", data={
            "envolvidos_funcoes": "Equipe de recebimento", "sistematica_adequada": False,
            "sistematica_seguida": False, "poka_yoke_possivel": True,
            "alterar_documentos": True, "documentos_alterar_texto": "Instrução de inspeção de agregados"})
        quality(f"/nc/{flow_id}/triagem", method="POST", data={
            "origem_id": origin, "gravidade_id": item("gravidade", "MAIOR"),
            "tipo_id": item("tipo", "PRODUTO"), "area_responsavel_id": area,
            "responsavel_id": "user-ricardo", "prazo_final": "2026-10-20"})
        state = "CONTENCAO"
    if state == "CONTENCAO":
        quality(f"/nc/{flow_id}/contencoes", method="POST", expected=(201,), data={
            "disposicao_id": item("disposicao", "SEGREGAR_BLOQUEAR"),
            "descricao": "Segregar o lote e bloquear o recebimento.",
            "responsavel_texto": "Equipe de recebimento", "prazo": "2026-10-17"})
        quality(f"/nc/{flow_id}/concluir-contencao", method="POST")
        state = "ANALISE_CAUSA"
    if state == "ANALISE_CAUSA":
        quality(f"/nc/{flow_id}/causa", method="PUT", data={
            "metodo": "5_PORQUES", "problema": "Contaminação do agregado",
            "causa_raiz": "Falha na inspeção de recebimento.",
            "pode_ocorrer_outro_local": False,
            "porques": ["Inspeção não identificou madeira", "Amostragem insuficiente"]})
        quality(f"/nc/{flow_id}/concluir-causa", method="POST")
        state = "PLANO_ACAO"
    if state == "PLANO_ACAO":
        flow_detail = quality(f"/nc/{flow_id}")
        action = next((row for row in flow_detail["nc_acao"] if row["tipo"] == "CORRETIVA"), None)
        if not action:
            action = quality(f"/nc/{flow_id}/acoes", method="POST", expected=(201,), data={
                "tipo": "CORRETIVA", "o_que": "Revisar inspeção de recebimento",
                "quem_id": "executor-homolog", "quando": "2026-10-18"})
        quality(f"/nc/{flow_id}/acoes/{action['id']}/concluir", method="POST", data={
            "evidencia": "Procedimento de teste revisado"})
        quality(f"/nc/{flow_id}/concluir-plano", method="POST")
        state = "VERIFICACAO_EFICACIA"
    if state == "VERIFICACAO_EFICACIA":
        flow_detail = quality(f"/nc/{flow_id}")
        if not flow_detail["nc_eficacia_acompanhamento"]:
            quality(f"/nc/{flow_id}/eficacia/acompanhamento", method="POST", expected=(201,), data={
                "data": "2026-10-19", "evidencia": "Nova inspeção ainda encontrou material estranho."})
        result = quality(f"/nc/{flow_id}/eficacia", method="POST", data={
            "criterio": "Nenhuma contaminação em novo lote",
            "resultado": "NAO_EFICAZ", "notas": "Material estranho persistiu."})
        assert re.fullmatch(r"RNC-2026-\d{6}", result["nova_rnc_numero"])
    flow_detail = quality(f"/nc/{flow_id}")
    assert flow_detail["nc"]["status"] == "ENCERRAMENTO"
    links = [row for row in flow_detail["nc_vinculo"] if row["tipo"] == "INEFICACIA"]
    assert len(links) == 1 and re.fullmatch(r"RNC-2026-\d{6}", links[0]["numero_relacionado"])
    assert len(flow_detail["nc_eficacia_acompanhamento"]) >= 1
    successor = quality("/nc/" + links[0]["nc_relacionada_id"])
    assert successor["nc"]["status"] == "REGISTRADA"
    assert successor["nc"]["numero_anterior_texto"] == flow_detail["nc"]["numero"]
    flow_pdf_status, _, flow_pdf = call(
        f"/unificado/qualidade/api/nc/{flow_id}/pdf", cookie=quality_cookie)
    assert flow_pdf_status == 200 and flow_pdf.startswith(b"%PDF-")
    import pymupdf
    flow_text = " ".join(page.get_text() for page in pymupdf.open(stream=flow_pdf, filetype="pdf"))
    assert links[0]["numero_relacionado"] in flow_text, "RNC sucessora ausente do PDF"
    assert "19/10/2026" in flow_text, "acompanhamento da eficácia ausente do PDF"
    Path("output/pdf/RNC-FL-SGQ-07_eficacia_homolog.pdf").write_bytes(flow_pdf)
    print(json.dumps({"homolog": "ok", "number": number, "id": rnc_id,
                      "migrated": len(old), "pdf_bytes": len(pdf),
                      "pdf": str(output), "ineffective_successor": links[0]["numero_relacionado"]},
                     ensure_ascii=False))


if __name__ == "__main__":
    main()
