from typing import Optional
from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import require_roles
from app.models.usuario import NivelAcesso
from app.schemas.dashboard import DashboardResponse, VolumeTotalResponse
from app.services.dashboard_service import get_dashboard, get_volume_total

router = APIRouter(prefix="/api", tags=["dashboard"])

_LEITURA = (NivelAcesso.ADMIN, NivelAcesso.PCP, NivelAcesso.PRODUCAO, NivelAcesso.CONSULTA)


@router.get("/dashboard", response_model=DashboardResponse)
def dashboard(
    data_inicio: Optional[date] = Query(None),
    data_fim: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    _=Depends(require_roles(*_LEITURA)),
):
    return get_dashboard(db, data_inicio, data_fim)


@router.get("/volume-total", response_model=VolumeTotalResponse)
def volume_total(
    data_inicio: Optional[date] = Query(None),
    data_fim: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    _=Depends(require_roles(*_LEITURA)),
):
    return get_volume_total(db, data_inicio, data_fim)
