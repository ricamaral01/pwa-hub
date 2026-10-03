import json
import re
import unicodedata
from datetime import date, timedelta
from pathlib import Path
from typing import List, Optional

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import require_roles
from app.models.produto import Produto
from app.models.programacao_circular_s4 import ProgramacaoCircularS4
from app.models.usuario import NivelAcesso

router = APIRouter(prefix='/api/programacao-circular-s4', tags=['programacao-circular-s4'])
_READ = (NivelAcesso.ADMIN, NivelAcesso.PCP, NivelAcesso.PRODUCAO, NivelAcesso.CONSULTA)
_WRITE = (NivelAcesso.ADMIN, NivelAcesso.PCP)
_CATALOG_PATH = Path(__file__).resolve().parents[2] / 'data' / 'layout_formas_s4.json'


def _normalize(value: str) -> str:
    plain = unicodedata.normalize('NFKD', value.replace('×', 'X').lower()).encode('ascii', 'ignore').decode('ascii')
    return re.sub(r'[^a-z0-9]', '', plain)


def _layout() -> dict:
    return json.loads(_CATALOG_PATH.read_text(encoding='utf-8'))


def _catalog(db: Session) -> list:
    products = db.query(Produto).filter(Produto.setor_id == 4).all()
    by_name = {_normalize(product.nome.removesuffix(' DT')): product for product in products}
    result = []
    for form, models in _layout().items():
        result.append({
            'codigo_forma': form,
            'aviso': None,
            'modelos': [{
                'nome': model,
                'produto_id': by_name[_normalize(model)].id if _normalize(model) in by_name else None,
                'codigo_produto': by_name[_normalize(model)].codigo if _normalize(model) in by_name else None,
                'peso': float(by_name[_normalize(model)].peso) if _normalize(model) in by_name and by_name[_normalize(model)].peso is not None else None,
                'volume': float(by_name[_normalize(model)].volume) if _normalize(model) in by_name and by_name[_normalize(model)].volume is not None else None,
            } for model in models],
        })
    return result


def _model_for(catalog: dict, form: str, model: str) -> dict:
    if form not in catalog:
        raise HTTPException(status_code=400, detail=f'Forma inválida: {form}')
    option = next((item for item in catalog[form]['modelos'] if item['nome'] == model), None)
    if option is None:
        raise HTTPException(status_code=400, detail=f'Modelo {model} não compatível com {form}')
    return option


def _fill(row: ProgramacaoCircularS4, model: str, option: dict, origin: str) -> None:
    row.modelo = model
    row.produto_id = option['produto_id']
    row.codigo_produto = option['codigo_produto']
    row.peso_kg = option['peso']
    row.volume_m3_unitario = option['volume']
    row.origem = origin


def _as_dict(row: ProgramacaoCircularS4) -> dict:
    return {
        'id': row.id, 'data': row.data.isoformat(), 'codigo_forma': row.codigo_forma,
        'modelo': row.modelo, 'produto_id': row.produto_id,
        'codigo_produto': row.codigo_produto,
        'peso': float(row.peso_kg) if row.peso_kg is not None else None,
        'volume': float(row.volume_m3_unitario) if row.volume_m3_unitario is not None else None,
        'origem': row.origem,
    }


class FormSelection(BaseModel):
    codigo_forma: str
    modelo: str


class PeriodPayload(BaseModel):
    data_inicio: date
    dias: int = Field(ge=1, le=90)
    selecoes: List[FormSelection] = Field(max_length=15)
    limpar_formas: List[str] = Field(default_factory=list, max_length=15)


class DayPayload(BaseModel):
    data: date
    codigo_forma: str
    modelo: str


@router.get('/catalogo')
def catalogo(db: Session = Depends(get_db), _=Depends(require_roles(*_READ))):
    return _catalog(db)


@router.get('')
def listar(data_inicio: date = Query(...), dias: int = Query(..., ge=1, le=90),
           db: Session = Depends(get_db), _=Depends(require_roles(*_READ))):
    end = data_inicio + timedelta(days=dias - 1)
    rows = db.query(ProgramacaoCircularS4).filter(
        ProgramacaoCircularS4.data >= data_inicio, ProgramacaoCircularS4.data <= end
    ).order_by(ProgramacaoCircularS4.data, ProgramacaoCircularS4.codigo_forma).all()
    return [_as_dict(row) for row in rows]


@router.post('/periodo')
def salvar_periodo(payload: PeriodPayload, db: Session = Depends(get_db), _=Depends(require_roles(*_WRITE))):
    catalog = {item['codigo_forma']: item for item in _catalog(db)}
    if not payload.selecoes and not payload.limpar_formas:
        raise HTTPException(status_code=400, detail='Selecione ou limpe ao menos uma forma')
    if len({item.codigo_forma for item in payload.selecoes}) != len(payload.selecoes):
        raise HTTPException(status_code=400, detail='Cada forma deve aparecer uma vez')
    if len(set(payload.limpar_formas)) != len(payload.limpar_formas):
        raise HTTPException(status_code=400, detail='Forma repetida na limpeza')
    if set(payload.limpar_formas) & {item.codigo_forma for item in payload.selecoes}:
        raise HTTPException(status_code=400, detail='Forma selecionada e limpa ao mesmo tempo')
    if any(form not in catalog for form in payload.limpar_formas):
        raise HTTPException(status_code=400, detail='Forma inválida na limpeza')
    validated = [(item, _model_for(catalog, item.codigo_forma, item.modelo)) for item in payload.selecoes]
    end = payload.data_inicio + timedelta(days=payload.dias - 1)
    forms = [item.codigo_forma for item, _ in validated] + payload.limpar_formas
    existing = db.query(ProgramacaoCircularS4).filter(
        ProgramacaoCircularS4.data >= payload.data_inicio,
        ProgramacaoCircularS4.data <= end,
        ProgramacaoCircularS4.codigo_forma.in_(forms),
    ).all()
    by_key = {(row.data, row.codigo_forma): row for row in existing}
    created = updated = 0
    removed = 0
    for row in existing:
        if row.codigo_forma in payload.limpar_formas and row.origem != 'excecao':
            db.delete(row)
            removed += 1
    for offset in range(payload.dias):
        day = payload.data_inicio + timedelta(days=offset)
        for item, option in validated:
            key = (day, item.codigo_forma)
            row = by_key.get(key)
            if row is None:
                row = ProgramacaoCircularS4(data=day, codigo_forma=item.codigo_forma)
                db.add(row)
                created += 1
            elif row.origem == 'excecao':
                continue  # salvar o período preserva alterações individuais
            else:
                updated += 1
            _fill(row, item.modelo, option, 'periodo')
    db.commit()
    return {'criados': created, 'atualizados': updated, 'removidos': removed,
            'excecoes_preservadas': len([r for r in existing if r.origem == 'excecao'])}


@router.patch('/dia')
def salvar_dia(payload: DayPayload, db: Session = Depends(get_db), _=Depends(require_roles(*_WRITE))):
    catalog = {item['codigo_forma']: item for item in _catalog(db)}
    option = _model_for(catalog, payload.codigo_forma, payload.modelo)
    row = db.query(ProgramacaoCircularS4).filter(
        ProgramacaoCircularS4.data == payload.data,
        ProgramacaoCircularS4.codigo_forma == payload.codigo_forma,
    ).first()
    if row is None:
        row = ProgramacaoCircularS4(data=payload.data, codigo_forma=payload.codigo_forma)
        db.add(row)
    _fill(row, payload.modelo, option, 'excecao')
    db.commit()
    db.refresh(row)
    return _as_dict(row)


@router.delete('/dia', status_code=204)
def apagar_dia(data: date = Query(...), codigo_forma: str = Query(...),
               db: Session = Depends(get_db), _=Depends(require_roles(*_WRITE))):
    row = db.query(ProgramacaoCircularS4).filter(
        ProgramacaoCircularS4.data == data,
        ProgramacaoCircularS4.codigo_forma == codigo_forma,
    ).first()
    if row:
        db.delete(row)
        db.commit()


@router.get('/relatorio')
def relatorio(data_inicio: date = Query(...), dias: int = Query(6, ge=1, le=90),
              db: Session = Depends(get_db), _=Depends(require_roles(*_READ))):
    end = data_inicio + timedelta(days=dias - 1)
    assignments = db.query(ProgramacaoCircularS4).filter(
        ProgramacaoCircularS4.data >= data_inicio,
        ProgramacaoCircularS4.data <= end,
    ).order_by(ProgramacaoCircularS4.modelo, ProgramacaoCircularS4.data).all()
    calendar = [data_inicio + timedelta(days=offset) for offset in range(dias)]
    lines = {}
    missing_by_day = {day.isoformat(): 0 for day in calendar}
    for row in assignments:
        line = lines.setdefault(row.modelo, {
            'descricao': row.modelo, 'codigo_producao': row.codigo_produto or '',
            'peso': float(row.peso_kg) if row.peso_kg is not None else None,
            'setor': 4, 'dias': {},
        })
        day = row.data.isoformat()
        cell = line['dias'].setdefault(day, {'programado': 0, 'volume_programado': 0})
        cell['programado'] += 1
        if row.volume_m3_unitario is None or not row.volume_m3_unitario:
            missing_by_day[day] += 1
        else:
            cell['volume_programado'] += float(row.volume_m3_unitario)
    return {
        'data_inicio': data_inicio.isoformat(), 'data_fim': end.isoformat(),
        'dias': [{'data': day.isoformat(), 'rotulo': day.strftime('%d/%m/%y')} for day in calendar],
        'linhas': list(lines.values()), 'volume_pendente_por_dia': missing_by_day,
    }
