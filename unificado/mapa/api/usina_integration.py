"""Read-only production data for the Usina dashboard."""

from __future__ import annotations

from datetime import date
import hmac
import json
import os
import urllib.error
import urllib.parse
import urllib.request

from flask import jsonify, request


def register(app):
    @app.get("/integrations/usina/formas")
    def usina_formas():
        secret = os.getenv("MAPA_USINA_INTEGRATION_KEY", "")
        supplied = request.headers.get("X-Usina-Integration-Key", "")
        if not secret or not hmac.compare_digest(supplied, secret):
            return jsonify(error="Unauthorized"), 401

        raw_date = request.args.get("data", "")
        try:
            if len(raw_date) != 10:
                raise ValueError("Date must be ISO format")
            day = date.fromisoformat(raw_date)
        except ValueError:
            return jsonify(error="Invalid date"), 400

        params = urllib.parse.urlencode({
            "select": (
                "id,data_hora,setor,forma,modelo,tipo_concreto,"
                "data_fabricacao,status"
            ),
            "data_fabricacao": f"eq.{day.isoformat()}",
            "status": "in.(LIBERADO,CONCRETADO,INSPECIONADO)",
            "order": "data_hora.desc,id.desc",
        }, safe="(),.")
        upstream_request = urllib.request.Request(
            f"http://127.0.0.1:13051/producao?{params}",
            headers={"Accept": "application/json", "Range": "0-4999"},
        )
        try:
            with urllib.request.urlopen(upstream_request, timeout=10) as response:
                rows = json.load(response)
            if not isinstance(rows, list):
                raise ValueError("Unexpected response")
        except (urllib.error.URLError, TimeoutError, ValueError) as exc:
            app.logger.warning("Usina integration query failed: %s", type(exc).__name__)
            return jsonify(error="Production data unavailable"), 503

        response = jsonify(rows=rows, data_filtro=day.isoformat(), source="Mapa Unificado")
        response.headers["Cache-Control"] = "no-store"
        return response
