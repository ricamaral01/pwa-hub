import hashlib
import time
from threading import Lock

import httpx
import jwt
from sqlalchemy import select
from sqlalchemy.orm import Session

from .config import Config
from .erros import ErroAPI
from .modelos import Auditoria, Usuario

_cache: dict[str, tuple[float, dict[str, str]]] = {}
_cache_lock = Lock()


def verificar_token(token: str, cfg: Config) -> dict[str, str] | None:
    if not token or len(token) > 8192:
        return None
    chave = hashlib.sha256(token.encode()).hexdigest()
    with _cache_lock:
        cached = _cache.get(chave)
        if cached and cached[0] > time.monotonic():
            return cached[1]

    usuario = None
    if cfg.supabase_url and cfg.supabase_anon_key:
        try:
            url = cfg.supabase_url.rstrip("/") + "/auth/v1/user"
            resposta = httpx.get(url, headers={"Authorization": f"Bearer {token}", "apikey": cfg.supabase_anon_key}, timeout=5.0)
            if resposta.status_code == 200:
                body = resposta.json()
                if body.get("email"):
                    meta = body.get("user_metadata") or {}
                    usuario = {"email": str(body["email"]).lower(), "nome": str(meta.get("full_name") or meta.get("name") or body["email"])}
        except (httpx.HTTPError, ValueError, TypeError):
            pass
    if usuario is None and cfg.jwt_secret:
        try:
            opcoes = {"verify_aud": bool(cfg.jwt_audience), "require": ["exp"]}
            payload = jwt.decode(token, cfg.jwt_secret, algorithms=["HS256"], audience=cfg.jwt_audience or None, options=opcoes)
            email = payload.get("email") or payload.get("sub")
            if email:
                usuario = {"email": str(email).lower(), "nome": str(payload.get("name") or email)}
        except jwt.PyJWTError:
            pass
    if usuario:
        with _cache_lock:
            _cache[chave] = (time.monotonic() + 300, usuario)
    return usuario


def autorizar(session: Session, token: str, cfg: Config) -> Usuario:
    identidade = verificar_token(token, cfg)
    if not identidade:
        raise ErroAPI("NAO_AUTENTICADO", "Sessão inválida ou expirada.")
    usuario = session.get(Usuario, identidade["email"])
    if usuario is None:
        tem_usuario = session.scalar(select(Usuario.email).limit(1)) is not None
        if not tem_usuario and cfg.admin_email and identidade["email"] == cfg.admin_email.lower():
            usuario = Usuario(email=identidade["email"], nome=identidade["nome"], papel="admin", unidades=["*"], ativo=True)
            session.add(usuario)
            session.add(Auditoria(email=usuario.email, acao="usuarios.bootstrap", tipo="usuarios", documento_id=usuario.email,
                                  depois={"email": usuario.email, "papel": "admin", "unidades": ["*"], "ativo": True}))
            session.flush()
    if usuario is None or not usuario.ativo:
        raise ErroAPI("SEM_PERMISSAO", "Usuário sem acesso à Dosagem v2.")
    return usuario


def pode_unidade(usuario: Usuario, unidade: str) -> bool:
    return usuario.papel == "admin" or "*" in usuario.unidades or unidade in usuario.unidades


def verificar_permissao(usuario: Usuario, acao: str) -> None:
    leitura = acao.endswith(".listar") or acao.endswith(".obter")
    if acao == "usuarios.listar":
        return
    if acao == "avaliacoes.listar":
        return
    if acao == "avaliacoes.decidir":
        if usuario.papel not in ("admin", "engenheiro"):
            raise ErroAPI("SEM_PERMISSAO", "Decisão de impacto exige papel engenheiro.")
        return
    if acao.startswith("usuarios.") or acao.startswith("importacao.") or acao == "custos.excluir":
        if usuario.papel != "admin":
            raise ErroAPI("SEM_PERMISSAO", "Ação exige administrador.")
        return
    if acao == "tracos.aprovar":
        if usuario.papel not in ("admin", "engenheiro"):
            raise ErroAPI("SEM_PERMISSAO", "Aprovação exige papel engenheiro.")
        return
    if acao == "tracos.enviarAprovacao":
        if usuario.papel not in ("admin", "engenheiro", "laboratorista"):
            raise ErroAPI("SEM_PERMISSAO", "Liberação exige engenharia ou laboratório.")
        return
    if acao.split(".")[0] not in ("tracos", "materiais", "fornecedores", "ensaios", "custos", "producoes", "produtos", "lotes", "equipamentos"):
        raise ErroAPI("NAO_ENCONTRADO", "Ação desconhecida.")
    if leitura:
        return
    if acao == "producoes.salvar":
        if usuario.papel not in ("admin", "producao", "operador"):
            raise ErroAPI("SEM_PERMISSAO", "Registro de produção exige papel produção.")
        return
    if acao == "producoes.liberarDesforma":
        if usuario.papel not in ("admin", "engenheiro", "laboratorista"):
            raise ErroAPI("SEM_PERMISSAO", "Liberacao de desforma exige engenharia ou laboratorio.")
        return
    if usuario.papel in ("producao", "operador"):
        raise ErroAPI("SEM_PERMISSAO", "Produção só pode registrar produção.")
    if acao == "tracos.salvarVersao" and usuario.papel not in ("admin", "engenheiro", "laboratorista"):
        raise ErroAPI("SEM_PERMISSAO", "Traço exige engenharia ou laboratório.")
    if usuario.papel not in ("admin", "engenheiro", "laboratorista", "laboratorio"):
        raise ErroAPI("SEM_PERMISSAO", "Permissão insuficiente.")
