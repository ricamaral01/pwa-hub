import uuid

from sqlalchemy import func, select

from app.modelos import Documento, Idempotencia, LegadoId
from conftest import rpc, token


def test_saude_e_token_invalido(ambiente):
    client, _, _ = ambiente
    assert client.get("/api/v1/saude").json() == {"ok": True, "versao": "2.0.0", "banco": "ok"}
    rid = str(uuid.uuid4())
    r = client.post("/api/v1/rpc", headers={"Authorization": "Bearer invalido", "Idempotency-Key": rid},
                    json={"acao": "tracos.listar", "requestId": rid, "dados": {}})
    assert r.status_code == 401
    assert r.json()["erro"]["codigo"] == "NAO_AUTENTICADO"


def test_papel_insuficiente_em_chamada_direta(ambiente, traco):
    client, _, _ = ambiente
    assert rpc(client, "usuarios.salvar", {"email": "lab@example.test", "papel": "laboratorio", "unidades": ["campinas"]}).status_code == 200
    r = rpc(client, "tracos.aprovar", {"id": traco["id"], "versao": 1, "revisao": 1}, email="lab@example.test")
    assert r.status_code == 403
    assert r.json()["erro"]["codigo"] == "SEM_PERMISSAO"
    r = rpc(client, "usuarios.salvar", {"email": "outro@example.test", "papel": "admin", "unidades": ["*"]}, email="lab@example.test")
    assert r.status_code == 403


def test_idempotencia_e_reabertura_com_multiplos_itens(ambiente, traco):
    client, factory, _ = ambiente
    rid = str(uuid.uuid4())
    a = rpc(client, "tracos.salvarVersao", traco, request_id=rid)
    b = rpc(client, "tracos.salvarVersao", traco, request_id=rid)
    assert a.status_code == b.status_code == 200
    assert a.json() == b.json()
    documento = a.json()["dados"]["documento"]
    aberto = rpc(client, "tracos.obter", {"id": traco["id"], "versao": 1}).json()["dados"]
    assert aberto == documento
    assert aberto["itens"] == traco["itens"]
    with factory() as session:
        assert session.scalar(select(func.count()).select_from(Documento)) == 1
        assert session.scalar(select(func.count()).select_from(Idempotencia).where(Idempotencia.request_id == rid)) == 1


def test_conflito_de_revisao(ambiente, traco):
    client, _, _ = ambiente
    atual = rpc(client, "tracos.salvarVersao", traco).json()["dados"]["documento"]
    stale = {**atual, "revisao": 0}
    r = rpc(client, "tracos.salvarVersao", stale)
    assert r.status_code == 409
    assert r.json()["erro"]["codigo"] == "CONFLITO_REVISAO"
    assert r.json()["erro"]["detalhe"]["atual"] == atual


def test_validacao_rejeita_campos_invalidos(ambiente, traco):
    client, _, _ = ambiente
    casos = [
        {**traco, "itens": [{**traco["itens"][0], "massaKgM3": 0}, *traco["itens"][1:]]},
        {**traco, "itens": [{**traco["itens"][0], "massaEspecificaKgDm3": 0}, *traco["itens"][1:]]},
        {**traco, "nome": ""},
    ]
    for dados in casos:
        r = rpc(client, "tracos.salvarVersao", dados)
        assert r.status_code == 422
        assert r.json()["erro"]["codigo"] == "VALIDACAO"


def test_importacao_simula_e_reimportar_nao_duplica(ambiente, traco):
    client, factory, _ = ambiente
    registro = {"tipo": "tracos", "origem": "json:fixture", "id_antigo": "123", "documento": traco}
    dados = {"simulacao": True, "registros": [registro], "unidadePadrao": "campinas"}
    r = rpc(client, "importacao.legado", dados)
    assert r.status_code == 200
    assert r.json()["dados"]["gravados"] == 0
    with factory() as session:
        assert session.scalar(select(func.count()).select_from(Documento)) == 0
    efetivo = {**dados, "simulacao": False}
    assert rpc(client, "importacao.legado", efetivo).json()["dados"]["gravados"] == 1
    segunda = rpc(client, "importacao.legado", efetivo).json()["dados"]
    assert segunda["gravados"] == 0 and segunda["duplicados"] == 1
    with factory() as session:
        assert session.scalar(select(func.count()).select_from(LegadoId)) == 1
        assert session.scalar(select(func.count()).select_from(Documento)) == 1


def test_cors_rejeita_origem_externa(ambiente):
    client, _, _ = ambiente
    r = client.options("/api/v1/rpc", headers={"Origin": "https://outro.example", "Access-Control-Request-Method": "POST"})
    assert r.status_code == 403
    r = client.options("/api/v1/rpc", headers={"Origin": "https://usina.concretrack.com.br", "Access-Control-Request-Method": "POST",
                                               "Access-Control-Request-Headers": "authorization,content-type,idempotency-key"})
    assert r.status_code == 200
    assert r.headers["access-control-allow-origin"] == "https://usina.concretrack.com.br"
