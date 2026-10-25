import copy
import json
from pathlib import Path

import pytest
from sqlalchemy import select, text
from sqlalchemy.exc import DBAPIError

from app.modelos import AvaliacaoImpacto, TracoVersao, Usuario
from conftest import rpc


P1B = json.loads((Path(__file__).resolve().parents[2] / "shared/golden/principal-4.1.json").read_text(encoding="utf-8"))["base"]


def test_s1_p1b_snapshot_impact_and_engineer_decision(ambiente, traco):
    """R1-S1-DECISAO: approve P1b, change sand 2 density, retain snapshot, and gate production."""
    client, factory, _ = ambiente
    sand2 = {"id": "sand2", "nome": "Areia 2", "unidade": "campinas", "massaEspecificaKgDm3": 2.68}
    saved_material = rpc(client, "materiais.salvar", sand2)
    assert saved_material.status_code == 200, saved_material.json()

    traco.update(metodo="principal_abrams", metodoDados=copy.deepcopy(P1B), balanco="complete",
                 itens=[], materialIds=[None, None, None, "sand2"],
                 planoExperimental={"misturasPrevistas": 3,
                                    "condicoes": [{"id": f"dia-{i}", "dia": f"2026-10-{18+i}"} for i in range(3)],
                                    "volumeBetonadaL": 25,
                                    "ensaiosFresco": ["abatimentoMm", "abatimento30MinMm", "arPct", "massaEspecificaKgM3"],
                                    "idadesDias": [28], "cpsPorIdade": 2,
                                    "resistenciaMinMPa": 30, "resistenciaMediaMinMPa": 32})
    traco["objetivo"].update(fckMPa=30, classe="II")
    saved = rpc(client, "tracos.salvarVersao", traco)
    assert saved.status_code == 200, saved.json()
    saved_doc = saved.json()["dados"]["documento"]
    released = rpc(client, "tracos.enviarAprovacao", {"id": traco["id"], "versao": 1, "revisao": 1,
                                                        "resultadoCliente": saved_doc["resultadoCalculado"]})
    assert released.status_code == 200, released.json()
    release_doc = released.json()["dados"]["documento"]
    release_doc["experimentais"] = [{"id": f"mix-{i}", "condicaoId": f"dia-{i}", "data": "2026-10-18T12:00:00Z",
                                     "abatimentoMm": 100, "abatimento30MinMm": 90, "arPct": 1.5,
                                     "massaEspecificaKgM3": 2380,
                                     "rupturas": [{"idadeDias": 28, "resultadosMPa": [35, 36]}]} for i in range(3)]
    complete = rpc(client, "tracos.salvarVersao", release_doc)
    assert complete.status_code == 200, complete.json()
    complete_doc = complete.json()["dados"]["documento"]
    approved = rpc(client, "tracos.aprovar", {"id": traco["id"], "versao": 1, "revisao": 3,
                                             "resultadoCliente": complete_doc["resultadoCalculado"],
                                             "parecer": "Conforme plano P1b"})
    assert approved.status_code == 200, approved.json()
    key = f"tracos:{traco['id']}:v1"
    with factory() as session:
        version = session.get(TracoVersao, key)
        assert version is not None and version.estado == "aprovado"
        sand_items = [item for item in version.snapshot["itens"] if item["categoria"] == "areia"]
        assert [item["massaKgM3"] for item in sand_items] == pytest.approx([142.416, 569.663], abs=.001)
        assert sand_items[1]["materialId"] == "sand2"
        original_snapshot = copy.deepcopy(version.snapshot)
        original_result = copy.deepcopy(version.resultado)

    changed = {**saved_material.json()["dados"]["documento"], "massaEspecificaKgDm3": 2.60}
    response = rpc(client, "materiais.salvar", changed)
    assert response.status_code == 200, response.json()
    with factory() as session:
        version = session.get(TracoVersao, key)
        assert version.snapshot == original_snapshot and version.resultado == original_result
        impact = session.scalar(select(AvaliacaoImpacto).where(AvaliacaoImpacto.traco_versao_chave == key))
        assert impact is not None and impact.classificacao == "revisão necessária" and impact.estado == "pendente"
        assert impact.diferencas["volumeL"] == pytest.approx(6.54, abs=.01)

    production = rpc(client, "producoes.salvar", {"id": "batch-1", "tracoVersaoChave": key, "volumeM3": 1})
    assert production.status_code == 422 and production.json()["erro"]["codigo"] == "BLOQUEIO_ESTADO"
    listing = rpc(client, "avaliacoes.listar", {"tracoVersaoChave": key})
    assert listing.status_code == 200 and len(listing.json()["dados"]) == 1
    impact_id = listing.json()["dados"][0]["id"]
    with factory.begin() as session:
        session.add(Usuario(email="lab@example.test", nome="Laboratório", papel="laboratorista", unidades=["campinas"], ativo=True))
    forbidden = rpc(client, "avaliacoes.decidir", {"id": impact_id, "decisao": "liberar",
                       "justificativa": "Avaliação técnica concluída"}, email="lab@example.test")
    assert forbidden.status_code == 403
    review = rpc(client, "avaliacoes.decidir", {"id": impact_id, "decisao": "revisar",
                   "justificativa": "Revisar a composição antes da produção"})
    assert review.status_code == 200 and review.json()["dados"]["estado"] == "revisao_necessaria"
    blocked = rpc(client, "producoes.salvar", {"id": "batch-2", "tracoVersaoChave": key, "volumeM3": 1})
    assert blocked.status_code == 422 and blocked.json()["erro"]["codigo"] == "BLOQUEIO_ESTADO"
    decision = rpc(client, "avaliacoes.decidir", {"id": impact_id, "decisao": "liberar",
                    "justificativa": "Desvio aceito pelo engenheiro responsável"})
    assert decision.status_code == 200 and decision.json()["dados"]["estado"] == "liberada"
    production = rpc(client, "producoes.salvar", {"id": "batch-3", "tracoVersaoChave": key, "volumeM3": 1})
    assert production.status_code == 200, production.json()
    # R1-PRODUCAO: server plans wet aggregate masses and dosed water, then flags out-of-tolerance cement.
    planned = production.json()["dados"]["documento"]["planejado"]
    assert planned and production.json()["dados"]["documento"]["aguaDosadaKg"] > 0
    cement_id = next(material_id for material_id, item in planned.items() if item["categoria"] == "cimento")
    sand_id = next(material_id for material_id, item in planned.items() if item["categoria"] == "areia")
    humidities = {sand_id: {"umidadePct": 5, "absorcaoPct": 1, "medidoEm": "2026-10-18T12:00:00Z", "responsavel": "Laboratório"}}
    wet = rpc(client, "producoes.salvar", {"id": "batch-4", "tracoVersaoChave": key, "volumeM3": 1,
            "umidades": humidities})
    assert wet.status_code == 200, wet.json()
    wet_doc = wet.json()["dados"]["documento"]
    assert wet_doc["planejado"][sand_id]["massaAPesarKg"] > planned[sand_id]["massaAPesarKg"]
    assert wet_doc["aguaDosadaKg"] < production.json()["dados"]["documento"]["aguaDosadaKg"]
    dosed = {material_id: item["massaAPesarKg"] for material_id, item in wet_doc["planejado"].items()}
    dosed[cement_id] *= 1.02
    measured = rpc(client, "producoes.salvar", {"id": "batch-5", "tracoVersaoChave": key, "volumeM3": 1,
            "umidades": humidities, "dosadoKg": dosed})
    assert measured.status_code == 200, measured.json()
    alerts = measured.json()["dados"]["documento"]["alertas"]
    assert len(alerts) == 1 and alerts[0]["materialId"] == cement_id
    assert alerts[0]["desvioPct"] == pytest.approx(2)
    # R1-DESFORMA: an estimate never releases a lot; measured CPs of that same lot are mandatory.
    product = rpc(client, "produtos.salvar", {"id": "post-dt", "unidade": "campinas", "nome": "Poste DT",
                "desformaMinMPa": 20, "desformaIdadeAlvoH": 24})
    assert product.status_code == 200, product.json()
    lot = rpc(client, "producoes.salvar", {"id": "batch-desforma", "tracoVersaoChave": key,
              "volumeM3": 1, "produtoId": "post-dt"})
    assert lot.status_code == 200 and lot.json()["dados"]["documento"]["estadoDesforma"] == "aguardando_desforma"
    missing = rpc(client, "producoes.liberarDesforma", {"id": "batch-desforma", "idadeHoras": 24,
                  "ensaiadoEm": "2026-10-19T12:00:00Z"})
    assert missing.status_code == 422 and missing.json()["erro"]["codigo"] == "BLOQUEIO_ESTADO"
    low = rpc(client, "producoes.liberarDesforma", {"id": "batch-desforma", "idadeHoras": 24,
              "cpResultadosMPa": [18, 19], "ensaiadoEm": "2026-10-19T12:00:00Z"})
    assert low.status_code == 422 and low.json()["erro"]["codigo"] == "BLOQUEIO_ESTADO"
    released_lot = rpc(client, "producoes.liberarDesforma", {"id": "batch-desforma", "idadeHoras": 24,
                       "cpResultadosMPa": [19, 21], "ensaiadoEm": "2026-10-19T12:00:00Z"})
    assert released_lot.status_code == 200, released_lot.json()
    assert released_lot.json()["dados"]["documento"]["desforma"]["exemplarMPa"] == 21
    assert released_lot.json()["dados"]["documento"]["estadoDesforma"] == "liberada"
    with factory() as session:
        with pytest.raises(DBAPIError):
            session.execute(text("UPDATE traco_versoes SET snapshot='{}'::jsonb WHERE chave=:key"), {"key": key})
            session.commit()
        session.rollback()
