"""CEC Pederneiras/Ribeirão: isolated schemas, the existing Lab session factory.

No engine, pool, background worker, legacy ERP cookie, or network client is
created here. The initial release is deliberately locked to the H database.
Campinas and Noroeste continue to use the existing cec_api and Node services.
"""
from __future__ import annotations

import base64
from contextlib import contextmanager
from datetime import date, datetime, timedelta
from decimal import Decimal, ROUND_HALF_UP
import hashlib
import json
from uuid import UUID, uuid4

from fastapi import APIRouter, HTTPException, Query, Request
from fastapi.encoders import jsonable_encoder
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import text
from sqlalchemy.exc import TimeoutError as PoolTimeout

from .cec_api import canonical_cp, parse_date, parse_qr
from .postes_api import gateway_user

UNITS = {
    'pederneiras': ('Pederneiras', 'lab_cec_pederneiras'),
    'ribeirao': ('Ribeirão Preto', 'lab_cec_ribeirao'),
}
EXPECTED_DATABASE = 'laboratorio_visual_homolog_20261118'


class Reading(BaseModel):
    model_config = ConfigDict(extra='ignore', allow_inf_nan=False)
    id: UUID | None = None
    qr_raw: str = Field(min_length=1, max_length=2000)
    traco: str | None = Field(default=None, max_length=200)
    numero_serie: str | None = Field(default=None, max_length=100)
    nome: str | None = Field(default=None, max_length=200)
    cp: str | None = None
    idade: int | None = Field(default=None, ge=1, le=365)
    data_moldagem: str | None = None
    hora_moldagem: str | None = None
    data_ruptura: str | None = None
    resistencia_mpa: Decimal = Field(ge=0, le=999999)
    timestamp: datetime | None = None
    queued_by: str | None = Field(default=None, max_length=100)


class Molding(BaseModel):
    model_config = ConfigDict(extra='forbid')
    massada_id: int = Field(gt=0)
    numero_serie: str = Field(min_length=1, max_length=100)
    traco: str = Field(min_length=1, max_length=100)
    data_moldagem: date
    idades: list[int] = Field(min_length=1, max_length=12)


def verified_actor(request, unit, operation):
    actor = gateway_user(request)
    if not actor:
        raise HTTPException(401, 'Sessão central do Uni necessária.')
    # gateway_user has already checked HMAC, expiry and loopback peer.
    encoded = request.headers['x-lab-assertion'].split('.', 1)[0]
    scope = json.loads(base64.urlsafe_b64decode(encoded + '=' * (-len(encoded) % 4)))
    if (scope.get('cec_unit') != unit or scope.get('cec_method') != request.method
            or scope.get('cec_operation') != operation):
        raise HTTPException(403, 'Acesso não concedido a esta unidade e operação do Laboratório.')
    return actor


def factory_for(request):
    factory = getattr(request.app.state, 'postes_session', None)
    engine = factory.kw.get('bind') if factory is not None else None
    if engine is None or engine.url.database != EXPECTED_DATABASE:
        raise HTTPException(503, 'Laboratório desta unidade disponível somente na homologação configurada.')
    return factory


@contextmanager
def session_for(request, write=False):
    try:
        factory = factory_for(request)
        with (factory.begin() if write else factory()) as session:
            yield session
    except PoolTimeout:
        raise HTTPException(503, 'Capacidade do Laboratório ocupada. Tente novamente.',
                            headers={'Retry-After': '2', 'X-Lab-Failure-Type': 'capacity'}) from None


def normalized_reading(item, unit, actor):
    if item.queued_by is not None and item.queued_by != actor.id:
        raise HTTPException(409, 'A leitura pendente pertence a outro usuário. Entre com a conta de origem.')
    qr = parse_qr(item.qr_raw)
    if qr.get('unidade') != unit:
        raise HTTPException(422, 'O QR pertence a outra unidade ou não identifica a unidade.')
    values = {}
    for field, key in [('traco', 'traco'), ('numero_serie', 'ns'), ('nome', 'nome')]:
        provided = getattr(item, field)
        encoded = qr.get(key)
        if provided and encoded and provided.strip() != encoded.strip():
            raise HTTPException(422, 'Os dados informados não correspondem ao QR.')
        values[field] = (provided or encoded or '').strip()
    cp = canonical_cp(item.cp or qr.get('cp'))
    if item.cp and qr.get('cp') and canonical_cp(item.cp) != canonical_cp(qr['cp']):
        raise HTTPException(422, 'O CP não corresponde ao QR.')
    try:
        age = int(qr.get('idade', ''))
    except ValueError:
        raise HTTPException(422, 'Idade inválida no QR.') from None
    if cp not in {'1', '2'} or not 1 <= age <= 365 or item.idade not in {None, age}:
        raise HTTPException(422, 'CP ou idade incompatível com o QR.')
    molding = parse_date(item.data_moldagem or qr.get('mold'))
    rupture = parse_date(item.data_ruptura or qr.get('rupt'))
    if (not values['traco'] or not values['numero_serie'] or not molding or not rupture
            or (date.fromisoformat(rupture) - date.fromisoformat(molding)).days != age):
        raise HTTPException(422, 'Traço, série e datas válidas são obrigatórios.')
    if (item.data_moldagem and qr.get('mold') and parse_date(qr['mold']) != molding
            or item.data_ruptura and qr.get('rupt') and parse_date(qr['rupt']) != rupture):
        raise HTTPException(422, 'As datas não correspondem ao QR.')
    return dict(values, unit=unit, cp=cp, idade_dias=age, data_moldagem=molding,
                data_ruptura=rupture, hora_moldagem=item.hora_moldagem or qr.get('hora'),
                mpa=str(item.resistencia_mpa.quantize(Decimal('.01'), rounding=ROUND_HALF_UP)),
                responsavel_id=actor.id, responsavel=actor.username, qr_raw=item.qr_raw,
                client_created_at=item.timestamp.isoformat() if item.timestamp else None)


def router_for(unit):
    if unit not in UNITS:
        raise ValueError('Unidade não suportada')
    name, schema = UNITS[unit]
    # schema is a fixed identifier from the server allowlist, never user input.
    router = APIRouter(prefix='/' + unit + '/cec-api')

    @router.get('/auth/me')
    def me(request: Request):
        actor = verified_actor(request, unit, 'auth/me')
        return {'id': actor.id, 'name': actor.username, 'unidade': unit}

    @router.get('/massadas')
    def batches(request: Request, data_ini: date | None = None, data_fim: date | None = None):
        verified_actor(request, unit, 'massadas')
        if data_ini and data_fim and data_ini > data_fim:
            raise HTTPException(422, 'Período inválido.')
        with session_for(request) as session:
            rows = session.execute(text(f'''SELECT id,produto,formula,data,hora,numero_serie,source_payload
                FROM {schema}.massadas
                WHERE (CAST(:ini AS date) IS NULL OR data>=CAST(:ini AS date))
                  AND (CAST(:fim AS date) IS NULL OR data<=CAST(:fim AS date)) ORDER BY data DESC,id DESC'''),
                {'ini': data_ini, 'fim': data_fim}).mappings().all()
        result=[]
        for row in rows:
            record=dict(row);raw=record.pop('source_payload') or {}
            result.append({**raw,**record})
        return jsonable_encoder(result)

    @router.post('/moldagens')
    def confirm(item: Molding, request: Request):
        actor = verified_actor(request, unit, 'moldagens')
        if len(set(item.idades)) != len(item.idades) or any(not 1 <= a <= 365 for a in item.idades):
            raise HTTPException(422, 'Idades válidas e sem repetição são obrigatórias.')
        with session_for(request, write=True) as session:
            batch = session.execute(text(f'SELECT formula,numero_serie FROM {schema}.massadas WHERE id=:id'),
                                    {'id': item.massada_id}).mappings().first()
            if (not batch or batch['formula'] != item.traco
                    or str(batch['numero_serie']) != item.numero_serie):
                raise HTTPException(422, 'Massada, traço ou série não pertence à unidade.')
            created = 0
            for age in sorted(item.idades):
                row = session.execute(text('''INSERT INTO public.laboratorio_cp_moldagem
                    (unidade_codigo,massada_id,numero_serie,traco,data_moldagem,idade_dias,
                     data_ruptura,responsavel_id,responsavel_nome)
                    VALUES (:unit,:massada,:serie,:traco,:mold,:age,:rupt,:actor,:name)
                    ON CONFLICT (unidade_codigo,massada_id,idade_dias) DO NOTHING RETURNING id'''),
                    {'unit': unit, 'massada': item.massada_id, 'serie': item.numero_serie,
                     'traco': item.traco, 'mold': item.data_moldagem, 'age': age,
                     'rupt': item.data_moldagem + timedelta(days=age),
                     'actor': actor.id, 'name': actor.username}).first()
                created += bool(row)
        return {'ok': True, 'created': created, 'registered': len(item.idades), 'unidade': unit}

    @router.post('/qrcp')
    def save(item: Reading, request: Request):
        actor = verified_actor(request, unit, 'qrcp')
        record = normalized_reading(item, unit, actor)
        serialized = json.dumps(record, ensure_ascii=False, sort_keys=True, separators=(',', ':'))
        digest = hashlib.sha256(serialized.encode()).hexdigest()
        identity = str(item.id or uuid4())
        params = {**record, 'id': identity, 'payload': serialized, 'digest': digest}
        with session_for(request, write=True) as session:
            batch = session.execute(text(f'''SELECT id FROM {schema}.massadas
                WHERE numero_serie=:numero_serie AND formula=:traco
                  AND data=CAST(:data_moldagem AS date) LIMIT 1'''), params).first()
            if not batch:
                raise HTTPException(422, 'A série e o traço do QR não constam nas massadas desta unidade.')
            # Both retry-by-ID and edits-by-natural-key are serialized. The key
            # includes series, matching the corrected Noroeste grouping.
            lock_key = '|'.join([unit, record['data_moldagem'], record['traco'],
                                 record['numero_serie'], str(record['idade_dias']), record['cp']])
            session.execute(text('SELECT pg_advisory_xact_lock(hashtextextended(:key,0))'),
                            {'key': 'cec-id|' + unit + '|' + identity})
            session.execute(text('SELECT pg_advisory_xact_lock(hashtextextended(:key,0))'), {'key': lock_key})
            existing = session.execute(text(f'''SELECT id,payload_digest,created_at,updated_at
                FROM {schema}.rompimentos WHERE id=CAST(:id AS uuid) FOR UPDATE'''),params).mappings().first()
            if existing and existing['payload_digest'] == digest:
                return jsonable_encoder({'ok': True, 'id': identity, 'unchanged': True,
                    'created_at': existing['created_at'], 'updated_at': existing['updated_at'], 'unidade': unit})
            if existing:
                # A client ID cannot be repurposed to move a different CP.
                old = session.execute(text(f'''SELECT numero_serie,traco_id,data_moldagem,idade_dias,cp
                    FROM {schema}.rompimentos WHERE id=CAST(:id AS uuid)'''),params).mappings().one()
                if (old['numero_serie'],old['traco_id'],str(old['data_moldagem']),old['idade_dias'],old['cp']) != (
                        record['numero_serie'],record['traco'],record['data_moldagem'],record['idade_dias'],record['cp']):
                    raise HTTPException(409, 'Este identificador já pertence a outro corpo de prova.')
            result = session.execute(text(f'''INSERT INTO {schema}.rompimentos
                (id,numero_serie,traco_id,idade_dias,cp,data_moldagem,hora_moldagem,data_ruptura,mpa,
                 responsavel_id,responsavel,qr_raw,payload_json,payload_digest,client_created_at)
                VALUES (CAST(:id AS uuid),:numero_serie,:traco,:idade_dias,:cp,CAST(:data_moldagem AS date),
                  :hora_moldagem,CAST(:data_ruptura AS date),CAST(:mpa AS numeric),:responsavel_id,
                  :responsavel,:qr_raw,CAST(:payload AS jsonb),:digest,CAST(:client_created_at AS timestamptz))
                ON CONFLICT (id) DO UPDATE SET mpa=excluded.mpa,responsavel_id=excluded.responsavel_id,
                  responsavel=excluded.responsavel,qr_raw=excluded.qr_raw,payload_json=excluded.payload_json,
                  payload_digest=excluded.payload_digest,updated_at=now()
                RETURNING id,created_at,updated_at'''),params).mappings().one()
            session.execute(text(f'''INSERT INTO {schema}.rompimentos_eventos
                (rompimento_id,tipo_evento,responsavel_id,payload_original)
                VALUES (CAST(:id AS uuid),:event,:responsavel_id,CAST(:payload AS jsonb))'''),
                {**params, 'event': 'UPDATE' if existing else 'INSERT'})
            # Updating a reading only marks this unit's existing molding row.
            field = 'cp1_resultado_em' if record['cp'] == '1' else 'cp2_resultado_em'
            session.execute(text(f'''UPDATE public.laboratorio_cp_moldagem SET {field}=now()
                WHERE unidade_codigo=:unit AND numero_serie=:numero_serie AND traco=:traco
                  AND data_moldagem=CAST(:data_moldagem AS date) AND idade_dias=:idade_dias
                  AND {field} IS NULL'''),params)
        return jsonable_encoder({'ok': True, **dict(result), 'unchanged': False, 'unidade': unit})

    @router.get('/qrcp')
    def readings(request: Request, limit: int = Query(default=50, ge=1, le=200)):
        verified_actor(request, unit, 'qrcp')
        with session_for(request) as session:
            rows = session.execute(text(f'''SELECT id,traco_id AS traco,numero_serie,
                payload_json->>'nome' AS nome,cp||'/2' AS cp,idade_dias AS idade,
                data_moldagem,hora_moldagem,data_ruptura,mpa AS resistencia_mpa,
                responsavel_id,responsavel,qr_raw,created_at FROM {schema}.rompimentos
                ORDER BY created_at DESC,id DESC LIMIT :limit'''),{'limit':limit}).mappings().all()
        return jsonable_encoder([dict(row) for row in rows])

    @router.delete('/qrcp/{item_id}')
    def delete(item_id: str, request: Request):
        verified_actor(request, unit, 'qrcp/' + item_id)
        raise HTTPException(405, 'Exclusão de rompimento desabilitada para preservar o histórico.')

    @router.get('/rompimentos-grupos')
    def groups(request: Request, limit: int = Query(default=1000,ge=1,le=5000),
               offset: int = Query(default=0,ge=0),ano: int | None = Query(default=None,ge=2020,le=2040),
               mes: int | None = Query(default=None,ge=1,le=12)):
        verified_actor(request, unit, 'rompimentos-grupos')
        with session_for(request) as session:
            rows = session.execute(text(f'''SELECT * FROM {schema}.rompimentos_grupos
                WHERE (CAST(:ano AS integer) IS NULL OR extract(year from data_moldagem)=:ano)
                  AND (CAST(:mes AS integer) IS NULL OR extract(month from data_moldagem)=:mes)
                ORDER BY data_moldagem DESC,traco_id,numero_serie,idade_dias
                LIMIT :limit OFFSET :offset'''),{'ano':ano,'mes':mes,'limit':limit+1,'offset':offset}).mappings().all()
        return jsonable_encoder({'success':True,'source':'unificado-'+unit,
            'generated_at':datetime.now().astimezone().isoformat(),'count':min(len(rows),limit),
            'pagination':{'limit':limit,'offset':offset,'has_more':len(rows)>limit},
            'rows':[dict(row) for row in rows[:limit]]})

    return router
