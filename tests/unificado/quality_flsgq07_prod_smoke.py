"""One controlled production RNC smoke after the approved FL-SGQ-07 release.

Uses Ricardo's existing account, prints no session values, cancels the single
smoke RNC after exercising opening, treatment and export.
"""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
import json
import re
import urllib.error
import urllib.request

from ged_sso_published_smoke import session


BASE = "https://concrefer.concretrack.com.br"


def call(path, *, method="GET", data=None, cookie=""):
    payload = json.dumps(data, ensure_ascii=False).encode() if data is not None else None
    request = urllib.request.Request(
        BASE + path, data=payload, method=method,
        headers={"Cookie": cookie, "Content-Type": "application/json",
                 "Accept": "application/json"},
    )
    try:
        response = urllib.request.urlopen(request, timeout=20)
    except urllib.error.HTTPError as error:
        response = error
    return response.status, response.headers, response.read()


def main():
    token = session("user-ricardo")
    code, headers, body = call("/unificado/mapa/api/unified/qualidade-bootstrap",
                               method="POST", cookie="mapa_unificado_session=" + token)
    assert code == 200, (code, body[:200])
    cookie = next(value.split(";", 1)[0] for value in headers.get_all("Set-Cookie")
                  if value.startswith("unificado_qualidade_session="))

    def quality(path, *, method="GET", data=None, expected=(200,)):
        code, headers, body = call("/unificado/qualidade/api" + path, method=method,
                                   data=data, cookie=cookie)
        assert code in expected, (method, path, code, body[:300])
        return (json.loads(body) if body[:1] in (b"{", b"[") else body), headers

    context, _ = quality("/contexto")
    assert context["user"]["id"] == "user-ricardo"
    company = context["companies"][0]["id"]
    catalog, _ = quality(f"/catalogos?company={company}&unit=campinas")
    find = lambda group, name: next(row["id"] for row in catalog[group]
                                    if row["codigo"] == name)

    listed, _ = quality(f"/nc?company={company}&unit=campinas&limit=200")
    migrated = [row for row in listed["items"] if row["legado"]]
    assert len(migrated) == 3, len(migrated)
    history = {}
    for item in migrated:
        assert re.fullmatch(r"RNC-2026-\d{6}", item["numero"]), item["numero"]
        detail, _ = quality("/nc/" + item["id"])
        old = detail["nc"]["numero_anterior_texto"]
        assert old in {"NC-2026-0001", "NC-2026-0002", "NC-2026-0003"}
        renames = [e for e in detail["nc_evento"] if e["tipo"] == "NUMERO_RENOMEADO"]
        assert len(renames) == 1 and old in renames[0]["descricao"]
        history[old] = item["numero"]
    assert len(history) == 3

    now = datetime.now(timezone.utc)
    draft, _ = quality("/nc/rascunhos", method="POST", expected=(201,), data={
        "empresa_id": company, "unidade_codigo": "campinas",
        "titulo": "SMOKE FL-SGQ-07 - validação da publicação",
        "descricao": "Registro controlado de teste da publicação; será cancelado após validação.",
        "origem_id": find("origem", "FORNECEDOR"),
        "area_emissora_id": find("area", "SGQ"),
        "data_deteccao": now.isoformat(),
    })
    rnc_id = draft["id"]
    registered, _ = quality(f"/nc/{rnc_id}/registrar", method="POST", data={"mobile": False})
    assert re.fullmatch(r"RNC-2026-\d{6}", registered["numero"])
    quality(f"/nc/{rnc_id}/formulario", method="PATCH", data={
        "processo_texto": "Validação da publicação",
        "emitente_nome": "Teste automático da Qualidade",
        "evidencias_texto": "Fluxo controlado de smoke para FL-SGQ-07 e PDF eletrônico.",
    })
    pdf, pdf_headers = quality(f"/nc/{rnc_id}/pdf")
    assert pdf.startswith(b"%PDF-") and len(pdf) > 1000
    assert "RNC - Eletr" in pdf_headers.get("Content-Disposition", "")
    quality(f"/nc/{rnc_id}/triagem", method="POST", data={
        "origem_id": find("origem", "FORNECEDOR"),
        "gravidade_id": find("gravidade", "MAIOR"),
        "tipo_id": find("tipo", "PRODUTO"),
        "area_responsavel_id": find("area", "SGQ"),
        "responsavel_id": "user-ricardo",
        "prazo_final": (now.date() + timedelta(days=7)).isoformat(),
    })
    quality(f"/nc/{rnc_id}/contencoes", method="POST", expected=(201,), data={
        "disposicao_id": find("disposicao", "SEGREGAR_BLOQUEAR"),
        "descricao": "Validação da tratativa; nenhuma ação operacional realizada.",
        "responsavel_texto": "Teste automático da Qualidade",
    })
    detail, _ = quality(f"/nc/{rnc_id}")
    assert detail["nc"]["status"] == "CONTENCAO" and len(detail["nc_contencao"]) == 1
    quality(f"/nc/{rnc_id}/cancelar", method="POST", data={
        "motivo": "Smoke da publicação concluído; registro de teste cancelado."})
    final, _ = quality(f"/nc/{rnc_id}")
    assert final["nc"]["status"] == "CANCELADA"
    print(json.dumps({"status": "ok", "migrated": history,
                      "smoke_number": registered["numero"], "smoke_id": rnc_id,
                      "smoke_final_status": "CANCELADA", "pdf_bytes": len(pdf)},
                     ensure_ascii=False))


if __name__ == "__main__":
    main()
