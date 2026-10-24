"""Run against a disposable PostgreSQL database after 001/002 are applied."""
from __future__ import annotations

import asyncio
import os
import sys
import types
from datetime import datetime, timedelta, timezone
from types import SimpleNamespace
from uuid import uuid4

from starlette.requests import Request
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

server = types.ModuleType("server")
postes_api = types.ModuleType("server.postes_api")
postes_api.gateway_user = lambda _request: None
sys.modules["server"] = server
sys.modules["server.postes_api"] = postes_api
from cronoanalise import api


def main():
    url = os.environ["CRONO_TEST_DATABASE_URL"]
    if "cronoanalise_test_" not in url:
        raise RuntimeError("O probe só pode usar banco de teste.")
    engine = create_engine(url)
    holder = {"user": SimpleNamespace(id="cronometrista", username="Cronometrista",
      crono_screens=frozenset({"cronoanalise.coletar"}),
      crono_actions=frozenset({"laboratorio.cronoanalise.coletar"}))}
    factory = sessionmaker(engine)
    with factory() as db:
        catalog = api.activities(holder["user"], db)
    assert len(catalog) == 40
    start = datetime(2026, 10, 18, 10, tzinfo=timezone.utc)
    entries = []
    for i in range(2):
        entries.append({"id": str(uuid4()), "atividade_codigo": "P08", "pessoas": 2,
          "setor": 1, "inicio": (start + timedelta(minutes=i)).isoformat(),
          "fim": (start + timedelta(minutes=i, seconds=90)).isoformat(),
          "bruta_s": 90, "duracao_s": 80,
          "pausas": [{"inicio": (start + timedelta(minutes=i, seconds=20)).isoformat(),
                      "fim": (start + timedelta(minutes=i, seconds=30)).isoformat(),
                      "motivo": "Orientação / supervisão"}]})
    batch = {"medicoes": entries}
    with factory() as db:
        first = api.batch(api.Batch.model_validate(batch), holder["user"], db)
    assert len(first["gravadas"]) == 2, first
    with factory() as db:
        second = api.batch(api.Batch.model_validate(batch), holder["user"], db)
    assert len(second["ja_existiam"]) == 2, second
    request = Request({"type": "http", "method": "GET", "path": "/", "headers": [],
                       "query_string": b""})
    with factory() as db:
        listed = api.list_measurements(request, 100, holder["user"], db)
    assert len(listed["medicoes"]) == 2, listed
    item_id = entries[0]["id"]
    with factory() as db:
        detail = api.measurement_detail(item_id, holder["user"], db)
    assert len(detail["pausas"]) == 1, detail
    with factory() as db:
        invalid = api.invalidate(item_id, api.Reason(motivo="Erro de apontamento"), holder["user"], db)
    assert invalid == {"valido": False}, invalid
    with factory() as db:
        stats = api.get_statistics(holder["user"], db)
    assert stats["P08"]["n"] == 1, stats

    holder["user"] = SimpleNamespace(id="analista", username="Analista",
      crono_screens=frozenset({"cronoanalise.medicoes"}),
      crono_actions=frozenset({"laboratorio.cronoanalise.analisar"}))
    with factory() as db:
        restored = api.restore(item_id, holder["user"], db)
    assert restored == {"valido": True}, restored
    with factory() as db:
        exported = api.export_csv(request, holder["user"], db)
    assert exported.body.startswith(b"\xef\xbb\xbf")
    csv_id = str(uuid4())
    csv_source = ("id;inicio;fim;processo;atividade_id;atividade_nome;setor;forma;tipo_poste;equipamento;"
      "batelada;pessoas;duracao_s;bruta_s;distancia_m;cronometrista;valido;invalid_motivo;obs\n"
      f"{csv_id};{start.isoformat()};{(start+timedelta(seconds=90)).isoformat()};montagem;P08;Colocar;"
      "1;A1;PL;;;2;80,0;90,0;;Ana;true;;Importado\n")
    async def import_once():
        async def receive():
            return {"type": "http.request", "body": csv_source.encode("utf-8"), "more_body": False}
        req = Request({"type": "http", "method": "POST", "path": "/", "headers": [],
                       "query_string": b""}, receive)
        with factory() as db:
            return await api.import_prototype(req, holder["user"], db)
    imported = asyncio.run(import_once())
    assert len(imported["gravadas"]) == 1, imported
    reimported = asyncio.run(import_once())
    assert len(reimported["ja_existiam"]) == 1, reimported
    with engine.connect() as conn:
        count = conn.execute(text("SELECT count(*) FROM cronoanalise.medicoes")).scalar_one()
        audits = conn.execute(text("SELECT count(*) FROM cronoanalise.auditoria")).scalar_one()
    assert count == 3 and audits >= 5, (count, audits)
    print(f"API_INTEGRATION_OK medicoes={count} auditoria={audits}")


if __name__ == "__main__":
    main()
