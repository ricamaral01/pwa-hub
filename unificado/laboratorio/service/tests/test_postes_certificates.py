import base64
import hashlib
import hmac
import json
from datetime import date, datetime, timedelta, timezone
from types import SimpleNamespace

import pytest
from fastapi import HTTPException
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from server.postes_certificates import external_session, quality_user, router
from server.postes_api import router as poles_router, current_user
from server.postes_db import Base, Test as PoleTest
from server.postes_report_v2 import report_html_v2, report_pdf_v2


class EmptySession:
    def get(self, *_):
        return None

    def scalars(self, *_):
        return self

    def all(self):
        return []


def test_certificate_contains_qr_observations_and_pdf():
    record = SimpleNamespace(
        id="test-001", numero_amostra="CP-001", numero_serie_poste="SER-001",
        revisao=1, criterio_versao=1, data_ensaio=date(2026, 10, 24),
        data_fabricacao=None, fabrica="Campinas", poste_snapshot={"tipo": "DT", "face": "B",
            "altura_m": 9, "resistencia_daN": 300}, parametros_calculados={}, criterios_snapshot={},
        leituras={}, resultados={"etapas": {}, "absorcao": {"valores_pct": []}},
        inspecao_data={}, inspecao_geral_ok=True, veredito="APROVADO", status="finalizado",
        observacoes="Sem fissuras na inspeção final.", equipamento_id=None,
        inspetor_id=None, engenheiro_id=None,
    )
    url = "https://concrefer.concretrack.com.br/certificados/postes/test-001"
    html = report_html_v2(record, EmptySession(), url, external=True)
    assert "data:image/png;base64," in html
    assert url in html
    assert "Sem fissuras na inspeção final." in html
    assert "/certificado.pdf" in html
    pdf = report_pdf_v2(record, EmptySession(), url)
    assert pdf.startswith(b"%PDF-")


def test_quality_assertion_requires_signed_loopback(monkeypatch):
    secret = "a" * 40
    monkeypatch.setenv("QUALIDADE_GATEWAY_SIGNING_KEY", secret)
    claim = {"iss": "unificado", "id": "user-1", "name": "Qualidade", "actions": [],
             "superuser": False, "exp": int(datetime.now(timezone.utc).timestamp()) + 10}
    encoded = base64.urlsafe_b64encode(json.dumps(claim).encode()).rstrip(b"=").decode()
    signature = base64.urlsafe_b64encode(hmac.new(secret.encode(), encoded.encode(), hashlib.sha256).digest()).rstrip(b"=").decode()
    request = SimpleNamespace(client=SimpleNamespace(host="127.0.0.1"),
                              headers={"x-qualidade-assertion": encoded + "." + signature})
    assert quality_user(request)["id"] == "user-1"
    request.client.host = "203.0.113.1"
    with pytest.raises(HTTPException) as blocked:
        quality_user(request)
    assert blocked.value.status_code == 403
    request.client.host = "127.0.0.1"
    request.headers["x-qualidade-assertion"] += "x"
    with pytest.raises(HTTPException) as invalid:
        quality_user(request)
    assert invalid.value.status_code == 401


def test_external_session_is_bound_to_one_certificate():
    token = "scoped-token"
    row = SimpleNamespace(ensaio_id="first", expira_em=datetime.now(timezone.utc) + timedelta(minutes=30))
    class Session:
        def get(self, _model, key):
            return row if key == hashlib.sha256(token.encode()).hexdigest() else None
    request = SimpleNamespace(cookies={"ct_certificate_session": token})
    assert external_session(request, "first", Session())
    assert not external_session(request, "second", Session())


def test_completed_results_and_scoped_external_login(tmp_path, monkeypatch):
    monkeypatch.setenv("POSTES_UPLOAD_DIR", str(tmp_path))
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    @event.listens_for(engine, "connect")
    def attach(dbapi_connection, _record):
        dbapi_connection.execute("ATTACH DATABASE ':memory:' AS ensaio_postes")
    Base.metadata.create_all(engine)
    factory = sessionmaker(engine, expire_on_commit=False)
    with factory() as session:
        for test_id, status in (("completed-1", "finalizado"), ("draft-1", "rascunho")):
            session.add(PoleTest(id=test_id, numero_amostra=test_id, poste_snapshot={"tipo": "DT", "face": "B",
                "altura_m": 9, "resistencia_daN": 300}, data_ensaio=date(2026, 10, 24),
                criterio_versao=1, criterios_snapshot={}, parametros_calculados={}, leituras={},
                absorcao_data=[], resultados={"etapas": {}, "absorcao": {"valores_pct": []}},
                inspecao_data={}, status=status, veredito="APROVADO", observacoes="Conferido.",
                criado_por="laboratorio"))
        session.commit()
    app = FastAPI()
    app.state.postes_session = factory
    app.include_router(poles_router)
    app.include_router(router)
    app.dependency_overrides[quality_user] = lambda: {"name": "Qualidade", "actions": ["qualidade.nc.ver_todas"], "superuser": False}
    app.dependency_overrides[current_user] = lambda: SimpleNamespace(username="laboratorio", role="tecnico")
    with TestClient(app, base_url="https://testserver") as client:
        uploaded = client.post("/api/ensaios/draft-1/anexos",
                               files={"file": ("nota.pdf", b"%PDF-1.4\nteste", "application/pdf")})
        assert uploaded.status_code == 201
        assert client.get(uploaded.json()["url"]).status_code == 200
        assert client.post("/api/ensaios/completed-1/anexos",
                           files={"file": ("nota.pdf", b"%PDF-1.4\n", "application/pdf")}).status_code == 409
        rows = client.get("/api/qualidade/postes/ensaios")
        assert rows.status_code == 200
        assert [row["id"] for row in rows.json()] == ["completed-1"]
        assert client.get("/api/qualidade/postes/ensaios/draft-1").status_code == 404
        issued = client.post("/api/qualidade/postes/ensaios/completed-1/acesso-externo")
        assert issued.status_code == 200
        credentials = issued.json()
        assert client.get("/certificados/postes/completed-1").status_code == 200
        assert "Conferido." not in client.get("/certificados/postes/completed-1").text
        assert client.post("/certificados/postes/completed-1/entrar",
                           json={"login": credentials["login"], "senha": "wrong"}).status_code == 401
        assert client.post("/certificados/postes/completed-1/entrar",
                           json={"login": credentials["login"], "senha": credentials["senha"]}).status_code == 200
        page = client.get("/certificados/postes/completed-1")
        assert page.status_code == 200
        assert "Conferido." in page.text
        assert "data:image/png;base64," in page.text
        assert client.get("/certificados/postes/draft-1").status_code == 404
