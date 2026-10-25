import pytest
from fastapi import HTTPException

from quality import pcp_catalog


def test_snapshot_uses_pcp_response_not_client_values(monkeypatch):
    monkeypatch.setattr(pcp_catalog, "fetch_catalog", lambda kind: [
        {"id": "17", "codigo": "POSTE-17", "nome": "Poste DT", "setor_id": "3"}
    ])
    assert pcp_catalog.snapshot("produtos", "17", sector="3") == {
        "produto_pcp_id": "17", "produto_codigo_snapshot": "POSTE-17",
        "produto_nome_snapshot": "Poste DT",
    }
    with pytest.raises(HTTPException) as exc:
        pcp_catalog.snapshot("produtos", "17", sector="4")
    assert exc.value.status_code == 422


def test_missing_service_key_fails_closed(monkeypatch):
    monkeypatch.delenv("QUALIDADE_PCP_CATALOG_KEY", raising=False)
    with pytest.raises(HTTPException) as exc:
        pcp_catalog.fetch_catalog("setores")
    assert exc.value.status_code == 503
