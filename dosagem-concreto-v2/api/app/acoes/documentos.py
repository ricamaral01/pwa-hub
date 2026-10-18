from copy import deepcopy
from datetime import datetime, timezone

from sqlalchemy import select, text
from sqlalchemy.orm import Session

from ..auth import pode_unidade
from ..erros import ErroAPI
from ..modelos import Auditoria, Documento, Usuario
from ..validacao import validar_generico, validar_traco


def agora() -> str:
    return datetime.now(timezone.utc).isoformat()


def chave_documento(tipo: str, id_: str, versao: int) -> str:
    return f"{tipo}:{id_}:v{versao}"


def atual(session: Session, tipo: str, id_: str, lock: bool = False) -> Documento | None:
    query = select(Documento).where(Documento.tipo == tipo, Documento.id == id_).order_by(Documento.versao.desc()).limit(1)
    if lock:
        query = query.with_for_update()
    return session.scalar(query)


def gravar(session: Session, tipo: str, d: dict, antigo: Documento | None = None) -> Documento:
    chave = chave_documento(tipo, str(d["id"]), int(d["versao"]))
    row = antigo if antigo is not None and antigo.chave == chave else Documento(chave=chave, tipo=tipo, id=str(d["id"]))
    row.versao = int(d["versao"])
    row.revisao = int(d["revisao"])
    row.unidade = str(d["unidade"])
    row.status = str(d.get("status") or "")
    row.nome = str(d.get("nome") or d.get("nomeProduto") or "")
    row.fck_mpa = (d.get("objetivo") or {}).get("fckMPa") if tipo == "tracos" else None
    row.metodo = str(d.get("metodo") or "") if tipo == "tracos" else None
    row.conteudo = d
    row.alterado_em = datetime.now(timezone.utc)
    session.add(row)
    session.flush()
    return row


def auditar(session: Session, usuario: Usuario, acao: str, tipo: str | None, d: dict | None, antes: dict | None = None) -> None:
    session.add(Auditoria(email=usuario.email, acao=acao, unidade=(d or antes or {}).get("unidade"), tipo=tipo,
                          documento_id=(d or antes or {}).get("id"), antes=antes, depois=d))


def listar(session: Session, tipo: str, filtros: dict, usuario: Usuario) -> list[dict]:
    query = select(Documento).where(Documento.tipo == tipo)
    if usuario.papel != "admin" and "*" not in usuario.unidades:
        query = query.where(Documento.unidade.in_(usuario.unidades))
    if filtros.get("unidade"):
        if not pode_unidade(usuario, str(filtros["unidade"])):
            raise ErroAPI("SEM_PERMISSAO", "Unidade não autorizada.")
        query = query.where(Documento.unidade == str(filtros["unidade"]))
    if filtros.get("status"):
        query = query.where(Documento.status == str(filtros["status"]))
    if filtros.get("nome"):
        query = query.where(Documento.nome.ilike("%" + str(filtros["nome"]) + "%"))
    return [row.conteudo for row in session.scalars(query.order_by(Documento.alterado_em.desc()).limit(1000))]


def obter(session: Session, tipo: str, dados: dict, usuario: Usuario) -> dict:
    if not dados.get("id"):
        raise ErroAPI("VALIDACAO", "ID obrigatório.")
    query = select(Documento).where(Documento.tipo == tipo, Documento.id == str(dados["id"]))
    if dados.get("versao"):
        query = query.where(Documento.versao == int(dados["versao"]))
    row = session.scalar(query.order_by(Documento.versao.desc()).limit(1))
    if row is None or not pode_unidade(usuario, row.unidade):
        raise ErroAPI("NAO_ENCONTRADO", "Documento não encontrado.")
    return row.conteudo


def salvar_traco(session: Session, dados: dict, usuario: Usuario) -> dict:
    validar_traco(dados)
    if not pode_unidade(usuario, str(dados["unidade"])):
        raise ErroAPI("SEM_PERMISSAO", "Unidade não autorizada.")
    anterior = atual(session, "tracos", str(dados["id"]), lock=True)
    antes = deepcopy(anterior.conteudo) if anterior else None
    d = deepcopy(dados)
    instante = agora()
    if anterior is None:
        codigo = session.execute(text("SELECT nextval('traco_codigo_seq')")).scalar_one()
        d.update(codigo=f"TR-{codigo:04d}", versao=1, revisao=1, status="rascunho")
        d["auditoria"] = {"criadoPor": usuario.email, "criadoEm": instante, "alteradoPor": usuario.email, "alteradoEm": instante}
    else:
        anterior_d = anterior.conteudo
        if int(dados.get("versao") or 0) != anterior.versao or int(dados.get("revisao") or 0) != anterior.revisao:
            raise ErroAPI("CONFLITO_REVISAO", "Traço alterado por outra pessoa.", {"atual": anterior_d})
        if anterior.status == "aprovado":
            d.update(codigo=anterior_d["codigo"], versao=anterior.versao + 1, revisao=1, status="rascunho",
                     baseVersaoId=f"{anterior.id}:v{anterior.versao}", aprovacao=None)
        else:
            d.update(codigo=anterior_d["codigo"], versao=anterior.versao, revisao=anterior.revisao + 1, status=anterior.status)
        d["auditoria"] = {**anterior_d.get("auditoria", {}), "alteradoPor": usuario.email, "alteradoEm": instante}
    row = gravar(session, "tracos", d, anterior)
    auditar(session, usuario, "tracos.salvarVersao", "tracos", d, antes)
    return {"id": row.id, "codigo": d["codigo"], "versao": row.versao, "revisao": row.revisao, "documento": d}


def mudar_status_traco(session: Session, dados: dict, usuario: Usuario, aprovar: bool) -> dict:
    id_ = str(dados.get("id") or "")
    versao = int(dados.get("versao") or 0)
    row = session.scalar(select(Documento).where(Documento.tipo == "tracos", Documento.id == id_, Documento.versao == versao).with_for_update())
    if row is None:
        raise ErroAPI("NAO_ENCONTRADO", "Traço não encontrado.")
    if not pode_unidade(usuario, row.unidade):
        raise ErroAPI("SEM_PERMISSAO", "Unidade não autorizada.")
    if int(dados.get("revisao") or 0) != row.revisao:
        raise ErroAPI("CONFLITO_REVISAO", "Revisão diferente.", {"atual": row.conteudo})
    if row.status != ("em_teste" if aprovar else "rascunho"):
        raise ErroAPI("VALIDACAO", "Situação do traço não permite esta ação.")
    validar_traco(row.conteudo)
    antes = deepcopy(row.conteudo)
    d = deepcopy(antes)
    d["status"] = "aprovado" if aprovar else "em_teste"
    d["revisao"] = row.revisao + 1
    if aprovar:
        d["aprovacao"] = {"por": usuario.email, "em": agora(), "parecer": str(dados.get("parecer") or "")}
    gravar(session, "tracos", d, row)
    auditar(session, usuario, "tracos.aprovar" if aprovar else "tracos.enviarAprovacao", "tracos", d, antes)
    return {"id": row.id, "versao": row.versao, "revisao": row.revisao, "documento": d}


def salvar_generico(session: Session, tipo: str, dados: dict, usuario: Usuario) -> dict:
    validar_generico(tipo, dados)
    if not pode_unidade(usuario, str(dados["unidade"])):
        raise ErroAPI("SEM_PERMISSAO", "Unidade não autorizada.")
    row = atual(session, tipo, str(dados["id"]), lock=True)
    if row and int(dados.get("revisao") or 0) != row.revisao:
        raise ErroAPI("CONFLITO_REVISAO", "Cadastro alterado por outra pessoa.", {"atual": row.conteudo})
    d = deepcopy(dados)
    d["versao"] = row.versao if row else 1
    d["revisao"] = row.revisao + 1 if row else 1
    if tipo in ("materiais", "fornecedores") and d.get("status") == "excluido":
        d["status"] = "inativo"
    antes = deepcopy(row.conteudo) if row else None
    gravar(session, tipo, d, row)
    auditar(session, usuario, tipo + ".salvar", tipo, d, antes)
    return {"id": d["id"], "versao": d["versao"], "revisao": d["revisao"], "documento": d}


def excluir_custo(session: Session, dados: dict, usuario: Usuario) -> dict:
    row = atual(session, "custos", str(dados.get("id") or ""), lock=True)
    if row is None or not pode_unidade(usuario, row.unidade):
        raise ErroAPI("NAO_ENCONTRADO", "Custo não encontrado.")
    if str(dados.get("confirmacao") or "") != str(row.conteudo.get("nomeProduto") or ""):
        raise ErroAPI("VALIDACAO", "Digite o nome do produto para confirmar.")
    antes = deepcopy(row.conteudo)
    resultado = {"id": row.id, "versao": row.versao, "revisao": row.revisao}
    session.delete(row)
    auditar(session, usuario, "custos.excluir", "custos", None, antes)
    return resultado
