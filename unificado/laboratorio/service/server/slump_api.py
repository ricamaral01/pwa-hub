"""Slump and flow records for the unified laboratory."""
from __future__ import annotations

from datetime import datetime, timezone
from decimal import Decimal
from typing import Literal
from uuid import uuid4
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator
from sqlalchemy import text
from sqlalchemy.orm import Session

from .postes_api import current_user, db

router = APIRouter(prefix='/api/slump', tags=['slump'])
LOCAL_TIMEZONE = ZoneInfo('America/Sao_Paulo')


class SlumpInput(BaseModel):
    model_config = ConfigDict(extra='forbid')

    massada: str = Field(pattern=r'^\d{6}$')
    tipo: Literal['slump', 'flow']
    valor: Decimal = Field(gt=0, le=9999.99, max_digits=6, decimal_places=2)
    origem_horario: Literal['automatico', 'manual'] = 'automatico'
    medido_em_local: datetime | None = None

    @field_validator('valor', mode='before')
    @classmethod
    def accept_decimal_comma(cls, value):
        return value.replace(',', '.') if isinstance(value, str) else value

    @model_validator(mode='after')
    def check_time(self):
        if self.origem_horario == 'manual':
            if self.medido_em_local is None or self.medido_em_local.tzinfo is not None:
                raise ValueError('Informe data e hora local para o registro manual.')
            if not 2020 <= self.medido_em_local.year <= 2100:
                raise ValueError('Informe uma data entre 2020 e 2100.')
        elif self.medido_em_local is not None:
            raise ValueError('A data manual deve ficar vazia no registro automático.')
        return self


def as_record(row):
    return {
        'id': row.id,
        'massada': row.massada,
        'tipo': row.tipo,
        'valor': float(row.valor),
        'unidade': row.unidade,
        'medido_em': row.medido_em.isoformat(),
        'origem_horario': row.origem_horario,
        'criado_em': row.criado_em.isoformat(),
        'criado_por': row.criado_por,
    }


@router.get('')
def list_records(session: Session = Depends(db), user=Depends(current_user)):
    rows = session.execute(text('''
        SELECT id, massada, tipo, valor, unidade, medido_em, origem_horario,
               criado_em, criado_por
        FROM ensaio_postes.slump_registro
        ORDER BY criado_em DESC, id DESC LIMIT 30
    ''')).mappings().all()
    return {'records': [as_record(row) for row in rows]}


@router.post('', status_code=201)
def create_record(payload: SlumpInput, session: Session = Depends(db), user=Depends(current_user)):
    now = datetime.now(timezone.utc)
    measured_at = (payload.medido_em_local.replace(tzinfo=LOCAL_TIMEZONE).astimezone(timezone.utc)
                   if payload.origem_horario == 'manual' else now)
    if payload.origem_horario == 'manual' and measured_at.astimezone(LOCAL_TIMEZONE).replace(tzinfo=None) != payload.medido_em_local:
        raise HTTPException(422, 'Data e hora local inexistente.')
    row = session.execute(text('''
        INSERT INTO ensaio_postes.slump_registro
          (id, massada, tipo, valor, unidade, medido_em, origem_horario, criado_em, criado_por)
        VALUES
          (:id, :massada, :tipo, :valor, :unidade, :medido_em, :origem_horario, :criado_em, :criado_por)
        RETURNING id, massada, tipo, valor, unidade, medido_em, origem_horario,
                  criado_em, criado_por
    '''), {
        'id': str(uuid4()), 'massada': payload.massada, 'tipo': payload.tipo,
        'valor': payload.valor, 'unidade': 'cm' if payload.tipo == 'slump' else 'mm',
        'medido_em': measured_at, 'origem_horario': payload.origem_horario,
        'criado_em': now, 'criado_por': user.username,
    }).mappings().one()
    session.commit()
    return as_record(row)
