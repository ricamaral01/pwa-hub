"""systemd timer entrypoint. Failed SMTP deliveries never affect NC transactions."""
from __future__ import annotations

import os
import smtplib
import ssl
from datetime import datetime, timezone
from email.message import EmailMessage

from sqlalchemy import and_, select, update
from sqlalchemy.orm import Session

from .db import database, table


def send_pending(limit: int = 100) -> dict[str, int]:
    host = os.environ["QUALIDADE_SMTP_HOST"]
    user = os.environ["QUALIDADE_SMTP_USER"]
    password = os.environ["QUALIDADE_SMTP_PASSWORD"]
    sender = os.environ["QUALIDADE_SMTP_FROM"]
    port = int(os.getenv("QUALIDADE_SMTP_PORT", "587"))
    secure = os.getenv("QUALIDADE_SMTP_SECURE", "false").lower() == "true"
    engine, _ = database()
    outbox = table("notificacao_outbox")
    contacts = table("usuario_contato")
    sent = failed = skipped = 0
    with Session(engine) as db:
        with db.begin():
            pending = list(db.execute(select(outbox).where(and_(outbox.c.enviado_em.is_(None), outbox.c.enviar_apos <= datetime.now(timezone.utc))).order_by(outbox.c.enviar_apos).limit(limit).with_for_update(skip_locked=True)).mappings())
            for item in pending:
                email = item["destinatario_email"]
                if not email and item["destinatario_id"]:
                    email = db.execute(select(contacts.c.email).where(and_(contacts.c.usuario_id == item["destinatario_id"], contacts.c.ativo.is_(True)))).scalar_one_or_none()
                if not email:
                    db.execute(update(outbox).where(outbox.c.id == item["id"]).values(tentativas=item["tentativas"] + 1, ultimo_erro_codigo="SEM_EMAIL"))
                    skipped += 1
                    continue
                message = EmailMessage()
                message["From"] = sender
                message["To"] = email
                message["Subject"] = f"Qualidade: {item['evento']} — {item['payload'].get('numero') or 'NC'}"
                message.set_content(f"Há uma pendência da NC {item['payload'].get('numero') or item['payload'].get('nc_id')} no Unificado.")
                try:
                    smtp_factory = smtplib.SMTP_SSL if secure else smtplib.SMTP
                    with smtp_factory(host, port, timeout=15) as smtp:
                        if not secure:
                            smtp.starttls(context=ssl.create_default_context())
                        smtp.login(user, password)
                        smtp.send_message(message)
                    db.execute(update(outbox).where(outbox.c.id == item["id"]).values(destinatario_email=email, enviado_em=datetime.now(timezone.utc), tentativas=item["tentativas"] + 1, ultimo_erro_codigo=None))
                    sent += 1
                except (smtplib.SMTPException, OSError):
                    db.execute(update(outbox).where(outbox.c.id == item["id"]).values(tentativas=item["tentativas"] + 1, ultimo_erro_codigo="SMTP_FALHOU"))
                    failed += 1
    return {"sent": sent, "failed": failed, "skipped": skipped}


if __name__ == "__main__":
    print(send_pending())
