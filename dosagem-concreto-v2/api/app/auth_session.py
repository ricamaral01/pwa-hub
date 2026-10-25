"""Isolated Dosagem login: Hub ticket + PKCE, local emergency login, opaque cookie."""
import base64
import hashlib
import re
import secrets
import time
from datetime import datetime, timedelta, timezone

import httpx
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError, VerificationError
from sqlalchemy.orm import Session

from .config import Config
from .erros import ErroAPI
from .modelos import AuthFlow, AuthSession, AuthTicket, LocalCredencial, Usuario

HUB_ORIGIN = "https://usina.concretrack.com.br"
COOKIE = "ct_dosagem_sessao"
_B64 = re.compile(r"^[A-Za-z0-9_-]{43,128}$")
_STATE = re.compile(r"^[A-Za-z0-9_-]{32,128}$")
_hasher = PasswordHasher(time_cost=3, memory_cost=65536, parallelism=2)


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _hash(value: str) -> str:
    return hashlib.sha256(value.encode("ascii")).hexdigest()


def challenge_of(verifier: str) -> str:
    if not _B64.fullmatch(verifier):
        raise ErroAPI("VALIDACAO", "Verifier PKCE inválido.")
    return base64.urlsafe_b64encode(hashlib.sha256(verifier.encode("ascii")).digest()).decode("ascii").rstrip("=")


def iniciar(session: Session, estado: str, challenge: str) -> str:
    if not _STATE.fullmatch(estado) or not re.fullmatch(r"[A-Za-z0-9_-]{43}", challenge):
        raise ErroAPI("VALIDACAO", "Estado ou challenge inválido.")
    chave = _hash(estado)
    if session.get(AuthFlow, chave):
        raise ErroAPI("VALIDACAO", "Estado já utilizado.")
    session.add(AuthFlow(estado_hash=chave, challenge=challenge, expira_em=_now() + timedelta(minutes=5)))
    return f"{HUB_ORIGIN}/auth/ponte-dosagem.html?estado={estado}"


def _email_hub(token: str, cfg: Config) -> str:
    if not token or len(token) > 8192 or not cfg.supabase_url or not cfg.supabase_anon_key:
        raise ErroAPI("NAO_AUTENTICADO", "Sessão do Hub inválida.")
    try:
        response = httpx.get(cfg.supabase_url.rstrip("/") + "/auth/v1/user", headers={
            "Authorization": f"Bearer {token}", "apikey": cfg.supabase_anon_key}, timeout=5.0)
        if response.status_code == 200:
            email = response.json().get("email", "")
            if isinstance(email, str) and "@" in email:
                return email.lower()
    except (httpx.HTTPError, ValueError, TypeError, AttributeError):
        pass
    raise ErroAPI("NAO_AUTENTICADO", "Sessão do Hub inválida.")


def emitir_ticket(session: Session, estado: str, token: str, origem: str, cfg: Config) -> str:
    if origem != HUB_ORIGIN:
        raise ErroAPI("SEM_PERMISSAO", "Origem da ponte não autorizada.")
    email = _email_hub(token, cfg)
    if not _STATE.fullmatch(estado):
        raise ErroAPI("VALIDACAO", "Estado inválido.")
    flow = session.get(AuthFlow, _hash(estado), with_for_update=True)
    if not flow or flow.consumido or flow.expira_em <= _now():
        raise ErroAPI("NAO_AUTENTICADO", "Fluxo expirado ou utilizado.")
    flow.consumido = True
    ticket = secrets.token_urlsafe(32)
    session.add(AuthTicket(ticket_hash=_hash(ticket), estado_hash=flow.estado_hash, email=email,
                           expira_em=_now() + timedelta(seconds=60)))
    return ticket


def criar_sessao(session: Session, email: str, manter: bool) -> str:
    usuario = session.get(Usuario, email)
    if not usuario or not usuario.ativo:
        raise ErroAPI("SEM_PERMISSAO", "Acesso não liberado; peça ao administrador.")
    token = secrets.token_urlsafe(32)
    session.add(AuthSession(sessao_hash=_hash(token), email=email, expira_em=_now() +
                            timedelta(days=30 if manter else .5), persistente=manter))
    return token


def trocar_ticket(session: Session, ticket: str, estado: str, verifier: str, manter: bool = False) -> str:
    if not _STATE.fullmatch(estado) or not _B64.fullmatch(ticket):
        raise ErroAPI("NAO_AUTENTICADO", "Ticket inválido.")
    registro = session.get(AuthTicket, _hash(ticket), with_for_update=True)
    if not registro or registro.consumido or registro.expira_em <= _now() or registro.estado_hash != _hash(estado):
        raise ErroAPI("NAO_AUTENTICADO", "Ticket expirado ou utilizado.")
    flow = session.get(AuthFlow, registro.estado_hash)
    if not flow or not secrets.compare_digest(flow.challenge, challenge_of(verifier)):
        raise ErroAPI("NAO_AUTENTICADO", "PKCE inválido.")
    registro.consumido = True
    return criar_sessao(session, registro.email, manter)


def usuario_sessao(session: Session, token: str, renovar: bool = True) -> Usuario:
    if not token or not _B64.fullmatch(token):
        raise ErroAPI("NAO_AUTENTICADO", "Sessão inválida ou expirada.")
    registro = session.get(AuthSession, _hash(token), with_for_update=renovar)
    if not registro or registro.expira_em <= _now():
        raise ErroAPI("NAO_AUTENTICADO", "Sessão inválida ou expirada.")
    usuario = session.get(Usuario, registro.email)
    if not usuario or not usuario.ativo:
        raise ErroAPI("SEM_PERMISSAO", "Usuário sem acesso à Dosagem.")
    if renovar:
        registro.expira_em = _now() + timedelta(days=30 if registro.persistente else .5)
    return usuario


def login_local(session: Session, email: str, senha: str, manter: bool = False) -> tuple[str, bool]:
    inicio = time.monotonic()
    try:
        if not isinstance(email, str) or not isinstance(senha, str):
            raise ErroAPI("NAO_AUTENTICADO", "Credenciais inválidas.")
        email = email.strip().lower()
        cred = session.get(LocalCredencial, email, with_for_update=True)
        if not cred or (cred.bloqueado_ate and cred.bloqueado_ate > _now()):
            raise ErroAPI("NAO_AUTENTICADO", "Credenciais inválidas ou temporariamente bloqueadas.")
        try:
            correto = _hasher.verify(cred.senha_hash, senha)
        except (VerifyMismatchError, VerificationError):
            correto = False
        if not correto:
            cred.falhas += 1
            if cred.falhas >= 5:
                cred.bloqueado_ate = _now() + timedelta(minutes=15)
                cred.falhas = 0
            return "", False
        cred.falhas = 0
        cred.bloqueado_ate = None
        return criar_sessao(session, email, manter), cred.trocar_senha
    finally:
        restante = .35 - (time.monotonic() - inicio)
        if restante > 0:
            time.sleep(restante)


def senha_hash(senha: str) -> str:
    if len(senha) < 8:
        raise ErroAPI("VALIDACAO", "Senha precisa ter pelo menos 8 caracteres.")
    return _hasher.hash(senha)


def trocar_senha_local(session: Session, usuario: Usuario, senha_atual: str, nova_senha: str) -> None:
    cred = session.get(LocalCredencial, usuario.email, with_for_update=True)
    if not cred:
        raise ErroAPI("NAO_ENCONTRADO", "Conta local inexistente.")
    try:
        _hasher.verify(cred.senha_hash, senha_atual)
    except (VerifyMismatchError, VerificationError):
        raise ErroAPI("NAO_AUTENTICADO", "Senha atual inválida.") from None
    cred.senha_hash = senha_hash(nova_senha)
    cred.trocar_senha = False
    cred.falhas = 0
    cred.bloqueado_ate = None
