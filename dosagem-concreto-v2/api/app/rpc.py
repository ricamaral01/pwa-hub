from datetime import datetime, timezone
import hashlib
import json
from uuid import UUID

from pydantic import BaseModel, Field
from sqlalchemy import select, text
from sqlalchemy.orm import Session

from .acoes.documentos import excluir_custo, listar, mudar_status_traco, obter, salvar_generico, salvar_traco
from .acoes.importacao import importar_legado
from .acoes.usuarios import listar_usuarios, salvar_usuario
from .auth import autorizar, verificar_permissao
from .config import Config
from .erros import ErroAPI
from .modelos import Idempotencia


class Pedido(BaseModel):
    acao: str
    request_id: str = Field(alias="requestId")
    dados: dict = Field(default_factory=dict)


def instante() -> str:
    return datetime.now(timezone.utc).isoformat()


def resposta(dados) -> dict:
    return {"ok": True, "dados": dados, "servidorEm": instante()}


def falha(erro: ErroAPI) -> dict:
    detalhe = {"detalhe": erro.detalhe} if erro.detalhe is not None else {}
    return {"ok": False, "erro": {"codigo": erro.codigo, "mensagem": erro.mensagem, **detalhe}, "servidorEm": instante()}


def executar(session: Session, pedido: Pedido, token: str, cfg: Config) -> dict:
    try:
        UUID(pedido.request_id)
    except (ValueError, AttributeError):
        raise ErroAPI("VALIDACAO", "requestId deve ser UUID.") from None
    usuario = autorizar(session, token, cfg)
    acao = pedido.acao
    verificar_permissao(usuario, acao)
    tipo, _, verbo = acao.partition(".")
    dados = pedido.dados
    if acao == "usuarios.listar":
        return resposta(listar_usuarios(session, usuario))
    if verbo == "listar" and tipo in ("tracos", "materiais", "fornecedores", "ensaios", "custos"):
        return resposta(listar(session, tipo, dados, usuario))
    if verbo == "obter" and tipo in ("tracos", "materiais", "fornecedores", "ensaios", "custos"):
        return resposta(obter(session, tipo, dados, usuario))

    # Serializa requisições iguais, inclusive simultâneas, até o commit.
    session.execute(text("SELECT pg_advisory_xact_lock(hashtextextended(:id, 0))"), {"id": pedido.request_id})
    payload_hash = hashlib.sha256(json.dumps({"acao": acao, "dados": dados}, sort_keys=True, ensure_ascii=False).encode()).hexdigest()
    anterior = session.get(Idempotencia, pedido.request_id)
    if anterior is not None:
        if anterior.email != usuario.email or anterior.payload_hash != payload_hash:
            raise ErroAPI("VALIDACAO", "requestId reutilizado com usuário ou dados diferentes.")
        return anterior.resposta
    if acao == "tracos.salvarVersao":
        resultado = salvar_traco(session, dados, usuario)
    elif acao == "tracos.enviarAprovacao":
        resultado = mudar_status_traco(session, dados, usuario, False)
    elif acao == "tracos.aprovar":
        resultado = mudar_status_traco(session, dados, usuario, True)
    elif acao == "usuarios.salvar":
        resultado = salvar_usuario(session, dados, usuario)
    elif acao == "importacao.legado":
        resultado = importar_legado(session, dados, usuario)
    elif acao == "custos.excluir":
        resultado = excluir_custo(session, dados, usuario)
    elif verbo == "salvar" and tipo in ("materiais", "fornecedores", "ensaios", "custos"):
        resultado = salvar_generico(session, tipo, dados, usuario)
    else:
        raise ErroAPI("NAO_ENCONTRADO", "Ação desconhecida.")
    saida = resposta(resultado)
    session.add(Idempotencia(request_id=pedido.request_id, email=usuario.email, payload_hash=payload_hash, resposta=saida))
    return saida
