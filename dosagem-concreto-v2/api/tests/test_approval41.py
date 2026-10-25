import copy
import json
from pathlib import Path

import pytest
from sqlalchemy import select, text
from sqlalchemy.exc import DBAPIError

from app.modelos import TracoVersao
from conftest import rpc

BASE = json.loads((Path(__file__).resolve().parents[2] / "shared/golden/principal-4.1.json").read_text(encoding="utf-8"))["base"]


def test_server_recalculates_and_approved_snapshot_is_immutable(ambiente, traco):
    client, factory, _ = ambiente
    traco.update(metodo="principal_abrams", metodoDados=copy.deepcopy(BASE), balanco="complete", itens=[],
                 planoExperimental={"misturasPrevistas": 3, "condicoes": [{"id": f"dia-{i}", "dia": f"2026-10-{18+i}"} for i in range(3)],
                                    "volumeBetonadaL": 25, "ensaiosFresco": ["abatimentoMm", "abatimento30MinMm", "arPct", "massaEspecificaKgM3"],
                                    "idadesDias": [28], "cpsPorIdade": 2, "resistenciaMinMPa": 30, "resistenciaMediaMinMPa": 32})
    traco["objetivo"]["fckMPa"] = 30
    traco["objetivo"]["classe"] = "II"
    saved = rpc(client, "tracos.salvarVersao", traco)
    assert saved.status_code == 200, saved.json()
    document = saved.json()["dados"]["documento"]
    assert abs(document["resultadoCalculado"]["physicalVolumeL"] - 1000) < .05
    bad = rpc(client, "tracos.enviarAprovacao", {"id": traco["id"], "versao": 1, "revisao": 1,
                                                   "resultadoCliente": {**document["resultadoCalculado"], "cementKg": 1}})
    assert bad.status_code == 409 and bad.json()["erro"]["codigo"] == "DIVERGENCIA_CALCULO"
    released = rpc(client, "tracos.enviarAprovacao", {"id": traco["id"], "versao": 1, "revisao": 1,
                                                        "resultadoCliente": document["resultadoCalculado"]})
    assert released.status_code == 200, released.json()
    release_doc = released.json()["dados"]["documento"]
    premature = rpc(client, "tracos.aprovar", {"id": traco["id"], "versao": 1, "revisao": 2,
                                              "resultadoCliente": release_doc["resultadoCalculado"]})
    assert premature.status_code == 422 and premature.json()["erro"]["codigo"] == "BLOQUEIO_ESTADO"
    release_doc["experimentais"] = [{"id": f"mix-{i}", "condicaoId": f"dia-{i}", "data": "2026-10-18T12:00:00Z", "abatimentoMm": 100,
                                     "abatimento30MinMm": 90, "arPct": 1.5, "massaEspecificaKgM3": 2380,
                                     "rupturas": [{"idadeDias": 28, "resultadosMPa": [35, 36]}]} for i in range(3)]
    complete = rpc(client, "tracos.salvarVersao", release_doc)
    assert complete.status_code == 200, complete.json()
    complete_doc = complete.json()["dados"]["documento"]
    approved = rpc(client, "tracos.aprovar", {"id": traco["id"], "versao": 1, "revisao": 3,
                                             "resultadoCliente": complete_doc["resultadoCalculado"], "parecer": "Conforme plano"})
    assert approved.status_code == 200, approved.json()
    with factory() as session:
        snapshot = session.scalar(select(TracoVersao).where(TracoVersao.traco_id == traco["id"]))
        assert snapshot is not None and snapshot.estado == "aprovado"
        assert abs(snapshot.resultado["physicalVolumeL"] - 1000) < .05
        assert snapshot.snapshot["itens"]
        with pytest.raises(DBAPIError):
            session.execute(text("UPDATE traco_versoes SET resultado = '{}'::jsonb WHERE chave = :chave"), {"chave": snapshot.chave})
            session.commit()
        session.rollback()
