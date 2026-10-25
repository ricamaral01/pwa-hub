"""Authenticated read-only proxy to the private Campinas reporting service."""

from __future__ import annotations

import os
import urllib.error
import urllib.request

from flask import Response, jsonify, request


REPORTS = frozenset({
    "relatorios/custos",
    "relatorios/cartas-traco",
    "relatorios/consumo",
    "relatorios/fechamento",
    "relatorios/fechamento-diario",
    "relatorios/producao-periodo",
    "relatorios/massadas",
})
BASE = os.environ.get("USINAS_REPORTING_API_URL", "http://127.0.0.1:3087/api/")


def register(app, connect, authenticated_user, screen_access_state):
    def allowed():
        user = authenticated_user()
        if not user:
            return jsonify(ok=False, error="Sessão expirada no Unificado."), 401
        screens, _ = screen_access_state(user)
        if not ({"usinasInicio", "labUsinasRelatorios"} & set(screens)) or user.get("perfil") == "CONVIDADO":
            return jsonify(ok=False, error="Sem acesso a Usinas."), 403
        return None

    @app.get("/usina/reporting/status")
    def usina_reporting_status():
        denied = allowed()
        if denied:
            return denied
        with connect() as conn, conn.cursor() as cur:
            cur.execute("""SELECT origem_tabela, last_success_at, source_count,
                                  mirror_count, last_error,
                                  EXTRACT(EPOCH FROM now()-last_success_at) AS age_seconds
                           FROM usinas.sync_status
                           WHERE unidade_id='campinas' AND origem_banco='supervisorio_db'
                             AND origem_tabela LIKE 'reporting.%'
                           ORDER BY origem_tabela""")
            rows = cur.fetchall()
        response = jsonify(ok=True, fonte="espelho", tables=rows)
        response.headers["Cache-Control"] = "no-store"
        return response

    @app.get("/usina/reporting/<path:path>")
    def usina_reporting_get(path):
        denied = allowed()
        if denied:
            return denied
        if path not in REPORTS:
            return jsonify(ok=False, error="Consulta indisponível."), 404
        if len(request.query_string) > 2048:
            return jsonify(ok=False, error="Filtro muito longo."), 400
        url = BASE.rstrip("/") + "/" + path
        if request.query_string:
            url += "?" + request.query_string.decode("ascii", errors="strict")
        req = urllib.request.Request(url, headers={"Accept": "application/json"})
        limit = 16 * 1024 * 1024 if path == "relatorios/massadas" else 4 * 1024 * 1024
        try:
            with urllib.request.urlopen(req, timeout=30) as result:
                body = result.read(limit + 1)
                status = result.status
        except urllib.error.HTTPError as exc:
            body = exc.read(limit + 1)
            status = exc.code
        except (urllib.error.URLError, TimeoutError):
            return jsonify(ok=False, error="Relatórios de Usinas indisponíveis."), 503
        if len(body) > limit:
            return jsonify(ok=False, error="Resposta acima do limite."), 502
        response = Response(body, status=status, content_type="application/json")
        response.headers["Cache-Control"] = "no-store"
        return response
