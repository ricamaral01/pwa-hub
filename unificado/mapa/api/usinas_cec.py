"""Campinas CEC on the new VPS, protected by the Unificado session."""

from __future__ import annotations

from datetime import datetime, timezone
import json
import math
import urllib.error
import urllib.parse
import urllib.request
from uuid import UUID, uuid4

from flask import Response, jsonify, request


BASE = "http://127.0.0.1:3086"
READS = {
    "leituras": "/api/v1/rompimentos",
    "resultados": "/api/controle-estatistico/v2/rompimentos-grupos",
    "estatistica-diaria": "/api/controle-estatistico/v2/estatistica-diaria",
    "estatistica-mensal": "/api/controle-estatistico/v2/estatistica-mensal",
}


def _parse_date(value):
    if not value:
        return None
    for pattern in ("%Y-%m-%d", "%d-%m-%y", "%d-%m-%Y", "%d/%m/%Y"):
        try:
            return datetime.strptime(str(value).strip(), pattern).date().isoformat()
        except ValueError:
            pass
    return None


def _parse_qr(raw):
    result = {}
    for part in raw.split("|"):
        if "=" in part:
            name, value = part.split("=", 1)
            result[name.strip().lower()] = value.strip()
    return result


def _request_node(path, method="GET", payload=None):
    url = BASE + path
    if method == "GET" and request.query_string:
        url += "?" + request.query_string.decode("ascii", errors="strict")
    headers = {"Accept": "application/json"}
    body = None
    if payload is not None:
        headers["Content-Type"] = "application/json"
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    upstream = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        result = urllib.request.urlopen(upstream, timeout=25)
    except urllib.error.HTTPError as exc:
        result = exc
    except (urllib.error.URLError, TimeoutError):
        return jsonify(ok=False, error="Serviço CEC indisponível."), 503
    data = result.read(4 * 1024 * 1024 + 1)
    status = result.status
    result.close()
    if len(data) > 4 * 1024 * 1024:
        return jsonify(ok=False, error="Resposta CEC acima do limite."), 502
    response = Response(data, status=status, content_type="application/json")
    response.headers["Cache-Control"] = "no-store"
    return response


def register(app, authenticated_user, screen_access_state):
    def user_or_error():
        user = authenticated_user()
        if not user:
            return None, (jsonify(ok=False, error="Sessão expirada."), 401)
        screens, _ = screen_access_state(user)
        if "usinasInicio" not in screens:
            return None, (jsonify(ok=False, error="Sem acesso ao CEC."), 403)
        return user, None

    @app.get("/usina/cec/<path:page>")
    def cec_read(page):
        _, denied = user_or_error()
        if denied:
            return denied
        if page not in READS:
            return jsonify(ok=False, error="Consulta inexistente."), 404
        if len(request.query_string) > 2048:
            return jsonify(ok=False, error="Filtro muito longo."), 400
        return _request_node(READS[page])

    @app.post("/usina/cec/leituras")
    def cec_write():
        user, denied = user_or_error()
        if denied:
            return denied
        if request.content_length is not None and request.content_length > 4096:
            return jsonify(ok=False, error="Leitura acima do limite."), 413
        origin = request.headers.get("Origin")
        if origin and (urllib.parse.urlsplit(origin).netloc != request.host
                       or urllib.parse.urlsplit(origin).scheme not in ("https", "http")):
            return jsonify(ok=False, error="Origem inválida."), 403
        item = request.get_json(silent=True) or {}
        raw = item.get("qr_raw")
        if not isinstance(raw, str) or not raw or len(raw) > 2000:
            return jsonify(ok=False, error="QR inválido."), 400
        parsed = _parse_qr(raw)
        traco = item.get("traco") or parsed.get("traco")
        cp = str(item.get("cp") or parsed.get("cp") or "").strip().lstrip("'")
        if cp in ("1/2", "2/2"):
            cp = cp[0]
        try:
            idade = int(item.get("idade") or parsed.get("idade"))
            mpa = float(str(item.get("resistencia_mpa")).replace(",", "."))
        except (ValueError, TypeError):
            return jsonify(ok=False, error="Informe idade e resistência MPa válidas."), 400
        if not traco or len(str(traco)) > 200 or not cp or len(cp) > 20 or not 0 < idade <= 365 or not math.isfinite(mpa) or not 0 < mpa <= 150:
            return jsonify(ok=False, error="QR, idade, CP e resistência válidos são obrigatórios."), 400
        try:
            record_id = str(UUID(str(item.get("id")))) if item.get("id") else str(uuid4())
        except ValueError:
            return jsonify(ok=False, error="ID da leitura inválido."), 400
        payload = {
            "id": record_id, "source": "unificado-cec", "etiqueta_id": raw,
            "traco_id": str(traco), "cp": cp, "idade_dias": idade,
            "data_moldagem": _parse_date(item.get("data_moldagem") or parsed.get("mold")),
            "hora_moldagem": item.get("hora_moldagem") or parsed.get("hora"),
            "data_ruptura": _parse_date(item.get("data_ruptura") or parsed.get("rupt")),
            "mpa": mpa, "responsavel": user.get("nome") or user.get("name") or user.get("login") or user.get("id"),
            "qr_raw": raw, "timestamp": item.get("timestamp") or datetime.now(timezone.utc).isoformat(),
            "numero_serie": item.get("numero_serie") or parsed.get("ns"),
            "nome": item.get("nome") or parsed.get("nome"),
        }
        return _request_node("/api/v1/rompimentos", "POST", payload)
