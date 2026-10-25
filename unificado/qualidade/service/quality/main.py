from fastapi import FastAPI

from .api import router

app = FastAPI(title="Qualidade — Não Conformidades", version="0.1.0", docs_url=None, redoc_url=None)
app.include_router(router)
