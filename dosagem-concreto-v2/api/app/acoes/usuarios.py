from sqlalchemy import select
from sqlalchemy.orm import Session

from ..erros import ErroAPI
from ..modelos import Usuario
from .documentos import auditar


def listar_usuarios(session: Session, usuario: Usuario) -> list[dict]:
    rows = session.scalars(select(Usuario)).all() if usuario.papel == "admin" else [usuario]
    return [{"email": u.email, "nome": u.nome, "papel": u.papel, "unidades": u.unidades, "ativo": u.ativo} for u in rows]


def salvar_usuario(session: Session, dados: dict, usuario: Usuario) -> dict:
    email = str(dados.get("email") or "").strip().lower()
    papel = str(dados.get("papel") or "")
    unidades = dados.get("unidades")
    if not email or "@" not in email or papel not in ("admin", "engenheiro", "laboratorio") or not isinstance(unidades, list):
        raise ErroAPI("VALIDACAO", "Usuário, papel ou unidades inválidos.")
    row = session.get(Usuario, email)
    antes = {"email": row.email, "nome": row.nome, "papel": row.papel, "unidades": row.unidades, "ativo": row.ativo} if row else None
    if row is None:
        row = Usuario(email=email)
    row.nome = str(dados.get("nome") or email)
    row.papel = papel
    row.unidades = [str(x) for x in unidades]
    row.ativo = dados.get("ativo") is not False
    session.add(row)
    depois = {"email": row.email, "nome": row.nome, "papel": row.papel, "unidades": row.unidades, "ativo": row.ativo}
    auditar(session, usuario, "usuarios.salvar", "usuarios", depois, antes)
    return {"id": email, "versao": 1, "revisao": 1, "documento": depois}
