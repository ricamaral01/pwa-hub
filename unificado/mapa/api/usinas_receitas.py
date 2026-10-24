"""Usinas Campinas: read the homolog mirror, never the legacy database."""

from __future__ import annotations

import psycopg
from flask import jsonify


def register(app, connect, authenticated_user, screen_access_state):
    @app.get("/usina/receitas")
    def usina_receitas():
        user = authenticated_user()
        if not user:
            return jsonify(ok=False, error="Sessão expirada. Entre novamente."), 401
        allowed, _ = screen_access_state(user)
        if "usinasInicio" not in allowed:
            return jsonify(ok=False, error="Sem acesso a Usinas."), 403
        try:
            with connect() as conn, conn.cursor() as cur:
                cur.execute("""
                    SELECT origem_id AS id, nome, nome_traco, ativa, alterado,
                           cimento, cimento1, cimento2, cimento3, cimento4,
                           adicao_1, adicao_2,
                           areia_1, areia_2, areia_3,
                           brita_1, brita_2,
                           agregado1, agregado2, agregado3, agregado4,
                           agregado5, agregado6, agregado7,
                           aditivo_1, aditivo_2,
                           aditivo1, aditivo2, aditivo3, agua,
                           ac, r24h, r3, r7, r28,
                           revisao_grupo, revisao_numero, revisao_origem_id,
                           observacao_revisao, alterado_por, revisado_em,
                           created_at, _source_hash, ingested_at
                    FROM usinas.receitas
                    WHERE unidade_id='campinas' AND origem_banco='supervisorio_db'
                    ORDER BY nome_traco, revisao_numero DESC, origem_id DESC
                """)
                rows = cur.fetchall()
                cur.execute("""
                    SELECT last_success_at, source_count, mirror_count,
                           last_error, EXTRACT(EPOCH FROM now()-last_success_at) AS age_seconds
                    FROM usinas.sync_status
                    WHERE unidade_id='campinas' AND origem_banco='supervisorio_db'
                      AND origem_tabela='tbl_receitas'
                """)
                status = cur.fetchone()
        except psycopg.Error:
            app.logger.exception("Usinas mirror read failed")
            return jsonify(ok=False, error="Espelho de receitas indisponível."), 503
        response = jsonify(ok=True, unidade="campinas", fonte="espelho",
                           edicao_habilitada=False, rows=rows, sync=status)
        response.headers["Cache-Control"] = "no-store"
        return response
