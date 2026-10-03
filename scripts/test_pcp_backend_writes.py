"""Exercise PCP test API writes and remove every synthetic row afterwards.

Run only on the test VPS. Reads /etc/pcp-unificado/pcp.env as root, but sends all
HTTP requests to the isolated PCP route. Never prints tokens or passwords.
"""

from __future__ import annotations

import os
import secrets
import sys
from datetime import date
from pathlib import Path
from urllib.parse import urlparse

import httpx
import psycopg2

ENV_FILE = Path("/etc/pcp-unificado/pcp.env")
APP_ROOT = Path("/opt/pcp-unificado-test")
API = "https://concrefer.concretrack.com.br/unificado/pcp/api"
FUTURE_DAY = date(2099, 1, 17)
SHEET_DAY = date(2026, 10, 9)


def load_private_environment() -> None:
    for line in ENV_FILE.read_text().splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            key, value = line.split("=", 1)
            os.environ[key] = value
    parsed = urlparse(os.environ["DATABASE_URL"])
    assert parsed.hostname == "127.0.0.1"
    assert parsed.path == "/pcp_unificado_teste"
    assert urlparse(os.environ["SUPABASE_URL"]).hostname == "127.0.0.1"


def ids(cursor, table: str, day: date) -> set[int]:
    assert table in {"programacoes", "programacoes_circular_s3", "programacoes_circular_s4", "maodeobra"}
    cursor.execute(f"SELECT id FROM public.{table} WHERE data=%s", (day,))
    return {row[0] for row in cursor.fetchall()}


def counts(cursor) -> dict[str, int]:
    cursor.execute("SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename")
    tables = [row[0] for row in cursor.fetchall()]
    result = {}
    for table in tables:
        cursor.execute(f'SELECT count(*) FROM public."{table}"')
        result[table] = cursor.fetchone()[0]
    return result


def request(client: httpx.Client, method: str, path: str, token: str, **kwargs):
    response = client.request(method, API + path, headers={"Authorization": "Bearer " + token}, **kwargs)
    if response.status_code >= 400:
        raise RuntimeError(f"{method} {path.split('?')[0]}: HTTP {response.status_code}")
    return response.json() if response.content else None


def main() -> int:
    load_private_environment()
    os.chdir(APP_ROOT)
    sys.path.insert(0, str(APP_ROOT))
    from app.core.security import create_access_token

    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    conn.autocommit = False
    cursor = conn.cursor()
    baseline = counts(cursor)
    baseline_future = {table: ids(cursor, table, FUTURE_DAY) for table in (
        "programacoes", "programacoes_circular_s3", "programacoes_circular_s4", "maodeobra"
    )}
    baseline_sheet = ids(cursor, "programacoes", SHEET_DAY)
    if any(baseline_future.values()) or baseline_sheet:
        raise RuntimeError("Datas de teste já possuem registros; escolha datas isoladas")
    cursor.execute("SELECT id FROM usuarios WHERE ativo=true AND nivel_acesso='ADMIN' ORDER BY id LIMIT 1")
    admin_id = cursor.fetchone()[0]
    cursor.execute("SELECT setor_id,id,COALESCE(volume,0) FROM produtos WHERE setor_id BETWEEN 1 AND 4 ORDER BY setor_id,id")
    products = {}
    for sector, product_id, volume in cursor.fetchall():
        products.setdefault(sector, (product_id, str(volume)))
    cursor.execute("SELECT id,COALESCE(setor_id,1) FROM atividades_mao_de_obra WHERE ativo=true AND tipo='MOD' ORDER BY id LIMIT 1")
    activity_id, activity_sector = cursor.fetchone()
    conn.rollback()

    marker = "codex_teste_" + secrets.token_hex(5)
    initial_password = secrets.token_urlsafe(18)
    next_password = secrets.token_urlsafe(18)
    admin_token = create_access_token({"sub": str(admin_id)})
    user_id = None
    results: list[str] = []
    failure: Exception | None = None
    try:
        with httpx.Client(timeout=90) as client:
            user = request(client, "POST", "/usuarios", admin_token, json={
                "nome": marker, "username": marker, "senha": initial_password,
                "setor_id": 1, "nivel_acesso": "ADMIN",
            })
            user_id = user["id"]
            results.append("usuario_criado=201")
            request(client, "PATCH", f"/usuarios/{user_id}", admin_token, json={"nome": marker + "_editado"})
            results.append("usuario_atualizado=200")
            login = client.post(API + "/login", json={"username": marker, "senha": initial_password})
            if login.status_code != 200:
                raise RuntimeError(f"login sintético: HTTP {login.status_code}")
            token = login.json()["access_token"]
            results.append("login_sintetico=200")
            changed = request(client, "POST", "/usuarios/trocar-senha-primeiro-acesso", token, json={
                "senha_atual": initial_password, "nova_senha": next_password,
            })
            assert changed["trocar_senha_primeiro_acesso"] is False
            results.append("primeiro_acesso=200")
            relogin = client.post(API + "/login", json={"username": marker, "senha": next_password})
            if relogin.status_code != 200:
                raise RuntimeError(f"novo login sintético: HTTP {relogin.status_code}")
            token = relogin.json()["access_token"]

            def payload(sector: int, form: str) -> dict:
                product_id, volume = products[sector]
                return {"data": FUTURE_DAY.isoformat(), "setor_id": sector,
                        "produto_id": product_id, "codigo_forma": form,
                        "quantidade_programada": 1, "volume_m3_programado": volume}

            created = request(client, "POST", "/programacao/lote", token, json={
                "itens": [payload(1, marker + "_S1"), payload(2, marker + "_S2")],
            })
            assert created["criados"] == 2
            results.append("programacao_s1_s2=2")
            for sector in (3, 4):
                row = request(client, "POST", "/programacao", token,
                              json=payload(sector, marker + f"_S{sector}"))
                assert row["setor_id"] == sector
                results.append(f"programacao_s{sector}=201")

            final_rows = request(client, "GET",
                                 f"/programacao?data_inicio={FUTURE_DAY}&data_fim={FUTURE_DAY}", token)
            synthetic = [row for row in final_rows if str(row.get("codigo_forma") or "").startswith(marker)]
            assert len(synthetic) == 4
            results.append("programacao_final=4_linhas")

            for sector in (3, 4):
                prefix = f"/programacao-circular-s{sector}"
                catalog = request(client, "GET", prefix + "/catalogo", token)
                choice = next((entry, model) for entry in catalog for model in entry["modelos"]
                              if model.get("produto_id"))
                entry, model = choice
                form = entry["codigo_forma"]
                period = request(client, "POST", prefix + "/periodo", token, json={
                    "data_inicio": FUTURE_DAY.isoformat(), "dias": 1,
                    "selecoes": [{"codigo_forma": form, "modelo": model["nome"]}],
                    "limpar_formas": [],
                })
                assert period["criados"] == 1
                day = request(client, "PATCH", prefix + "/dia", token, json={
                    "data": FUTURE_DAY.isoformat(), "codigo_forma": form, "modelo": model["nome"],
                })
                assert day["origem"] == "excecao"
                results.append(f"circular_s{sector}=periodo_e_dia")

            people = request(client, "POST", "/maodeobra/lote", token, json={
                "data": FUTURE_DAY.isoformat(), "itens": [{
                    "atividade_id": activity_id, "setor_id": activity_sector, "quantidade_pessoas": 1,
                }],
            })
            assert len(people) == 1
            results.append("maodeobra=201")

            s1_id = next(row["id"] for row in synthetic if row["setor_id"] == 1)
            pointed = request(client, "POST", f"/apontamento-mega/{s1_id}/apontar", token,
                              json={"nome_apontador": marker, "quantidade_apontada": 1})
            assert pointed["quantidade_apontada"] == 1
            results.append("apontamento_mega=200")

            sync = request(client, "POST",
                           f"/pcp/alocacao-formas/importar?data_inicial={SHEET_DAY}&data_final={SHEET_DAY}&setor=3&substituir=false",
                           token, json={})
            results.append("google_sheets_result=" + str({
                "importados": sync.get("importados"),
                "removidos": sync.get("removidos"),
                "total_ignorados": sync.get("total_ignorados"),
                "alocacao": sync.get("alocacao"),
            }))
    except Exception as exc:
        failure = exc
    finally:
        conn.rollback()
        future_prog = ids(cursor, "programacoes", FUTURE_DAY) - baseline_future["programacoes"]
        sheet_prog = ids(cursor, "programacoes", SHEET_DAY) - baseline_sheet
        future_c3 = ids(cursor, "programacoes_circular_s3", FUTURE_DAY) - baseline_future["programacoes_circular_s3"]
        future_c4 = ids(cursor, "programacoes_circular_s4", FUTURE_DAY) - baseline_future["programacoes_circular_s4"]
        future_mdo = ids(cursor, "maodeobra", FUTURE_DAY) - baseline_future["maodeobra"]
        if future_prog:
            cursor.execute("DELETE FROM apontamentos_mega WHERE programacao_id=ANY(%s)", (list(future_prog),))
        for table, values in [("programacoes_circular_s3", future_c3),
                              ("programacoes_circular_s4", future_c4),
                              ("maodeobra", future_mdo),
                              ("programacoes", future_prog | sheet_prog)]:
            if values:
                cursor.execute(f"DELETE FROM {table} WHERE id=ANY(%s)", (list(values),))
        if user_id:
            cursor.execute("DELETE FROM usuarios WHERE id=%s AND username=%s", (user_id, marker))
        conn.commit()
        after = counts(cursor)
        deltas = {table: after[table] - before for table, before in baseline.items()
                  if after[table] != before}
        print("results=" + ",".join(results))
        print("cleanup_deltas=" + str(deltas))
        cursor.close()
        conn.close()
        if deltas:
            raise RuntimeError("contagens não retornaram à linha de base")
    if failure:
        raise failure
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
