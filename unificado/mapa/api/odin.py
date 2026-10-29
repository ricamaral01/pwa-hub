"""Reversões auditadas dos apontamentos das formas de Campinas."""

from datetime import date
import json

from flask import jsonify, request
from psycopg.types.json import Jsonb


ODIN_USERS = frozenset({"user-ricardo", "alex", "philippe"})
SECTORS = frozenset({"Setor 1", "Setor 2", "Setor 3", "Setor 4"})
TABLES = {
    "programacao": "programacao_pcp",
    "programacao_s34": "prog_s3_s4",
    "liberacao": "liberacao_formas",
    "concretagem": "producao",
    "manutencao": "formas_manutencao",
}


def register(app, authenticated_user, screen_access_state, writer_connect):
    def authorize(sector):
        user = authenticated_user()
        if not user:
            return None, (jsonify(error="Sessão expirada."), 401)
        if user["id"] not in ODIN_USERS:
            return None, (jsonify(error="Modo ODIN restrito a Ricardo, Alex e Philippe."), 403)
        allowed, _ = screen_access_state(user)
        if f"setor{sector[-1]}" not in allowed:
            return None, (jsonify(error="Sem acesso a este setor."), 403)
        return user, None

    def identity(payload):
        sector = str(payload.get("setor") or "")
        form = str(payload.get("forma") or "").strip().upper()
        production_date = date.fromisoformat(str(payload.get("data") or ""))
        if sector not in SECTORS or not form or len(form) > 80:
            raise ValueError("Setor ou forma inválidos.")
        return production_date, sector, form

    def rows(cur, production_date, sector, form):
        result = {}
        for action, table in TABLES.items():
            if action == "manutencao":
                cur.execute("SELECT * FROM public.formas_manutencao WHERE setor=%s AND upper(forma_numero)=%s", (sector, form))
            else:
                date_column = "data" if action == "programacao_s34" else "data_fabricacao"
                cur.execute(f"SELECT * FROM public.{table} WHERE {date_column}=%s AND setor=%s AND upper(forma)=%s ORDER BY id", (production_date, sector, form))
            result[action] = cur.fetchall()
        cur.execute("""SELECT * FROM public.fechamento_producao_confirmacoes
                       WHERE data_fabricacao=%s AND setor=%s AND upper(forma)= %s""",
                    (production_date, sector, form))
        result["confirmacoes"] = cur.fetchall()
        return result

    @app.get("/odin/form")
    def odin_form():
        try:
            production_date, sector, form = identity(request.args)
        except ValueError:
            return jsonify(error="Data, setor ou forma inválidos."), 400
        _, error = authorize(sector)
        if error:
            return error
        with writer_connect() as conn, conn.cursor() as cur:
            found = rows(cur, production_date, sector, form)
        return jsonify(ok=True, data=str(production_date), setor=sector, forma=form,
                       registros={key: [dict(item) for item in value] for key, value in found.items()})

    @app.post("/odin/undo")
    def odin_undo():
        payload = request.get_json(silent=True) or {}
        try:
            production_date, sector, form = identity(payload)
        except ValueError:
            return jsonify(error="Data, setor ou forma inválidos."), 400
        user, error = authorize(sector)
        if error:
            return error
        action = str(payload.get("acao") or "")
        record_id = str(payload.get("id") or "")
        reason = str(payload.get("motivo") or "").strip()
        if action not in TABLES or not record_id or len(reason) < 8 or len(reason) > 500:
            return jsonify(error="Informe o registro e um motivo com 8 a 500 caracteres."), 400
        table = TABLES[action]
        try:
            with writer_connect() as conn, conn.cursor() as cur:
                # A trava impede duas reversões concorrentes do mesmo registro.
                cur.execute(f"SELECT * FROM public.{table} WHERE id::text=%s FOR UPDATE", (record_id,))
                previous = cur.fetchone()
                if not previous:
                    return jsonify(error="Registro já alterado. Atualize a forma."), 409
                row_date = previous.get("data") if action == "programacao_s34" else previous.get("data_fabricacao")
                row_form = previous.get("forma_numero") if action == "manutencao" else previous.get("forma")
                if (previous["setor"] != sector or str(row_form).upper() != form
                        or (action != "manutencao" and row_date != production_date)):
                    return jsonify(error="Registro não pertence à forma selecionada."), 409

                found = rows(cur, production_date, sector, form)
                if action in {"programacao", "programacao_s34"} and (found["liberacao"] or found["concretagem"]):
                    return jsonify(error="Desfaça a concretagem e a liberação antes da programação."), 409
                if action == "liberacao" and found["concretagem"]:
                    return jsonify(error="Desfaça a concretagem antes da liberação."), 409

                def audit(audit_action, source_table, old_row):
                    snapshot = json.loads(json.dumps(dict(old_row), default=str))
                    cur.execute("""INSERT INTO public.odin_reversoes
                        (data_fabricacao,setor,forma,acao,tabela,registro_id,registro_anterior,motivo,usuario_id,usuario_nome)
                        VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
                        (production_date, sector, form, audit_action, source_table,
                         str(old_row["id"]) if "id" in old_row else str(old_row["producao_id"]),
                         Jsonb(snapshot), reason, user["id"], user["nome"]))

                if action == "concretagem":
                    for confirmation in found["confirmacoes"]:
                        if confirmation["producao_id"] != previous["id"]:
                            continue
                        audit("confirmacao", "fechamento_producao_confirmacoes", confirmation)
                        cur.execute("""DELETE FROM public.fechamento_producao_confirmacoes
                            WHERE data_fabricacao=%s AND setor=%s AND forma_chave=%s AND producao_id=%s""",
                            (confirmation["data_fabricacao"], confirmation["setor"],
                             confirmation["forma_chave"], confirmation["producao_id"]))
                audit(action, table, previous)
                if action == "manutencao" and previous["status"] == "LIBERADA":
                    cur.execute("""UPDATE public.formas_manutencao SET status='PARADA',
                        liberada_em=NULL,liberada_por=NULL,obs_liberacao=NULL,updated_at=now()
                        WHERE id=%s""", (previous["id"],))
                else:
                    cur.execute(f"DELETE FROM public.{table} WHERE id::text=%s", (record_id,))
                conn.commit()
        except Exception:
            app.logger.exception("Falha na reversão ODIN")
            return jsonify(error="Não foi possível desfazer o registro."), 503
        return jsonify(ok=True, acao=action, forma=form)
