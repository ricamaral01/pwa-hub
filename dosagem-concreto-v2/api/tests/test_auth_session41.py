import base64
import hashlib
from datetime import datetime, timedelta, timezone

from fastapi.testclient import TestClient
from sqlalchemy import text

from app.auth_session import HUB_ORIGIN, senha_hash
from app.modelos import LocalCredencial, Usuario


def _challenge(verifier: str) -> str:
    return base64.urlsafe_b64encode(hashlib.sha256(verifier.encode()).digest()).decode().rstrip("=")


def test_hub_ticket_pkce_reuse_expiration_origin_and_cookie(ambiente, monkeypatch, caplog):
    client, factory, cfg = ambiente
    cfg.supabase_url = "https://example.supabase.co"
    cfg.supabase_anon_key = "test-anon"
    with factory.begin() as session:
        session.add(Usuario(email="hub@example.test", nome="Hub", papel="engenheiro", unidades=["campinas"], ativo=True))

    class Response:
        status_code = 200
        def json(self):
            return {"email": "hub@example.test"}

    def fake_get(url, headers, timeout):
        assert url == "https://example.supabase.co/auth/v1/user"
        assert headers["Authorization"] == "Bearer hub-secret-token"
        return Response()

    monkeypatch.setattr("app.auth_session.httpx.get", fake_get)
    verifier = "a" * 43
    state = "b" * 32
    begin = client.post("/api/v1/auth/hub/iniciar", json={"estado": state, "code_challenge": _challenge(verifier)})
    assert begin.status_code == 200 and begin.json()["url"] == f"{HUB_ORIGIN}/auth/ponte-dosagem.html?estado={state}"
    denied = client.post("/api/v1/auth/hub/ticket", headers={"Origin": "https://evil.example", "Authorization": "Bearer hub-secret-token"}, json={"estado": state})
    assert denied.status_code == 403
    ticket = client.post("/api/v1/auth/hub/ticket", headers={"Origin": HUB_ORIGIN, "Authorization": "Bearer hub-secret-token"}, json={"estado": state})
    assert ticket.status_code == 200 and ticket.headers["access-control-allow-origin"] == HUB_ORIGIN
    assert "hub-secret-token" not in caplog.text
    opaque = ticket.json()["ticket"]
    wrong = client.post("/api/v1/auth/hub/trocar", json={"estado": state, "ticket": opaque, "code_verifier": "c" * 43})
    assert wrong.status_code == 401
    good = client.post("/api/v1/auth/hub/trocar", json={"estado": state, "ticket": opaque, "code_verifier": verifier})
    assert good.status_code == 200
    cookie = good.headers["set-cookie"]
    assert "ct_dosagem_sessao=" in cookie and "httponly" in cookie.lower() and "secure" in cookie.lower() and "samesite=lax" in cookie.lower()
    assert client.get("/api/v1/auth/sessao").json()["email"] == "hub@example.test"
    reused = client.post("/api/v1/auth/hub/trocar", json={"estado": state, "ticket": opaque, "code_verifier": verifier})
    assert reused.status_code == 401
    state2 = "d" * 32
    client.post("/api/v1/auth/hub/iniciar", json={"estado": state2, "code_challenge": _challenge(verifier)})
    ticket2 = client.post("/api/v1/auth/hub/ticket", headers={"Origin": HUB_ORIGIN, "Authorization": "Bearer hub-secret-token"}, json={"estado": state2}).json()["ticket"]
    with factory.begin() as session:
        session.execute(text("UPDATE auth_tickets SET expira_em = :past WHERE ticket_hash = :hash"), {"past": datetime.now(timezone.utc) - timedelta(seconds=1), "hash": hashlib.sha256(ticket2.encode()).hexdigest()})
    expired = client.post("/api/v1/auth/hub/trocar", json={"estado": state2, "ticket": ticket2, "code_verifier": verifier})
    assert expired.status_code == 401
    state3 = "e" * 32
    client.post("/api/v1/auth/hub/iniciar", json={"estado": state3, "code_challenge": _challenge(verifier)})
    monkeypatch.setattr(Response, "json", lambda self: {"email": "unknown@example.test"})
    ticket3 = client.post("/api/v1/auth/hub/ticket", headers={"Origin": HUB_ORIGIN, "Authorization": "Bearer hub-secret-token"}, json={"estado": state3}).json()["ticket"]
    unregistered = client.post("/api/v1/auth/hub/trocar", json={"estado": state3, "ticket": ticket3, "code_verifier": verifier})
    assert unregistered.status_code == 403


def test_local_emergency_password_lockout_and_cookie_rpc(ambiente):
    client, factory, _ = ambiente
    with factory.begin() as session:
        session.add(Usuario(email="admin@example.test", nome="Admin", papel="admin", unidades=["*"], ativo=True))
        session.flush()
        session.add(LocalCredencial(email="admin@example.test", senha_hash=senha_hash("long-test-password"), trocar_senha=True))
    for _ in range(5):
        failed = client.post("/api/v1/auth/local/login", json={"email": "admin@example.test", "senha": "incorrect-password"})
        assert failed.status_code == 401
    locked = client.post("/api/v1/auth/local/login", json={"email": "admin@example.test", "senha": "long-test-password"})
    assert locked.status_code == 401
    with factory.begin() as session:
        session.execute(text("UPDATE local_credenciais SET bloqueado_ate = :past WHERE email = 'admin@example.test'"), {"past": datetime.now(timezone.utc) - timedelta(seconds=1)})
    good = client.post("/api/v1/auth/local/login", json={"email": "admin@example.test", "senha": "long-test-password"})
    assert good.status_code == 200 and good.json()["trocarSenha"] is True
    import uuid
    request_id = str(uuid.uuid4())
    body = {"acao": "usuarios.listar", "requestId": request_id, "dados": {}}
    rejected = client.post("/api/v1/rpc", headers={"Idempotency-Key": request_id}, json=body)
    assert rejected.status_code == 403
    needs_change = client.post("/api/v1/rpc", headers={"Idempotency-Key": request_id, "Origin": "https://testserver", "X-Requested-With": "dosagem"}, json=body)
    assert needs_change.status_code == 403
    changed = client.post("/api/v1/auth/local/trocar-senha", headers={"Origin": "https://testserver", "X-Requested-With": "dosagem"},
                          json={"senha_atual": "long-test-password", "nova_senha": "new-long-password"})
    assert changed.status_code == 200
    allowed = client.post("/api/v1/rpc", headers={"Idempotency-Key": request_id, "Origin": "https://testserver", "X-Requested-With": "dosagem"}, json=body)
    assert allowed.status_code == 200
    logout = client.post("/api/v1/auth/sair", headers={"Origin": "https://testserver", "X-Requested-With": "dosagem"})
    assert logout.status_code == 200
    old = client.post("/api/v1/auth/local/login", json={"email": "admin@example.test", "senha": "long-test-password"})
    assert old.status_code == 401
    new = client.post("/api/v1/auth/local/login", json={"email": "admin@example.test", "senha": "new-long-password"})
    assert new.status_code == 200 and new.json()["trocarSenha"] is False


def test_pilot_local_http_tunnel_keeps_session_cookie(ambiente):
    from app.main import create_app
    _, factory, cfg = ambiente
    cfg.modo_piloto = True
    with factory.begin() as session:
        session.add(Usuario(email="pilot@example.test", nome="Pilot", papel="admin", unidades=["*"], ativo=True))
        session.flush()
        session.add(LocalCredencial(email="pilot@example.test", senha_hash=senha_hash("pilot-test-password"), trocar_senha=False))
    with TestClient(create_app(cfg, factory), base_url="http://127.0.0.1:18443") as client:
        login = client.post("/api/v1/auth/local/login", json={"email": "pilot@example.test", "senha": "pilot-test-password"})
        assert login.status_code == 200
        assert "httponly" in login.headers["set-cookie"].lower()
        assert "secure" not in login.headers["set-cookie"].lower()
        session_response = client.get("/api/v1/auth/sessao")
        assert session_response.status_code == 200
        assert session_response.json()["email"] == "pilot@example.test"


def test_pilot_forwarded_https_sets_secure_cookie(ambiente):
    from app.main import create_app
    _, factory, cfg = ambiente
    cfg.modo_piloto = True
    with factory.begin() as session:
        session.add(Usuario(email="https@example.test", nome="HTTPS", papel="admin", unidades=["*"], ativo=True))
        session.flush()
        session.add(LocalCredencial(email="https@example.test", senha_hash=senha_hash("https-test-password"), trocar_senha=False))
    with TestClient(create_app(cfg, factory), base_url="http://127.0.0.1:18443") as client:
        login = client.post("/api/v1/auth/local/login", headers={"X-Forwarded-Proto": "https"},
                            json={"email": "https@example.test", "senha": "https-test-password"})
        assert login.status_code == 200
        assert "secure" in login.headers["set-cookie"].lower()
