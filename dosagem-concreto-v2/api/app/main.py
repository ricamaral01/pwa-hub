from collections.abc import Callable
from pathlib import Path

from fastapi import FastAPI, Header, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.orm import Session

from .config import Config, get_config
from .db import get_sessionmaker
from .erros import ErroAPI
from .auth_session import COOKIE, HUB_ORIGIN, emitir_ticket, iniciar, login_local, trocar_senha_local, trocar_ticket, usuario_sessao
from .rpc import Pedido, executar, falha
from .modelos import LocalCredencial
from .unified_gateway import unified_user

VERSAO = "2.0.0"
STATUS = {"NAO_AUTENTICADO": 401, "SEM_PERMISSAO": 403, "VALIDACAO": 422, "CONFLITO_REVISAO": 409,
          "DIVERGENCIA_CALCULO": 409, "BLOQUEIO_ESTADO": 422,
          "NAO_ENCONTRADO": 404, "LIMITE": 429, "INTERNO": 500}


class InicioHub(BaseModel):
    estado: str
    code_challenge: str


class TicketHub(BaseModel):
    estado: str


class TrocaHub(BaseModel):
    estado: str
    ticket: str
    code_verifier: str
    manter_conectado: bool = False


class LoginLocal(BaseModel):
    email: str
    senha: str
    manter_conectado: bool = False


class TrocaSenhaLocal(BaseModel):
    senha_atual: str
    nova_senha: str


def create_app(cfg: Config | None = None, session_factory: Callable[[], Session] | None = None) -> FastAPI:
    cfg = cfg or get_config()
    session_factory = session_factory or get_sessionmaker()
    permitidas = ["https://usina.concretrack.com.br"]
    if cfg.ambiente == "dev":
        permitidas.append("http://localhost:5173")
    app = FastAPI(title="ConcreTrack Dosagem API", version=VERSAO, docs_url=None, redoc_url=None)

    @app.exception_handler(RequestValidationError)
    async def pedido_invalido(_request: Request, _exc: RequestValidationError):
        return JSONResponse(falha(ErroAPI("VALIDACAO", "Corpo da requisição inválido.")), status_code=422)

    @app.exception_handler(Exception)
    async def falha_inesperada(_request: Request, _exc: Exception):
        return JSONResponse(falha(ErroAPI("INTERNO", "Falha interna na API.")), status_code=500)

    @app.middleware("http")
    async def recusar_origem(request: Request, call_next):
        origem = request.headers.get("origin")
        ponte = request.url.path == "/api/v1/auth/hub/ticket"
        native = request.url.path.startswith("/native/api/v1/")
        if native and origem and origem != "https://concrefer.concretrack.com.br":
            return JSONResponse(falha(ErroAPI("SEM_PERMISSAO", "Origem não autorizada.")), status_code=403)
        if not native and origem and (origem != HUB_ORIGIN if ponte else origem != str(request.base_url).rstrip("/")):
            if cfg.ambiente == "dev" and not ponte and origem == "http://localhost:5173":
                return await call_next(request)
            return JSONResponse(falha(ErroAPI("SEM_PERMISSAO", "Origem não autorizada.")), status_code=403)
        if request.method == "OPTIONS" and ponte and origem == HUB_ORIGIN:
            return JSONResponse({}, headers={"Access-Control-Allow-Origin": HUB_ORIGIN,
                                             "Access-Control-Allow-Methods": "POST, OPTIONS",
                                             "Access-Control-Allow-Headers": "Authorization, Content-Type"})
        response = await call_next(request)
        if ponte and origem == HUB_ORIGIN:
            response.headers["Access-Control-Allow-Origin"] = HUB_ORIGIN
            response.headers["Vary"] = "Origin"
        return response

    def auth_error(erro: ErroAPI):
        return JSONResponse(falha(erro), status_code=STATUS.get(erro.codigo, 500))

    def set_cookie(response: JSONResponse, token: str, manter: bool, request: Request) -> JSONResponse:
        forwarded_https = request.headers.get("x-forwarded-proto", "").split(",", 1)[0].strip().lower() == "https"
        tunnel_http = (cfg.modo_piloto and request.url.scheme == "http" and not forwarded_https
                       and request.url.hostname in {"127.0.0.1", "localhost"})
        response.set_cookie(COOKIE, token, max_age=30 * 86400 if manter else 12 * 3600,
                            httponly=True, secure=not tunnel_http, samesite="lax", path="/")
        return response

    @app.post("/api/v1/auth/hub/iniciar")
    def auth_hub_iniciar(pedido: InicioHub):
        try:
            with session_factory.begin() as session:
                url = iniciar(session, pedido.estado, pedido.code_challenge)
            return {"url": url}
        except ErroAPI as erro:
            return auth_error(erro)

    @app.post("/api/v1/auth/hub/ticket")
    def auth_hub_ticket(pedido: TicketHub, request: Request, authorization: str = Header(default="")):
        if not authorization.startswith("Bearer "):
            return auth_error(ErroAPI("NAO_AUTENTICADO", "Token do Hub obrigatório."))
        try:
            with session_factory.begin() as session:
                ticket = emitir_ticket(session, pedido.estado, authorization[7:], request.headers.get("origin", ""), cfg)
            return {"ticket": ticket}
        except ErroAPI as erro:
            return auth_error(erro)

    @app.post("/api/v1/auth/hub/trocar")
    def auth_hub_trocar(pedido: TrocaHub, request: Request):
        try:
            with session_factory.begin() as session:
                token = trocar_ticket(session, pedido.ticket, pedido.estado, pedido.code_verifier, pedido.manter_conectado)
            return set_cookie(JSONResponse({"ok": True}), token, pedido.manter_conectado, request)
        except ErroAPI as erro:
            return auth_error(erro)

    @app.post("/api/v1/auth/local/login")
    def auth_local_login(pedido: LoginLocal, request: Request):
        try:
            with session_factory.begin() as session:
                token, trocar = login_local(session, pedido.email, pedido.senha, pedido.manter_conectado)
        except ErroAPI as erro:
            return auth_error(erro)
        if not token:
            return auth_error(ErroAPI("NAO_AUTENTICADO", "Credenciais inválidas ou temporariamente bloqueadas."))
        return set_cookie(JSONResponse({"ok": True, "trocarSenha": trocar}), token, pedido.manter_conectado, request)

    @app.get("/api/v1/auth/sessao")
    def auth_sessao(request: Request):
        try:
            with session_factory.begin() as session:
                usuario = usuario_sessao(session, request.cookies.get(COOKIE, ""))
                cred = session.get(LocalCredencial, usuario.email)
                return {"email": usuario.email, "nome": usuario.nome, "papel": usuario.papel,
                        "unidades": usuario.unidades, "trocarSenha": bool(cred and cred.trocar_senha)}
        except ErroAPI as erro:
            return auth_error(erro)

    @app.post("/api/v1/auth/local/trocar-senha")
    def auth_local_trocar_senha(pedido: TrocaSenhaLocal, request: Request, x_requested_with: str = Header(default="")):
        if x_requested_with != "dosagem" or request.headers.get("origin") != str(request.base_url).rstrip("/"):
            return auth_error(ErroAPI("SEM_PERMISSAO", "Origem ou cabeçalho inválido."))
        try:
            with session_factory.begin() as session:
                usuario = usuario_sessao(session, request.cookies.get(COOKIE, ""))
                trocar_senha_local(session, usuario, pedido.senha_atual, pedido.nova_senha)
            if usuario.email == "admin@dosagem.local":
                Path("/opt/concretrack-dosagem/shared/ADMIN_SENHA_INICIAL.txt").unlink(missing_ok=True)
            return {"ok": True}
        except ErroAPI as erro:
            return auth_error(erro)

    @app.post("/api/v1/auth/sair")
    def auth_sair(request: Request, x_requested_with: str = Header(default="")):
        if x_requested_with != "dosagem" or request.headers.get("origin") != str(request.base_url).rstrip("/"):
            return auth_error(ErroAPI("SEM_PERMISSAO", "Origem ou cabeçalho inválido."))
        from .auth_session import _hash
        from .modelos import AuthSession
        cookie = request.cookies.get(COOKIE, "")
        if cookie:
            with session_factory.begin() as session:
                registro = session.get(AuthSession, _hash(cookie))
                if registro:
                    session.delete(registro)
        response = JSONResponse({"ok": True})
        response.delete_cookie(COOKIE, path="/")
        return response

    @app.get("/api/v1/saude")
    def saude():
        try:
            with session_factory() as session:
                session.execute(text("SELECT 1"))
            return {"ok": True, "versao": VERSAO, "banco": "ok", **({"piloto": True} if cfg.modo_piloto else {})}
        except Exception:
            return JSONResponse({"ok": False, "versao": VERSAO, "banco": "erro", **({"piloto": True} if cfg.modo_piloto else {})}, status_code=503)

    @app.post("/api/v1/rpc")
    def rpc(pedido: Pedido, request: Request, authorization: str = Header(default=""), idempotency_key: str = Header(default=""), x_requested_with: str = Header(default="")):
        cookie = request.cookies.get(COOKIE, "")
        if not cookie and (cfg.ambiente != "dev" or not authorization.startswith("Bearer ")):
            erro = ErroAPI("NAO_AUTENTICADO", "Sessão obrigatória.")
            return JSONResponse(falha(erro), status_code=401)
        if cookie and (x_requested_with != "dosagem" or request.headers.get("origin") != str(request.base_url).rstrip("/")):
            return auth_error(ErroAPI("SEM_PERMISSAO", "Origem ou cabeçalho de gravação inválido."))
        if not idempotency_key or idempotency_key != pedido.request_id:
            erro = ErroAPI("VALIDACAO", "Idempotency-Key deve coincidir com requestId.")
            return JSONResponse(falha(erro), status_code=422)
        try:
            with session_factory.begin() as session:
                usuario = usuario_sessao(session, cookie) if cookie else None
                if usuario:
                    cred = session.get(LocalCredencial, usuario.email)
                    if cred and cred.trocar_senha:
                        raise ErroAPI("SEM_PERMISSAO", "Troque a senha provisória antes de usar a aplicação.")
                return executar(session, pedido, authorization[7:] if authorization.startswith("Bearer ") else "", cfg, usuario)
        except ErroAPI as erro:
            return JSONResponse(falha(erro), status_code=STATUS.get(erro.codigo, 500))

    @app.get("/native/api/v1/saude")
    def native_saude(request: Request, x_lab_assertion: str = Header(default="")):
        try:
            with session_factory.begin() as session:
                unified_user(session, request, x_lab_assertion, cfg.lab_gateway_signing_key)
                session.execute(text("SELECT 1"))
            return {"ok": True, "versao": VERSAO, "banco": "ok", "piloto": cfg.modo_piloto}
        except ErroAPI as erro:
            return auth_error(erro)

    @app.get("/native/api/v1/auth/sessao")
    def native_sessao(request: Request, x_lab_assertion: str = Header(default="")):
        try:
            with session_factory.begin() as session:
                user = unified_user(session, request, x_lab_assertion, cfg.lab_gateway_signing_key)
                return {"email": user.email, "nome": user.nome, "papel": user.papel,
                        "unidades": user.unidades, "trocarSenha": False}
        except ErroAPI as erro:
            return auth_error(erro)

    @app.post("/native/api/v1/rpc")
    def native_rpc(pedido: Pedido, request: Request, idempotency_key: str = Header(default=""),
                   x_requested_with: str = Header(default=""), x_lab_assertion: str = Header(default="")):
        if x_requested_with != "dosagem":
            return auth_error(ErroAPI("SEM_PERMISSAO", "Cabeçalho de gravação inválido."))
        if not idempotency_key or idempotency_key != pedido.request_id:
            return auth_error(ErroAPI("VALIDACAO", "Idempotency-Key deve coincidir com requestId."))
        try:
            with session_factory.begin() as session:
                user = unified_user(session, request, x_lab_assertion, cfg.lab_gateway_signing_key)
                return executar(session, pedido, "", cfg, user)
        except ErroAPI as erro:
            return JSONResponse(falha(erro), status_code=STATUS.get(erro.codigo, 500))

    return app


app = create_app()
