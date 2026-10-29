import re
from datetime import date, datetime
from typing import List

from fastapi import APIRouter, Depends, Header, HTTPException, Query, Request
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import require_roles
from app.models.etiquetas_armaduras import EtiquetaArmaduraModelo, SaqueMandril
from app.models.usuario import NivelAcesso
from app.services.etiquetas_word import parse_word

router = APIRouter(prefix='/api', tags=['etiquetas-armaduras'])
_READ = (NivelAcesso.ADMIN, NivelAcesso.PCP, NivelAcesso.PRODUCAO, NivelAcesso.CONSULTA)
_ADMIN = (NivelAcesso.ADMIN,)
_MAP_ORIGIN = 'https://usina.concretrack.com.br'


def _map_write(origin: str = Header('')):
    if origin != _MAP_ORIGIN:
        raise HTTPException(status_code=403, detail='Registro disponível apenas no Mapa de Produção')


def _forma(value: str) -> str:
    match = re.fullmatch(r'SC0*([1-9]|[1-4][0-9]|5[0-2])', value.strip().upper().replace('-', '').replace(' ', ''))
    if not match:
        raise HTTPException(status_code=422, detail='Forma SC inválida')
    return f'SC{int(match.group(1)):02d}'


def _saque_dict(row: SaqueMandril) -> dict:
    return {'data': row.data.isoformat(), 'codigo_forma': row.codigo_forma,
            'data_hora_saque': row.data_hora_saque.isoformat() if row.data_hora_saque else None}


class SaqueInput(BaseModel):
    data: date
    codigo_forma: str
    data_hora_saque: datetime


class ImportInput(BaseModel):
    registros: List[SaqueInput] = Field(default_factory=list, max_length=5000)


@router.get('/saques-mandril')
def listar_saques(data: date = Query(...), db: Session = Depends(get_db)):
    rows = db.query(SaqueMandril).filter(SaqueMandril.data == data, SaqueMandril.ativo.is_(True)).order_by(SaqueMandril.codigo_forma).all()
    return [_saque_dict(row) for row in rows]


@router.post('/saques-mandril', dependencies=[Depends(_map_write)])
def registrar_saque(payload: SaqueInput, db: Session = Depends(get_db)):
    forma = _forma(payload.codigo_forma)
    row = db.query(SaqueMandril).filter(SaqueMandril.data == payload.data, SaqueMandril.codigo_forma == forma).first()
    if row is None:
        row = SaqueMandril(data=payload.data, codigo_forma=forma)
        db.add(row)
    row.data_hora_saque = payload.data_hora_saque
    row.ativo = True
    db.commit()
    db.refresh(row)
    return _saque_dict(row)


@router.post('/saques-mandril/importar', dependencies=[Depends(_map_write)])
def importar_saques(payload: ImportInput, db: Session = Depends(get_db)):
    created = 0
    for item in payload.registros:
        forma = _forma(item.codigo_forma)
        existing = db.query(SaqueMandril).filter(SaqueMandril.data == item.data, SaqueMandril.codigo_forma == forma).first()
        if existing is None:
            db.add(SaqueMandril(data=item.data, codigo_forma=forma, data_hora_saque=item.data_hora_saque, ativo=True))
            created += 1
    db.commit()
    return {'importados': created}


@router.delete('/saques-mandril', status_code=204, dependencies=[Depends(_map_write)])
def limpar_saque(data: date = Query(...), codigo_forma: str = Query(...), db: Session = Depends(get_db)):
    forma = _forma(codigo_forma)
    row = db.query(SaqueMandril).filter(SaqueMandril.data == data, SaqueMandril.codigo_forma == forma).first()
    if row:
        row.ativo = False
        db.commit()


@router.get('/etiquetas-armaduras/modelos')
def listar_modelos_armaduras(db: Session = Depends(get_db), _=Depends(require_roles(*_READ))):
    rows = db.query(EtiquetaArmaduraModelo).filter(EtiquetaArmaduraModelo.ativo.is_(True)).order_by(EtiquetaArmaduraModelo.source_index).all()
    return [{
        'id': row.id, 'source_index': row.source_index, 'modelo': row.modelo, 'variante': row.variante,
        'titulo': row.titulo, 'engastamento': row.engastamento, 'cg': row.cg,
        'entrada_pino': row.entrada_pino, 'saida_pino': row.saida_pino,
        'peso_kg': float(row.peso_kg) if row.peso_kg is not None else None,
        'peso_texto': row.peso_texto,
    } for row in rows]


@router.get('/etiquetas-armaduras/fonte')
def fonte_armaduras(db: Session = Depends(get_db), _=Depends(require_roles(*_READ))):
    rows = db.query(EtiquetaArmaduraModelo).filter(EtiquetaArmaduraModelo.ativo.is_(True)).all()
    versions = {row.source_sha256 for row in rows}
    return {'sha256': next(iter(versions)) if len(versions) == 1 else None,
            'modelos': len(rows), 'consistente': len(versions) == 1}


@router.put('/etiquetas-armaduras/word')
async def atualizar_word_armaduras(request: Request, db: Session = Depends(get_db),
                                   _=Depends(require_roles(*_ADMIN))):
    data = await request.body()
    try:
        sha, entries = parse_word(data)
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
    current = db.query(EtiquetaArmaduraModelo.source_sha256).filter(
        EtiquetaArmaduraModelo.ativo.is_(True)).first()
    if current and current[0] == sha:
        return {'sha256': sha, 'modelos': len(entries), 'atualizado': False}
    try:
        db.query(EtiquetaArmaduraModelo).delete(synchronize_session=False)
        db.add_all(EtiquetaArmaduraModelo(**entry) for entry in entries)
        db.commit()
    except Exception:
        db.rollback()
        raise
    return {'sha256': sha, 'modelos': len(entries), 'atualizado': True}
