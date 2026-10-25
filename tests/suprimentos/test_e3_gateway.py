"""Regressão da casca e do endpoint de acesso com cinco perfis representativos."""
import importlib
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "unificado/mapa/api"))
gateway = importlib.import_module("app")
from screen_access import allowed_screens, role_allows, CATALOG
sys.path.insert(0, str(ROOT / "unificado/suprimentos/service"))
from suprimentos.auth import decode_assertion

BEFORE = json.loads((ROOT / "docs/porting/suprimentos/e3-snapshot-before.json").read_text(encoding="utf-8"))
PROFILES = [
    ("master", "user-ricardo", "GERENCIA", "ADMIN"),
    ("gerencia", "e3-gerencia", "GERENCIA", None),
    ("gestor", "e3-gestor", "GESTOR", None),
    ("montador", "e3-montador", "MONTADOR", None),
    ("convidado", "e3-convidado", "CONVIDADO", None),
]


class FakeCursor:
    def __init__(self, overrides):
        self.overrides = overrides
        self.sql = ""

    def __enter__(self): return self
    def __exit__(self, *_): return False
    def execute(self, sql, *_): self.sql = sql
    def fetchall(self):
        if "user_screen_permissions" in self.sql:
            return [{"screen_id": key, "allowed": value} for key, value in self.overrides.items()]
        return []
    def fetchone(self):
        if "ged_identity_links" in self.sql:
            return {"ged_access": False}
        return None


class FakeConnection:
    def __init__(self, overrides): self.overrides = overrides
    def __enter__(self): return self
    def __exit__(self, *_): return False
    def cursor(self): return FakeCursor(self.overrides)


@pytest.fixture
def endpoint(monkeypatch):
    users = {label: {"id": uid, "nome": label, "perfil": role, "ativo": True,
                     "primeiro_acesso": False, "updated_at": datetime.now(timezone.utc)}
             for label, uid, role, _ in PROFILES}
    overrides = {}
    flags = {}
    monkeypatch.setenv("MAPA_AUTH_SIGNING_KEY", "e3-test-key-only")
    monkeypatch.setenv("SUPRIMENTOS_GATEWAY_SIGNING_KEY", "e3-test-supply-key-0123456789-abcdef")
    monkeypatch.setattr(gateway, "authenticated_user", lambda: users[gateway.request.headers["X-E3-Profile"]])
    monkeypatch.setattr(gateway, "connect", lambda: FakeConnection(overrides))
    monkeypatch.setattr(gateway, "supply_flags", lambda: flags.copy())
    return gateway.app.test_client(), overrides, flags


def test_screen_access_snapshots_five_profiles(endpoint):
    client, overrides, flags = endpoint
    for label, uid, role, planning in PROFILES:
        response = client.get("/unified/screen-access/me", headers={"X-E3-Profile": label})
        assert response.status_code == 200
        assert response.json["screens"] == BEFORE[label], label
        assert not response.json["suprimentos_enabled"]
    flags["S1"] = True
    # A flag sozinha não concede telas novas a usuários comuns.
    for label in ("gerencia", "gestor", "montador", "convidado"):
        response = client.get("/unified/screen-access/me", headers={"X-E3-Profile": label})
        assert response.json["screens"] == BEFORE[label]
    overrides["suprimentosPainel"] = True
    response = client.get("/unified/screen-access/me", headers={"X-E3-Profile": "gestor"})
    assert set(BEFORE["gestor"]).issubset(response.json["screens"])
    assert set(response.json["screens"]) - set(BEFORE["gestor"]) == {"suprimentosPainel"}
    assert response.json["suprimentos_enabled"]
    flags["S1"] = False
    response = client.get("/unified/screen-access/me", headers={"X-E3-Profile": "gestor"})
    assert response.json["screens"] == BEFORE["gestor"]


def test_existing_ids_and_ricardo_teste_remain():
    old = {value for screens in BEFORE.values() for value in screens}
    assert old.issubset({row["id"] for row in CATALOG})
    supri = {row["id"] for row in CATALOG if row["module"] == "suprimentos"}
    assert supri == {"suprimentosPainel", "suprimentosSolicitacoes", "suprimentosNova",
                     "suprimentosFornecedores", "suprimentosCadastros"}
    user = {"id": "ricardo.teste", "nome": "Ricardo", "perfil": "GESTOR"}
    assert all(role_allows(user, row) for row in CATALOG if row["module"] == "suprimentos")


def test_bootstrap_requires_flag_and_concession(endpoint):
    client, overrides, flags = endpoint
    assert client.post("/unified/suprimentos-bootstrap", headers={"X-E3-Profile": "gestor"}).status_code == 403
    flags["S1"] = True
    overrides["suprimentosSolicitacoes"] = True
    response = client.post("/unified/suprimentos-bootstrap", headers={"X-E3-Profile": "gestor"})
    assert response.status_code == 200
    cookies = response.headers.getlist("Set-Cookie")
    assert len(cookies) == 3
    assert any("Path=/api/suprimentos/" in item for item in cookies)
    assert any("Path=/unificado/suprimentos/" in item for item in cookies)
    assert all("HttpOnly" in item and "Secure" in item for item in cookies)


def test_authorize_assertion_and_refresh_revocation(endpoint, monkeypatch):
    client, overrides, flags = endpoint
    flags["S1"] = True
    overrides["suprimentosSolicitacoes"] = True
    user = {"id": "e3-gestor", "nome": "Gestor", "perfil": "GESTOR", "ativo": True,
            "primeiro_acesso": False, "updated_at": datetime.now(timezone.utc)}
    monkeypatch.setattr(gateway, "supply_cookie_user", lambda *args: user)
    authorize = client.get("/unified/suprimentos-authorize", headers={
        "X-Original-URI": "/api/suprimentos/solicitacoes", "X-E3-Profile": "gestor"})
    assert authorize.status_code == 204
    assertion = authorize.headers["X-Suprimentos-Assertion"]
    assert decode_assertion(assertion, os.environ["SUPRIMENTOS_GATEWAY_SIGNING_KEY"]).id == user["id"]
    monkeypatch.setattr(gateway, "authenticated_user", lambda: None)
    renewed = client.get("/unified/suprimentos-renew")
    assert renewed.status_code == 200
    assert any("mapa_unificado_session" in cookie for cookie in renewed.headers.getlist("Set-Cookie"))
    monkeypatch.setattr(gateway, "supply_cookie_user", lambda *args: None)
    assert client.get("/unified/suprimentos-renew").status_code == 401
