from collections.abc import Callable

from fastapi import FastAPI, Header, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.orm import Session

from .config import Config, get_config
from .db import get_sessionmaker
from .erros import ErroAPI
from .rpc import Pedido, executar, falha

VERSAO = "2.0.0"
STATUS = {"NAO_AUTENTICADO": 401, "SEM_PERMISSAO": 403, "VALIDACAO": 422, "CONFLITO_REVISAO": 409,
          "NAO_ENCONTRADO": 404, "LIMITE": 429, "INTERNO": 500}


def create_app(cfg: Config | None = None, session_factory: Callable[[], Session] | None = None) -> FastAPI:
    cfg = cfg or get_config()
    session_factory = session_factory or get_sessionmaker()
    permitidas = ["https://usina.concretrack.com.br"]
    if cfg.ambiente == "dev":
        permitidas.append("http://localhost:5173")
    app = FastAPI(title="ConcreTrack Dosagem API", version=VERSAO, docs_url=None, redoc_url=None)
    app.add_middleware(CORSMiddleware, allow_origins=permitidas, allow_methods=["GET", "POST"],
                       allow_headers=["Authorization", "Content-Type", "Idempotency-Key"], allow_credentials=False)

    @app.exception_handler(RequestValidationError)
    async def pedido_invalido(_request: Request, _exc: RequestValidationError):
        return JSONResponse(falha(ErroAPI("VALIDACAO", "Corpo da requisição inválido.")), status_code=422)

    @app.exception_handler(Exception)
    async def falha_inesperada(_request: Request, _exc: Exception):
        return JSONResponse(falha(ErroAPI("INTERNO", "Falha interna na API.")), status_code=500)

    @app.middleware("http")
    async def recusar_origem(request: Request, call_next):
        origem = request.headers.get("origin")
        if origem and origem not in permitidas:
            return JSONResponse(falha(ErroAPI("SEM_PERMISSAO", "Origem não autorizada.")), status_code=403)
        return await call_next(request)

    @app.get("/api/v1/saude")
    def saude():
        try:
            with session_factory() as session:
                session.execute(text("SELECT 1"))
            return {"ok": True, "versao": VERSAO, "banco": "ok"}
        except Exception:
            return JSONResponse({"ok": False, "versao": VERSAO, "banco": "erro"}, status_code=503)

    @app.post("/api/v1/rpc")
    def rpc(pedido: Pedido, authorization: str = Header(default=""), idempotency_key: str = Header(default="")):
        if not authorization.startswith("Bearer ") or not authorization[7:]:
            erro = ErroAPI("NAO_AUTENTICADO", "Token Bearer obrigatório.")
            return JSONResponse(falha(erro), status_code=401)
        if not idempotency_key or idempotency_key != pedido.request_id:
            erro = ErroAPI("VALIDACAO", "Idempotency-Key deve coincidir com requestId.")
            return JSONResponse(falha(erro), status_code=422)
        try:
            with session_factory.begin() as session:
                return executar(session, pedido, authorization[7:], cfg)
        except ErroAPI as erro:
            return JSONResponse(falha(erro), status_code=STATUS.get(erro.codigo, 500))

    return app


app = create_app()
