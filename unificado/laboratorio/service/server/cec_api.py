"""Legacy CEC screen contract backed exclusively by the Campinas database on this VPS."""
from __future__ import annotations

import json
from datetime import datetime
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen
from uuid import uuid4

from fastapi import APIRouter, HTTPException, Query, Request as FastAPIRequest
from fastapi.responses import JSONResponse
from pydantic import BaseModel


router = APIRouter(prefix='/cec-api')
BASE = 'http://127.0.0.1:3086'


def control(method: str, path: str, payload=None, params=None):
    url = BASE + path + (('?' + urlencode(params)) if params else '')
    body = json.dumps(payload, ensure_ascii=False).encode() if payload is not None else None
    req = Request(url, data=body, method=method,
                  headers={'Content-Type': 'application/json', 'Accept': 'application/json'})
    try:
        response = urlopen(req, timeout=25)
    except HTTPError as exc:
        response = exc
    except (URLError, TimeoutError) as exc:
        raise HTTPException(503, 'Serviço de Controle Estatístico indisponível.') from exc
    with response:
        status = response.status
        data = response.read(8 * 1024 * 1024 + 1)
    if len(data) > 8 * 1024 * 1024:
        raise HTTPException(502, 'Resposta acima do limite.')
    try:
        parsed = json.loads(data)
    except ValueError as exc:
        raise HTTPException(502, 'Resposta inválida do serviço CEC.') from exc
    if status >= 400:
        message = parsed.get('error', 'Falha no Controle Estatístico') if isinstance(parsed, dict) else 'Falha no Controle Estatístico'
        raise HTTPException(status, message)
    return parsed


def parse_qr(raw: str):
    parsed = {}
    for part in raw.split('|'):
        if '=' in part:
            key, value = part.split('=', 1)
            parsed[key.strip().lower()] = value.strip()
    return parsed


def parse_date(value):
    if not value or str(value).strip() in {'—', 'â€”'}:
        return None
    for fmt in ('%Y-%m-%d', '%d-%m-%y', '%d-%m-%Y', '%d/%m/%Y'):
        try:
            return datetime.strptime(str(value).strip(), fmt).date().isoformat()
        except ValueError:
            pass
    return None


def canonical_cp(value):
    value = str(value or '').strip().lstrip("'")
    return {'1/2': '1', '2/2': '2'}.get(value, value or None)


class Reading(BaseModel):
    id: str | None = None
    qr_raw: str
    traco: str | None = None
    numero_serie: str | None = None
    nome: str | None = None
    cp: str | None = None
    idade: int | None = None
    data_moldagem: str | None = None
    hora_moldagem: str | None = None
    data_ruptura: str | None = None
    resistencia_mpa: float | None = None
    timestamp: str | None = None


@router.get('/auth/me')
def auth_me(request: FastAPIRequest):
    # Nginx has authenticated the Unificado session and signed this request.
    from .postes_api import gateway_user
    user = gateway_user(request)
    if not user:
        raise HTTPException(401, 'Sessão do Unificado inválida.')
    return {'id': user.id, 'name': user.username}


@router.post('/qrcp')
def save_reading(item: Reading, request: FastAPIRequest):
    from .postes_api import gateway_user
    user = gateway_user(request)
    if not user:
        raise HTTPException(401, 'Sessão do Unificado inválida.')
    if len(item.qr_raw) > 2000:
        raise HTTPException(400, 'QR inválido.')
    parsed = parse_qr(item.qr_raw)
    traco = item.traco or parsed.get('traco')
    cp = canonical_cp(item.cp or parsed.get('cp'))
    try:
        idade = item.idade if item.idade is not None else int(parsed.get('idade', ''))
    except ValueError:
        idade = None
    if not traco or not cp or not idade or item.resistencia_mpa is None:
        raise HTTPException(400, 'QR, idade, CP e resistência MPa são obrigatórios.')
    record_id = item.id or str(uuid4())
    payload = {
        'id': record_id, 'source': 'erp-cec', 'etiqueta_id': item.qr_raw,
        'traco_id': traco, 'numero_serie': item.numero_serie or parsed.get('ns'),
        'nome': item.nome or parsed.get('nome'), 'cp': cp, 'idade_dias': idade,
        'data_moldagem': parse_date(item.data_moldagem or parsed.get('mold')),
        'hora_moldagem': item.hora_moldagem or parsed.get('hora'),
        'data_ruptura': parse_date(item.data_ruptura or parsed.get('rupt')),
        'mpa': item.resistencia_mpa,
        'responsavel': user.username,
        'qr_raw': item.qr_raw,
        'timestamp': item.timestamp or datetime.now().astimezone().isoformat(),
    }
    body = control('POST', '/api/v1/rompimentos', payload)
    record = body.get('record') or {}
    return {'ok': True, 'id': str(record.get('id') or record_id),
            'created_at': record.get('created_at'), 'updated_at': record.get('updated_at'),
            'unchanged': bool(record.get('unchanged')), 'source': 'controle_est_concre_campinas'}


@router.get('/qrcp')
def list_readings(limit: int = Query(default=50, ge=1, le=200)):
    body = control('GET', '/api/v1/rompimentos', params={'limit': limit})
    result = []
    for row in body.get('rows') or []:
        payload = row.get('payload_json') or {}
        raw = row.get('qr_raw') or payload.get('qr_raw') or ''
        parsed = parse_qr(raw)
        cp = str(row.get('cp') or '')
        result.append({
            'id': str(row.get('id') or ''), 'traco': row.get('traco_id'),
            'numero_serie': payload.get('numero_serie') or parsed.get('ns'),
            'nome': payload.get('nome') or parsed.get('nome'),
            'cp': {'1': '1/2', '2': '2/2'}.get(cp, cp or None),
            'idade': row.get('idade_dias'), 'data_moldagem': row.get('data_moldagem'),
            'hora_moldagem': row.get('hora_moldagem'), 'data_ruptura': row.get('data_ruptura'),
            'qr_raw': raw, 'created_at': row.get('created_at'),
            'resistencia_mpa': row.get('mpa'), 'responsavel': row.get('responsavel'),
        })
    return result


@router.delete('/qrcp/{item_id}')
def delete_reading(item_id: str):
    raise HTTPException(405, 'Exclusão de rompimento desabilitada para preservar o histórico.')


@router.get('/massadas')
def list_massadas(data_ini: str | None = None, data_fim: str | None = None):
    # ERP contract is a bare array; paginate the new VPS mirror without truncation.
    rows = []
    for page in range(201):
        result = control('GET', '/api/v1/massadas', params={
            'data_ini': data_ini or '', 'data_fim': data_fim or '',
            'limit': 500, 'offset': page * 500,
        })
        for row in result.get('rows') or []:
            # FastAPI/psycopg emitted DATE as YYYY-MM-DD in the ERP contract.
            # Keep the label's addDays() and QR payload byte-for-byte unchanged.
            if isinstance(row.get('data'), str):
                row['data'] = row['data'][:10]
            rows.append(row)
        if not result.get('has_more'):
            return JSONResponse(rows, headers={'Cache-Control': 'no-store'})
    raise HTTPException(502, 'Limite de paginação de massadas excedido.')


@router.get('/rompimentos-grupos')
def groups(limit: int = Query(default=1000, ge=1, le=5000), offset: int = Query(default=0, ge=0)):
    return control('GET', '/api/controle-estatistico/v2/rompimentos-grupos',
                   params={'limit': limit, 'offset': offset})
