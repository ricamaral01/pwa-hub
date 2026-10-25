"""Read-only production data for the Usina dashboard."""

from __future__ import annotations

from datetime import date
import hmac
import json
import os
import re
import urllib.error
import urllib.parse
import urllib.request

from flask import jsonify, request
from unified_auth import pcp_connect


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
                "data_fabricacao,status,codigo_poste,descricao_poste,codigo_produto"
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

        # Attach the recorded product weight to each post. A circular form can
        # contain several products, so the form itself cannot identify its weight.
        codes = sorted({str(row.get("codigo_produto")) for row in rows
                        if row.get("codigo_produto")})
        products = {}
        sector_four_models = {}
        if rows:
            try:
                with pcp_connect() as conn, conn.cursor() as cur:
                    cur.execute("""
                        SELECT codigo, nome, peso, volume, setor_id
                        FROM public.produtos
                        WHERE (codigo = ANY(%s) OR setor_id = 4)
                          AND peso > 0 AND volume > 0
                    """, (codes,))
                    for product in cur.fetchall():
                        if product["setor_id"] == 4:
                            model = re.sub(r"[^0-9A-Z]", "", product["nome"].upper())
                            if model.endswith("DT"):
                                model = model[:-2]
                            # "6,0 x 90" and "6 x 90" are the same size.
                            model = re.sub(r"([0-9])0X", r"\1X", model)
                            value = (float(product["peso"]), float(product["volume"]))
                            if model in sector_four_models and sector_four_models[model] != value:
                                sector_four_models[model] = None
                            elif model not in sector_four_models:
                                sector_four_models[model] = value
                        code = str(product["codigo"])
                        weight = float(product["peso"])
                        volume = float(product["volume"])
                        value = (weight, volume)
                        if code in products and products[code] != value:
                            products[code] = None
                        elif code not in products:
                            products[code] = value
            except Exception as exc:
                app.logger.warning("Usina product catalog query failed: %s",
                                   type(exc).__name__)
                products = {}
                sector_four_models = {}
        for row in rows:
            product = products.get(str(row.get("codigo_produto") or ""))
            if product is None and row.get("setor") == "Setor 4":
                model = re.sub(r"[^0-9A-Z]", "", str(row.get("modelo") or "").upper())
                model = re.sub(r"([0-9])0X", r"\1X", model)
                product = sector_four_models.get(model)
            row["peso_poste_kg"] = product[0] if product else None
            row["volume_catalogo_m3"] = product[1] if product else None

        response = jsonify(rows=rows, data_filtro=day.isoformat(), source="Mapa Unificado")
        response.headers["Cache-Control"] = "no-store"
        return response


    @app.get("/integrations/usina/mao-de-obra")
    def usina_mao_de_obra():
        """Read direct labor recorded for sectors 1-4 in the unified PCP."""
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

        try:
            with pcp_connect() as conn, conn.cursor() as cur:
                cur.execute("""
                    SELECT m.setor_id, m.quantidade_pessoas, a.grupo_setor
                    FROM public.maodeobra m
                    JOIN public.atividades_mao_de_obra a ON a.id = m.atividade_id
                    WHERE m.data = %s AND upper(a.tipo) = 'MOD'
                      AND (a.grupo_setor = '12' OR m.setor_id BETWEEN 1 AND 4)
                """, (day,))
                labor_rows = cur.fetchall()
        except Exception as exc:
            app.logger.warning("Unified PCP labor query failed: %s", type(exc).__name__)
            return jsonify(error="Labor data unavailable"), 503

        grouped = {
            "12": {"grupo_setor": "12", "setor": "Setores 1 e 2",
                   "quantidade": 0, "lancamentos": 0},
            "3": {"grupo_setor": "3", "setor": "Setor 3",
                  "quantidade": 0, "lancamentos": 0},
            "4": {"grupo_setor": "4", "setor": "Setor 4",
                  "quantidade": 0, "lancamentos": 0},
        }
        group_12_rows = [row for row in labor_rows if row["grupo_setor"] == "12"]
        if group_12_rows:
            # Grouped production is authoritative when old individual rows coexist.
            labor_rows = group_12_rows + [
                row for row in labor_rows if row["setor_id"] in (3, 4)]
        for row in labor_rows:
            group = ("12" if row["grupo_setor"] == "12"
                     or row["setor_id"] in (1, 2)
                     else str(row["setor_id"]))
            if group not in grouped:
                continue
            grouped[group]["quantidade"] += int(row["quantidade_pessoas"])
            grouped[group]["lancamentos"] += 1
        setores = list(grouped.values())
        lancamentos = sum(row["lancamentos"] for row in setores)
        setores_lancados = sum(1 for row in setores if row["lancamentos"])
        total = sum(row["quantidade"] for row in setores) if lancamentos else None
        status = ("sem_lancamento" if not lancamentos else
                  "ok" if setores_lancados == 3 else "parcial")
        response = jsonify(
            data_filtro=day.isoformat(), source="PCP Unificado - MOD",
            status=status, quantidade=total, lancamentos=lancamentos,
            setores_lancados=setores_lancados, setores=setores,
        )
        response.headers["Cache-Control"] = "no-store"
        return response
