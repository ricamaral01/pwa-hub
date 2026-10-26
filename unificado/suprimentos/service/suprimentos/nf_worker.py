"""Outbox de NF S3-B. Um disparo por timer; a confirmação permanece humana."""
from __future__ import annotations

import json
import os
import urllib.error
import urllib.request
from datetime import datetime, timedelta, timezone

from sqlalchemy import and_, select, update
from sqlalchemy.orm import Session

from .db import database, table

UTC = timezone.utc


def run_once() -> str:
    """Reclama um job persistido e grava JSON sugerido; nunca altera a NF confirmada."""
    engine, _ = database()
    with Session(engine) as db:
        t = table("sup_nf_job")
        job = db.execute(select(t).where(and_(t.c.status.in_(("PENDENTE", "FALHOU")),
            t.c.proxima_tentativa_em <= datetime.now(UTC), t.c.tentativas < 3))
            .order_by(t.c.criado_em).with_for_update(skip_locked=True).limit(1)).mappings().one_or_none()
        if not job:
            return "SEM_JOB"
        job = dict(job)
        url, key = os.getenv("SUPRIMENTOS_NF_PROVIDER_URL"), os.getenv("SUPRIMENTOS_NF_PROVIDER_KEY")
        if not url or not key:
            db.execute(update(t).where(t.c.id == job["id"]).values(status="DESLIGADO",
                erro_codigo="PROVEDOR_NAO_CONFIGURADO", terminado_em=datetime.now(UTC),
                atualizado_em=datetime.now(UTC), atualizado_por="nf-worker"))
            db.commit()
            return "DESLIGADO"
        receipt_t = table("sup_recebimento")
        receipt = db.execute(select(receipt_t).where(and_(receipt_t.c.id == job["recebimento_id"],
            receipt_t.c.unidade_id == job["unidade_id"]))).mappings().one()
        db.execute(update(t).where(t.c.id == job["id"]).values(status="PROCESSANDO",
            tentativas=job["tentativas"]+1,iniciado_em=datetime.now(UTC),
            atualizado_em=datetime.now(UTC),atualizado_por="nf-worker"))
        db.commit()
    try:
        with open(receipt["anexo_path"], "rb") as handle:
            content = handle.read(12*1024*1024+1)
        if not content or len(content)>12*1024*1024:
            raise ValueError("ANEXO_INVALIDO")
        req = urllib.request.Request(url, data=content, method="POST",
            headers={"Authorization": "Bearer " + key,
                     "Content-Type": receipt["anexo_mime"] or "application/pdf",
                     "X-Suprimentos-Receipt": str(receipt["id"])})
        with urllib.request.urlopen(req, timeout=25) as response:
            result = json.load(response)
        if not isinstance(result, dict):
            raise ValueError("JSON_INVALIDO")
        result = {k: result.get(k) for k in ("numero", "chave", "cnpj", "data_emissao", "itens", "total")}
        if len(json.dumps(result))>100000:
            raise ValueError("JSON_MUITO_GRANDE")
    except (OSError, ValueError, urllib.error.URLError, json.JSONDecodeError) as exc:
        with Session(engine) as db:
            next_try = datetime.now(UTC)+timedelta(minutes=2**min(job["tentativas"]+1,3))
            db.execute(update(table("sup_nf_job")).where(table("sup_nf_job").c.id == job["id"])
                .values(status="FALHOU",erro_codigo=type(exc).__name__,
                        proxima_tentativa_em=next_try,terminado_em=datetime.now(UTC),
                        atualizado_em=datetime.now(UTC),atualizado_por="nf-worker"))
            db.commit()
        return "FALHOU"
    with Session(engine) as db:
        db.execute(update(table("sup_nf_job")).where(table("sup_nf_job").c.id == job["id"])
            .values(status="CONCLUIDO",resultado=result,erro_codigo=None,
                    terminado_em=datetime.now(UTC),atualizado_em=datetime.now(UTC),
                    atualizado_por="nf-worker"))
        # Dados extraídos são apenas uma sugestão separada; pessoa confirma no formulário.
        db.execute(update(table("sup_recebimento")).where(table("sup_recebimento").c.id == receipt["id"])
            .values(extraido=result,atualizado_em=datetime.now(UTC),atualizado_por="nf-worker"))
        db.commit()
    return "CONCLUIDO"


if __name__ == "__main__":
    print(run_once())
