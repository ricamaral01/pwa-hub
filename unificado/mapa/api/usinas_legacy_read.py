"""Read-only Campinas ERP bridge under the Unificado session.

The old session is supplied by its normal login and kept in a separate,
HttpOnly cookie. Only explicit GET routes are forwarded to the fixed origin.
"""

from __future__ import annotations

from http.cookies import SimpleCookie
import re
import urllib.error
import urllib.parse
import urllib.request

from flask import Response, jsonify, request


ORIGIN = "https://dautomacao.com/concretrack/api"
COOKIE = "usinas_legacy_session"
COOKIE_PATH = "/unificado/mapa/api/usina/legacy"
ALLOWED = frozenset({
    "auth/me", "qrcp", "massadas", "relatorios/fechamento",
    "relatorios/fechamento-diario", "relatorios/cartas-traco",
    "relatorios/consumo", "relatorios/producao-periodo", "relatorios/custos",
    "estoque/materiais", "estoque/saldo", "estoque/movimentos",
    "estoque/silos", "estoque/silos/nivel", "estoque/relatorio",
    "estoque/config-massada", "estoque/consumo-producao",
    "estoque/consumo-agregados/analise",
})


def register(app, authenticated_user, screen_access_state):
    def allowed():
        user = authenticated_user()
        if not user:
            return jsonify(ok=False, error="Sessão expirada no Unificado."), 401
        screens, _ = screen_access_state(user)
        if "usinasInicio" not in screens:
            return jsonify(ok=False, error="Sem acesso a Usinas."), 403
        return None

    def upstream(path, *, method="GET", body=None, token=None):
        url = ORIGIN + "/" + path
        if method == "GET" and request.query_string:
            url += "?" + request.query_string.decode("ascii", errors="strict")
        headers = {"Accept": "application/json"}
        if token:
            headers["Cookie"] = "ct_session=" + token
        if body is not None:
            headers["Content-Type"] = "application/json"
        req = urllib.request.Request(url, data=body, headers=headers, method=method)
        try:
            return urllib.request.urlopen(req, timeout=20)
        except urllib.error.HTTPError as exc:
            return exc

    @app.post("/usina/legacy/login")
    def usina_legacy_login():
        denied = allowed()
        if denied:
            return denied
        origin = request.headers.get("Origin")
        if origin and (urllib.parse.urlsplit(origin).netloc != request.host
                       or urllib.parse.urlsplit(origin).scheme not in ("http", "https")):
            return jsonify(ok=False, error="Origem inválida."), 403
        body = request.get_json(silent=True) or {}
        username, password = body.get("username"), body.get("password")
        if not isinstance(username, str) or not isinstance(password, str) or not username or not password:
            return jsonify(ok=False, error="Informe usuário e senha do ConcreTrack."), 400
        if len(username) > 200 or len(password) > 1024:
            return jsonify(ok=False, error="Credenciais inválidas."), 400
        try:
            import json
            result = upstream("auth/login", method="POST", body=json.dumps({"username": username, "password": password}).encode())
        except (urllib.error.URLError, TimeoutError):
            return jsonify(ok=False, error="ConcreTrack indisponível."), 503
        status = result.status
        cookie = SimpleCookie()
        for header in result.headers.get_all("Set-Cookie", []):
            try:
                cookie.load(header)
            except Exception:
                pass
        result.close()
        if status != 200 or "ct_session" not in cookie:
            return jsonify(ok=False, error="Login antigo não autorizado."), status if status in (401, 403, 423) else 502
        response = jsonify(ok=True)
        response.set_cookie(COOKIE, cookie["ct_session"].value, path=COOKIE_PATH,
                            httponly=True, secure=True, samesite="Lax",
                            max_age=12 * 60 * 60)
        response.headers["Cache-Control"] = "no-store"
        return response

    @app.post("/usina/legacy/logout")
    def usina_legacy_logout():
        denied = allowed()
        if denied:
            return denied
        response = jsonify(ok=True)
        response.delete_cookie(COOKIE, path=COOKIE_PATH)
        response.headers["Cache-Control"] = "no-store"
        return response

    @app.get("/usina/legacy/<path:path>")
    def usina_legacy_get(path):
        denied = allowed()
        if denied:
            return denied
        if path not in ALLOWED or not re.fullmatch(r"[a-z0-9/-]+", path):
            return jsonify(ok=False, error="Consulta indisponível."), 404
        token = request.cookies.get(COOKIE)
        if not token:
            return jsonify(ok=False, error="Entre com sua conta antiga do ConcreTrack."), 401
        if len(request.query_string) > 2048:
            return jsonify(ok=False, error="Filtro muito longo."), 400
        try:
            result = upstream(path, token=token)
            body, status = result.read(4 * 1024 * 1024 + 1), result.status
            kind = result.headers.get("Content-Type", "application/json")
            result.close()
        except (urllib.error.URLError, TimeoutError):
            return jsonify(ok=False, error="ConcreTrack indisponível."), 503
        if len(body) > 4 * 1024 * 1024:
            return jsonify(ok=False, error="Resposta acima do limite."), 502
        response = Response(body, status=status,
                            content_type="application/json" if "json" in kind else "text/plain; charset=utf-8")
        response.headers["Cache-Control"] = "no-store"
        return response
