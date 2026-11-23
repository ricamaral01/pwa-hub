from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routes import router

app = FastAPI(title="Armação Concrefer", docs_url=None, redoc_url=None)
app.add_middleware(CORSMiddleware, allow_origins=["https://concrefer.concretrack.com.br", "http://localhost:5173"],
                   allow_credentials=True, allow_methods=["GET", "POST", "PUT"],
                   allow_headers=["Content-Type", "X-Unidade"])
app.include_router(router)


@app.get("/health")
def health():
    return {"ok": True}
