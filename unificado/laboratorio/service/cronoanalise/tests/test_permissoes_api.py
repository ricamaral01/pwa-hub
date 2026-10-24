from __future__ import annotations

import sys
from pathlib import Path
from types import SimpleNamespace

from fastapi import FastAPI
from fastapi.testclient import TestClient

SERVICE = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(SERVICE))
from cronoanalise import api  # noqa: E402


def client():
    app = FastAPI()
    app.include_router(api.router)
    app.add_exception_handler(api.CronoError, api.crono_error_handler)
    return TestClient(app)


def test_sem_sessao_401(monkeypatch):
    monkeypatch.setattr(api, "gateway_user", lambda request: None)
    response = client().get("/api/laboratorio/cronoanalise/status")
    assert response.status_code == 401
    assert response.json()["erro"] == "sessao_invalida"


def test_sem_permissao_403(monkeypatch):
    monkeypatch.setattr(api, "gateway_user", lambda request: SimpleNamespace(
        id="cronometrista", crono_screens=frozenset({"cronoanalise.coletar"}),
        crono_actions=frozenset()))
    response = client().post("/api/laboratorio/cronoanalise/medicoes/lote",
                             json={"medicoes": []})
    assert response.status_code == 403
    assert response.json()["erro"] == "sem_permissao"
