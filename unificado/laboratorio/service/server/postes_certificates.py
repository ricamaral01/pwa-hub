"""Completed pole tests for Quality and certificate scoped external access."""
from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
import secrets
import time
from datetime import datetime, timedelta, timezone
from html import escape
from pathlib import Path
from urllib.parse import quote

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from fastapi.responses import FileResponse, HTMLResponse, RedirectResponse, StreamingResponse
from pydantic import BaseModel, Field
from sqlalchemy import delete, func, select

from .postes_api import db, get_test, photo_root, record_dict
from .postes_db import CertificateAccess, CertificateSession, InspectionPhoto, Test, TestAttachment, password_hash, verify_password
from .postes_report_v2 import report_html_v2, report_pdf_v2
from .postes_public import report_url

router = APIRouter()
COOKIE = "ct_certificate_session"
PUBLIC_BASE = "/certificados/postes"


def quality_user(request: Request):
    """The Quality gateway signs this assertion after checking the Unificado session."""
    if request.client is None or request.client.host != "127.0.0.1":
        raise HTTPException(403, "Acesso apenas pelo gateway local.")
    secret = os.getenv("QUALIDADE_GATEWAY_SIGNING_KEY", "")
    value = request.headers.get("x-qualidade-assertion", "")
    if len(secret) < 32 or len(value) > 8192 or value.count(".") != 1:
        raise HTTPException(401, "Sessão da Qualidade inválida.")
    try:
        encoded, signature = value.split(".", 1)
        expected = base64.urlsafe_b64encode(hmac.new(secret.encode(), encoded.encode(), hashlib.sha256).digest()).rstrip(b"=").decode()
        if not hmac.compare_digest(signature, expected):
            raise ValueError("signature")
        claim = json.loads(base64.urlsafe_b64decode(encoded + "=" * (-len(encoded) % 4)))
        if (claim.get("iss") != "unificado" or not isinstance(claim.get("id"), str) or not claim["id"]
                or not isinstance(claim.get("name"), str) or not claim["name"].strip()
                or not isinstance(claim.get("exp"), int) or not 0 <= claim["exp"] - int(time.time()) <= 20
                or not isinstance(claim.get("actions"), list)
                or not isinstance(claim.get("superuser", False), bool)):
            raise ValueError("claim")
        return claim
    except (ValueError, TypeError, KeyError, UnicodeError):
        raise HTTPException(401, "Sessão da Qualidade inválida.") from None


def certificate_url(request: Request, test_id: str) -> str:
    host = os.getenv("POSTES_CERTIFICATE_ORIGIN", "https://concrefer.concretrack.com.br").rstrip("/")
    return f"{host}{PUBLIC_BASE}/{quote(test_id)}"


def completed(session, test_id: str) -> Test:
    record = get_test(session, test_id)
    if record.status != "finalizado":
        raise HTTPException(404, "Certificado indisponível.")
    return record


def file_meta(session, record: Test):
    attachments = session.scalars(select(TestAttachment).where(TestAttachment.ensaio_id == record.id)
                                  .order_by(TestAttachment.criado_em)).all()
    photos = session.scalars(select(InspectionPhoto).where(InspectionPhoto.ensaio_id == record.id)
                             .order_by(InspectionPhoto.criado_em)).all()
    return ([{"id": row.id, "nome": row.nome_original, "tipo_mime": row.tipo_mime,
              "tamanho": row.tamanho,
              "url": f"/unificado/qualidade/postes-api/ensaios/{record.id}/anexos/{row.id}"}
             for row in attachments],
            [{"id": row.id, "item": row.item,
              "url": f"/unificado/qualidade/postes-api/ensaios/{record.id}/fotos/{row.id}"}
             for row in photos])


@router.get("/api/qualidade/postes/ensaios")
def quality_tests(user=Depends(quality_user), session=Depends(db)):
    rows = session.scalars(select(Test).where(Test.status == "finalizado")
                           .order_by(Test.data_ensaio.desc(), Test.criado_em.desc())).all()
    return [{"id": row.id, "numero_amostra": row.numero_amostra,
             "numero_serie_poste": row.numero_serie_poste, "data_ensaio": row.data_ensaio,
             "poste": row.poste_snapshot, "veredito": row.veredito,
             "revisao": row.revisao, "observacoes": row.observacoes or ""} for row in rows]


@router.get("/api/qualidade/postes/ensaios/{test_id}")
def quality_test(test_id: str, request: Request, user=Depends(quality_user), session=Depends(db)):
    record = completed(session, test_id)
    attachments, photos = file_meta(session, record)
    access = session.get(CertificateAccess, test_id)
    return {"ensaio": record_dict(record), "anexos": attachments, "fotos": photos,
            "certificado_url": certificate_url(request, test_id),
            "acesso_externo_ativo": access is not None,
            "login_externo": access.login if access else None}


def quality_file(test_id: str, file_id: str, kind: str, session):
    completed(session, test_id)
    if kind == "anexos":
        row = session.get(TestAttachment, file_id)
        if row is None or row.ensaio_id != test_id:
            raise HTTPException(404, "Anexo não encontrado.")
        target = photo_root() / "anexos" / row.arquivo
        mime, name = row.tipo_mime, row.nome_original
    else:
        row = session.get(InspectionPhoto, file_id)
        if row is None or row.ensaio_id != test_id:
            raise HTTPException(404, "Foto não encontrada.")
        target = photo_root() / row.arquivo
        mime, name = row.tipo_mime, row.arquivo
    if not target.is_file():
        raise HTTPException(404, "Arquivo não encontrado.")
    return FileResponse(target, media_type=mime, filename=name,
                        headers={"Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff"})


@router.get("/api/qualidade/postes/ensaios/{test_id}/anexos/{file_id}")
def quality_attachment(test_id: str, file_id: str, user=Depends(quality_user), session=Depends(db)):
    return quality_file(test_id, file_id, "anexos", session)


@router.get("/api/qualidade/postes/ensaios/{test_id}/fotos/{file_id}")
def quality_photo(test_id: str, file_id: str, user=Depends(quality_user), session=Depends(db)):
    return quality_file(test_id, file_id, "fotos", session)


@router.get("/api/qualidade/postes/ensaios/{test_id}/certificado.pdf")
def quality_certificate(test_id: str, request: Request, user=Depends(quality_user), session=Depends(db)):
    record = completed(session, test_id)
    content = report_pdf_v2(record, session, report_url(record, request))
    return Response(content, media_type="application/pdf", headers={"Cache-Control": "private, no-store",
        "Content-Disposition": f'inline; filename="certificado-poste-{record.id}.pdf"'})


@router.post("/api/qualidade/postes/ensaios/{test_id}/acesso-externo")
def issue_access(test_id: str, request: Request, user=Depends(quality_user), session=Depends(db)):
    origin = request.headers.get("origin", "")
    if origin and origin != os.getenv("POSTES_CERTIFICATE_ORIGIN", "https://concrefer.concretrack.com.br").rstrip("/"):
        raise HTTPException(403, "Origem da solicitação inválida.")
    if not (user["superuser"] or "qualidade.nc.ver_todas" in user["actions"]):
        raise HTTPException(403, "Apenas a equipe da Qualidade pode emitir o acesso externo.")
    completed(session, test_id)
    login = "poste-" + secrets.token_hex(6)
    password = secrets.token_urlsafe(18)
    access = session.get(CertificateAccess, test_id)
    if access is None:
        access = CertificateAccess(ensaio_id=test_id, login=login, senha_hash=password_hash(password),
                                   criado_por=user["name"])
        session.add(access)
    else:
        access.login = login
        access.senha_hash = password_hash(password)
        access.tentativas = 0
        access.bloqueado_ate = None
        session.execute(delete(CertificateSession).where(CertificateSession.ensaio_id == test_id))
    session.commit()
    return {"login": login, "senha": password, "url": certificate_url(request, test_id)}


class ExternalLogin(BaseModel):
    login: str = Field(min_length=1, max_length=80)
    senha: str = Field(min_length=1, max_length=200)


def external_session(request: Request, test_id: str, session):
    token = request.cookies.get(COOKIE, "")
    if not token or len(token) > 200:
        return False
    row = session.get(CertificateSession, hashlib.sha256(token.encode()).hexdigest())
    expiry = row.expira_em.replace(tzinfo=timezone.utc) if row and row.expira_em.tzinfo is None else row.expira_em if row else None
    return bool(row and row.ensaio_id == test_id and expiry > datetime.now(timezone.utc))


def login_page(test_id: str):
    safe_id = escape(test_id, quote=True)
    return f'''<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Certificado de poste · acesso</title>
<style>body{{font:16px system-ui;background:#eef3f4;color:#17333b;margin:0;min-height:100vh;display:grid;place-items:center}}main{{width:min(420px,calc(100% - 36px));background:white;padding:30px;border-radius:16px;box-shadow:0 12px 35px #17333b25}}h1{{font-size:24px}}label{{display:block;margin:15px 0}}input{{box-sizing:border-box;display:block;width:100%;padding:12px;margin-top:6px;border:1px solid #9db1b7;border-radius:8px;font:inherit}}button{{background:#114c5a;color:white;border:0;border-radius:8px;padding:12px 18px;font:inherit;cursor:pointer}}small{{color:#526d73}}#erro{{color:#a72d23}}</style></head><body><main><small>CONCREFER · ENSAIO DE POSTES</small><h1>Consultar certificado</h1><p>Informe o login e a senha exclusivos deste certificado. Este acesso permite consultar e imprimir apenas este documento.</p><form id="login"><label>Login<input name="login" autocomplete="username" required></label><label>Senha<input name="senha" type="password" autocomplete="current-password" required></label><p id="erro" role="alert"></p><button>Entrar</button></form></main><script>document.getElementById('login').addEventListener('submit',async function(e){{e.preventDefault();const f=new FormData(this);const r=await fetch('/certificados/postes/{safe_id}/entrar',{{method:'POST',headers:{{'Content-Type':'application/json'}},body:JSON.stringify(Object.fromEntries(f)),credentials:'same-origin'}});if(r.ok)location.reload();else document.getElementById('erro').textContent='Login ou senha inválidos, ou acesso temporariamente bloqueado.'}})</script></body></html>'''


@router.get(f"{PUBLIC_BASE}/{{test_id}}", response_class=HTMLResponse)
def external_view(test_id: str, request: Request, session=Depends(db)):
    record = completed(session, test_id)
    if not external_session(request, test_id, session):
        return HTMLResponse(login_page(test_id), headers={"Cache-Control": "private, no-store",
                            "X-Frame-Options": "DENY", "X-Content-Type-Options": "nosniff"})
    html = report_html_v2(record, session, certificate_url(request, test_id), external=True)
    return HTMLResponse(html, headers={"Cache-Control": "private, no-store",
                              "X-Frame-Options": "DENY", "X-Content-Type-Options": "nosniff"})


@router.post(f"{PUBLIC_BASE}/{{test_id}}/entrar")
def external_login(test_id: str, payload: ExternalLogin, request: Request,
                   response: Response, session=Depends(db)):
    completed(session, test_id)
    access = session.get(CertificateAccess, test_id)
    now = datetime.now(timezone.utc)
    locked = access.bloqueado_ate.replace(tzinfo=timezone.utc) if access and access.bloqueado_ate and access.bloqueado_ate.tzinfo is None else access.bloqueado_ate if access else None
    if access is None or (locked and locked > now):
        raise HTTPException(401, "Login ou senha inválidos.")
    valid = hmac.compare_digest(access.login, payload.login) and verify_password(payload.senha, access.senha_hash)
    if not valid:
        access.tentativas += 1
        if access.tentativas >= 5:
            access.bloqueado_ate = now + timedelta(minutes=15)
            access.tentativas = 0
        session.commit()
        raise HTTPException(401, "Login ou senha inválidos.")
    access.tentativas = 0
    access.bloqueado_ate = None
    raw = secrets.token_urlsafe(32)
    session.add(CertificateSession(token_hash=hashlib.sha256(raw.encode()).hexdigest(),
                                   ensaio_id=test_id, expira_em=now + timedelta(hours=4)))
    session.commit()
    response.set_cookie(COOKIE, raw, max_age=4 * 3600, httponly=True,
                        secure=True, samesite="lax", path=f"{PUBLIC_BASE}/")
    return {"ok": True}


@router.get(f"{PUBLIC_BASE}/{{test_id}}/certificado.pdf")
def external_pdf(test_id: str, request: Request, session=Depends(db)):
    record = completed(session, test_id)
    if not external_session(request, test_id, session):
        raise HTTPException(401, "Faça login neste certificado.")
    content = report_pdf_v2(record, session, report_url(record, request))
    return Response(content, media_type="application/pdf", headers={"Cache-Control": "private, no-store",
        "Content-Disposition": f'inline; filename="certificado-poste-{record.id}.pdf"'})


@router.get(f"{PUBLIC_BASE}/{{test_id}}/anexos/{{file_id}}")
def external_attachment(test_id: str, file_id: str, request: Request, session=Depends(db)):
    if not external_session(request, test_id, session):
        raise HTTPException(401, "Faça login neste certificado.")
    return quality_file(test_id, file_id, "anexos", session)


@router.post(f"{PUBLIC_BASE}/{{test_id}}/sair")
def external_logout(test_id: str, request: Request, session=Depends(db)):
    token = request.cookies.get(COOKIE, "")
    if token:
        session.execute(delete(CertificateSession).where(
            CertificateSession.token_hash == hashlib.sha256(token.encode()).hexdigest(),
            CertificateSession.ensaio_id == test_id))
        session.commit()
    response = RedirectResponse(f"{PUBLIC_BASE}/{quote(test_id)}", status_code=303)
    response.delete_cookie(COOKIE, path=f"{PUBLIC_BASE}/")
    return response
