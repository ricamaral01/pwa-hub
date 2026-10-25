from sqlalchemy import select

from app.acoes import documentos
from app.modelos import Documento, TracoVersao
from conftest import rpc


def test_pilot_provenance_and_real_demould_block(ambiente, traco, monkeypatch):
    client, factory, cfg = ambiente
    cfg.modo_piloto = True
    monkeypatch.setattr(documentos, "get_config", lambda: cfg)

    assert client.get("/api/v1/saude").json()["piloto"] is True
    saved = rpc(client, "tracos.salvarVersao", traco)
    assert saved.status_code == 200, saved.json()
    assert saved.json()["dados"]["documento"]["piloto"] is True
    with factory() as session:
        row = session.scalar(select(Documento).where(Documento.tipo == "tracos", Documento.id == traco["id"]))
        assert row.piloto is True
        assert row.conteudo["piloto"] is True

    blocked = rpc(client, "producoes.liberarDesforma", {"id": "qualquer"})
    assert blocked.status_code == 422
    assert blocked.json()["erro"]["codigo"] == "BLOQUEIO_ESTADO"
    users = rpc(client, "usuarios.salvar", {"email": "outro@example.test"})
    assert users.status_code == 422
    assert users.json()["erro"]["codigo"] == "BLOQUEIO_ESTADO"


def test_official_mode_cannot_reuse_pilot_trace_or_batch(ambiente):
    client, factory, _ = ambiente
    with factory.begin() as session:
        session.add(TracoVersao(chave="tracos:pilot:v1", traco_id="pilot", versao=1,
                                unidade="campinas", estado="aprovado", documento={},
                                snapshot={}, resultado={}, piloto=True))
        session.add(TracoVersao(chave="tracos:official:v1", traco_id="official", versao=1,
                                unidade="campinas", estado="aprovado", documento={},
                                snapshot={}, resultado={}, piloto=False))
        session.add(Documento(chave="producoes:pilot-batch:v1", tipo="producoes",
                              id="pilot-batch", versao=1, revisao=1, unidade="campinas",
                              status="", nome="", conteudo={"id": "pilot-batch"}, piloto=True))

    production = rpc(client, "producoes.salvar", {
        "id": "new-batch", "tracoVersaoChave": "tracos:pilot:v1", "volumeM3": 1,
    })
    assert production.status_code == 422
    assert production.json()["erro"]["mensagem"] == "Traco do piloto nao pode gerar producao oficial."

    overwrite = rpc(client, "producoes.salvar", {
        "id": "pilot-batch", "tracoVersaoChave": "tracos:official:v1", "volumeM3": 1,
    })
    assert overwrite.status_code == 422
    assert overwrite.json()["erro"]["mensagem"] == "Betonada do piloto nao pode virar producao oficial."

    demould = rpc(client, "producoes.liberarDesforma", {"id": "pilot-batch"})
    assert demould.status_code == 422
    assert demould.json()["erro"]["mensagem"] == "Desforma de betonada do piloto nao pode ser liberada."
