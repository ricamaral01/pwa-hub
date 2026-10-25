"""Legacy-compatible GET reports backed by the new VPS reporting mirror."""

from fastapi import FastAPI

from . import costs, legacy_reports, massadas


app = FastAPI(title="Usinas Campinas reports", docs_url=None, redoc_url=None,
              openapi_url=None)
app.include_router(costs.router, prefix="/api")
app.include_router(legacy_reports.router, prefix="/api")
app.include_router(massadas.router, prefix="/api")


@app.get("/health")
def health():
    return {"ok": True}
