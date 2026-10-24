from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.httpsredirect import HTTPSRedirectMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from starlette.middleware.trustedhost import TrustedHostMiddleware
from starlette.requests import Request
from starlette.responses import Response
import os

from app.core.config import settings
from app.core.database import engine, Base

# Importa todos os models para garantir criação das tabelas
import app.models  # noqa: F401

from app.api.routers import auth, usuarios, setores, pcp, dashboard, produtos, teste_programacao, alocacao_formas, programacao_circular_s3, programacao_circular_s4, etiquetas_armaduras, producao_unidade

# Cria as tabelas no banco (substitua por Alembic em produção)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    docs_url="/api/docs" if settings.ENABLE_DOCS else None,
    redoc_url="/api/redoc" if settings.ENABLE_DOCS else None,
)


def _split_csv(value: str) -> list[str]:
    return [item.strip() for item in (value or "").split(",") if item.strip()]


allowed_origins = _split_csv(settings.CORS_ALLOW_ORIGINS)
trusted_hosts = _split_csv(settings.TRUSTED_HOSTS)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins or ["http://localhost:8000"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

if trusted_hosts:
    app.add_middleware(TrustedHostMiddleware, allowed_hosts=trusted_hosts)

if settings.FORCE_HTTPS:
    app.add_middleware(HTTPSRedirectMiddleware)


@app.middleware("http")
async def security_headers(request: Request, call_next):
    response: Response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; "
        "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://fonts.googleapis.com; "
        "font-src 'self' https://fonts.gstatic.com https://cdn.jsdelivr.net data:; "
        "img-src 'self' data:; "
        "connect-src 'self'; "
        "frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
    )
    if settings.SECURITY_HSTS_SECONDS > 0:
        response.headers["Strict-Transport-Security"] = f"max-age={settings.SECURITY_HSTS_SECONDS}; includeSubDomains"
    return response

# Routers
app.include_router(auth.router)
app.include_router(usuarios.router)
app.include_router(setores.router)
app.include_router(pcp.router)
app.include_router(dashboard.router)
app.include_router(produtos.router)
app.include_router(producao_unidade.router)
app.include_router(teste_programacao.router)
app.include_router(alocacao_formas.router)
app.include_router(programacao_circular_s3.router)
app.include_router(programacao_circular_s4.router)
app.include_router(etiquetas_armaduras.router)

# Servir frontend como arquivos estáticos
_FRONTEND = os.path.join(os.path.dirname(__file__), "..", "frontend")
if os.path.isdir(_FRONTEND):
    app.mount("/static", StaticFiles(directory=os.path.join(_FRONTEND, "static")), name="static")

    @app.get("/", include_in_schema=False)
    def root():
        return FileResponse(os.path.join(_FRONTEND, "pages", "login.html"))

    @app.get("/{path:path}", include_in_schema=False)
    def catch_all(path: str):
        full = os.path.join(_FRONTEND, path)
        if os.path.isfile(full):
            return FileResponse(full)
        # Diretório: tenta index.html
        index = os.path.join(full, "index.html")
        if os.path.isfile(index):
            return FileResponse(index)
        return FileResponse(os.path.join(_FRONTEND, "pages", "login.html"))
