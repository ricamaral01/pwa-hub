"""Testa montagem e inspeção na VPS e remove os registros sintéticos."""

from __future__ import annotations

from datetime import date
import json
from pathlib import Path
import secrets
import urllib.error
import urllib.request
import uuid

from argon2 import PasswordHasher
import psycopg


BASE = "https://concrefer.concretrack.com.br/unificado/mapa/api"
ORIGIN = "https://concrefer.concretrack.com.br"
DB = "dbname=mapa_unificado_teste user=postgres"
CHECKLISTS = json.loads(Path("/opt/concrefer-unificado/mapa-api/checklists.json").read_text())


def post(path, body, cookie="", origin=True):
    headers = {"Content-Type": "application/json"}
    if cookie:
        headers["Cookie"] = cookie.split(";", 1)[0]
    if origin:
        headers["Origin"] = ORIGIN
    request = urllib.request.Request(BASE + path, data=json.dumps(body).encode(), headers=headers)
    try:
        with urllib.request.urlopen(request, timeout=10) as response:
            return response.status, json.load(response), response.headers.get("Set-Cookie", "")
    except urllib.error.HTTPError as error:
        payload = error.read().decode(errors="replace")
        try:
            payload = json.loads(payload)
        except json.JSONDecodeError:
            payload = {"body": payload[:300]}
        return error.code, payload, ""


def answers(kind, fail=False):
    result = {
        section["id"]: {item["id"]: "sim" for item in section["items"]}
        for section in CHECKLISTS[kind]
    }
    if fail:
        first = CHECKLISTS[kind][0]
        critical = next(item for item in first["items"] if item["critical"])
        result[first["id"]][critical["id"]] = "nao"
    return result


def main():
    suffix = secrets.token_hex(8)
    user_id = f"__montagem_test_{suffix}"
    password = secrets.token_urlsafe(24)
    record_id = str(uuid.uuid4())
    other_id = str(uuid.uuid4())
    form = f"TESTE-MONT-{suffix.upper()}"
    today = date.today().isoformat()
    with psycopg.connect(DB) as conn, conn.cursor() as cur:
        before = {}
        for table in ("usuarios", "producao", "montagem_poste", "mapa_operation_audit"):
            cur.execute(f"SELECT count(*) FROM public.{table}")
            before[table] = cur.fetchone()[0]
        cur.execute(
            """INSERT INTO public.usuarios
               (id,nome,perfil,senha_hash,ativo,setor,primeiro_acesso)
               VALUES (%s,%s,'MONTADOR',%s,true,'Setor 3',false)""",
            (user_id, user_id, PasswordHasher().hash(password)),
        )
        for id_value, sector in ((record_id, "Setor 3"), (other_id, "Setor 4")):
            cur.execute(
                """INSERT INTO public.producao
                   (id,data_fabricacao,setor,forma,modelo,status)
                   VALUES (%s,%s,%s,%s,'MODELO TESTE','LIBERADO')""",
                (id_value, today, sector, form),
            )
    try:
        status, login, cookie = post("/login", {"name": user_id, "password": password})
        assert status == 200 and login["ok"] and cookie
        forbidden, forbidden_body, _ = post("/operations/montagem", {"record_id": other_id, "kind": "INSPECAO", "action": "start"}, cookie)
        wrong_origin, wrong_origin_body, _ = post("/operations/montagem", {"record_id": record_id, "kind": "INSPECAO", "action": "start"}, cookie, False)
        assert forbidden == 403 and wrong_origin == 403, (forbidden, forbidden_body, wrong_origin, wrong_origin_body)
        malformed, _, _ = post("/operations/montagem", {"kind": [], "action": "start"}, cookie)
        assert malformed == 400
        for kind, final_status, checklist in (
            ("INSPECAO", "A", answers("INSPECAO")),
            ("MONTAGEM", "R", answers("MONTAGEM", fail=True)),
        ):
            base = {"record_id": record_id, "kind": kind}
            started, result, _ = post("/operations/montagem", {**base, "action": "start"}, cookie)
            assert started == 200 and result["result"] == "started", (started, result)
            if kind == "MONTAGEM":
                invalid, _, _ = post("/operations/montagem", {
                    **base, "action": "finish", "status": "A", "checklists": checklist,
                }, cookie)
                assert invalid == 400
            finish = {**base, "action": "finish", "status": final_status,
                      "checklists": checklist, "observacoes_montagem": "Teste isolado"}
            if final_status == "R":
                finish["motivo_recusa"] = "Falha crítica de teste"
            finished, result, _ = post("/operations/montagem", finish, cookie)
            assert finished == 200 and result["result"] == "finished", (finished, result)
            repeat, _, _ = post("/operations/montagem", finish, cookie)
            assert repeat == 409
        with psycopg.connect(DB) as conn, conn.cursor() as cur:
            cur.execute("SELECT etapa,status_montagem,finalizado_em FROM public.montagem_poste WHERE record_id = %s ORDER BY etapa", (record_id,))
            rows = cur.fetchall()
            assert len(rows) == 2 and {row[1] for row in rows} == {"A", "R"}
            assert all(row[2] is not None for row in rows)
            cur.execute("SELECT count(*) FROM public.mapa_operation_audit WHERE actor_id = %s", (user_id,))
            assert cur.fetchone()[0] == 4
        print("INSPECAO_A=200 MONTAGEM_R=200 REPETICAO=409 SETOR=403 ORIGEM=403 AUDITORIA=4")
    finally:
        with psycopg.connect(DB) as conn, conn.cursor() as cur:
            cur.execute("DELETE FROM public.mapa_operation_audit WHERE actor_id = %s", (user_id,))
            cur.execute("DELETE FROM public.montagem_poste WHERE record_id = %s", (record_id,))
            cur.execute("DELETE FROM public.producao WHERE id IN (%s,%s)", (record_id, other_id))
            cur.execute("DELETE FROM public.usuarios WHERE id = %s", (user_id,))
            for table, count in before.items():
                cur.execute(f"SELECT count(*) FROM public.{table}")
                assert cur.fetchone()[0] == count, table
        print("DADOS_SINTETICOS_REMOVIDOS=SIM")


if __name__ == "__main__":
    main()
