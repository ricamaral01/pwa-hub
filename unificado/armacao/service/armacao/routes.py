"""Armação HTTP API, composed by stage without changing existing routers."""
from fastapi import APIRouter, Depends

from .auth import same_origin
from .cadastros import router as cadastros
from .bobinas import router as bobinas
from .corte import router as corte
from .banca import router as banca
from .fechamento import router as fechamento
from .rastreio import router as rastreio

router = APIRouter(prefix="/api/armacao", dependencies=[Depends(same_origin)])
router.include_router(cadastros)
router.include_router(bobinas)
router.include_router(corte)
router.include_router(banca)
router.include_router(fechamento)
router.include_router(rastreio)

