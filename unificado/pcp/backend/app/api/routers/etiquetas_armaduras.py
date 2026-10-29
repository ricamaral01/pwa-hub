import re
from datetime import date, datetime
from typing import List

from fastapi import APIRouter, Depends, Header, HTTPException, Query, Request, Response
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import require_roles
from app.models.etiquetas_armaduras import EtiquetaArmaduraFonte, EtiquetaArmaduraModelo, SaqueMandril
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
    sha = next(iter(versions)) if len(versions) == 1 else None
    source = db.query(EtiquetaArmaduraFonte).filter(
        EtiquetaArmaduraFonte.source_sha256 == sha).first() if sha else None
    return {'sha256': sha, 'modelos': len(rows),
            'consistente': bool(source and source.quantidade_modelos == len(rows)),
            'arquivo_guardado': bool(source),
            'nome_arquivo': source.nome_arquivo if source else None,
            'enviado_em': source.enviado_em.isoformat() if source else None}


@router.get('/etiquetas-armaduras/word')
def baixar_word_armaduras(db: Session = Depends(get_db), _=Depends(require_roles(*_ADMIN))):
    current = db.query(EtiquetaArmaduraModelo.source_sha256).filter(
        EtiquetaArmaduraModelo.ativo.is_(True)).first()
    source = db.query(EtiquetaArmaduraFonte).filter(
        EtiquetaArmaduraFonte.source_sha256 == current[0]).first() if current else None
    if not source:
        raise HTTPException(status_code=404, detail='Word das armaduras ainda não guardado no banco.')
    return Response(content=source.conteudo_docx,
                    media_type='application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    headers={'Content-Disposition': 'attachment; filename="etiquetas-armaduras.docx"'})


@router.put('/etiquetas-armaduras/word')
async def atualizar_word_armaduras(request: Request, db: Session = Depends(get_db),
                                   filename: str = Query(default='etiquetas-armaduras.docx'),
                                   user=Depends(require_roles(*_ADMIN))):
    data = await request.body()
    try:
        sha, entries = parse_word(data)
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
    name = filename.replace('\\', '/').rsplit('/', 1)[-1].strip()[:255]
    if not name.lower().endswith('.docx'):
        raise HTTPException(status_code=422, detail='O nome do arquivo deve terminar em .docx.')
    current = db.query(EtiquetaArmaduraModelo.source_sha256).filter(
        EtiquetaArmaduraModelo.ativo.is_(True)).first()
    previous = db.query(EtiquetaArmaduraFonte).filter(
        EtiquetaArmaduraFonte.source_sha256 == sha).first()
    if previous and (not current or current[0] != sha):
        raise HTTPException(status_code=409, detail='Esta versão antiga do Word já foi usada. Envie a revisão atual.')
    try:
        if not previous:
            db.add(EtiquetaArmaduraFonte(source_sha256=sha, nome_arquivo=name,
                conteudo_docx=data, quantidade_modelos=len(entries), enviado_por=user.id))
        updated = not current or current[0] != sha
        if updated:
            db.query(EtiquetaArmaduraModelo).delete(synchronize_session=False)
            db.add_all(EtiquetaArmaduraModelo(**entry) for entry in entries)
        if not previous or updated:
            db.commit()
    except Exception:
        db.rollback()
        raise
    return {'sha256': sha, 'modelos': len(entries), 'atualizado': updated,
            'arquivo_guardado': True}
