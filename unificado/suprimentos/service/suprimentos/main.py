"""API isolada de Suprimentos."""
from fastapi import FastAPI
from .api.cadastros import router as cadastros_router
from .api.solicitacoes import router as solicitacoes_router
from .api.compras import router as compras_router

app = FastAPI(title="Suprimentos — Unificado", docs_url=None, redoc_url=None)
app.include_router(cadastros_router)
app.include_router(solicitacoes_router)
app.include_router(compras_router)
