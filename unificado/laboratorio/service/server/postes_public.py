"""Public, signed verification links for completed pole test reports."""
from __future__ import annotations

import base64
import hashlib
import hmac
import os
from html import escape
from urllib.parse import quote


def _secret() -> bytes:
    secret = os.getenv("LAB_GATEWAY_SIGNING_KEY", "")
    if len(secret) < 32:
        raise RuntimeError("Pole report signing key is not configured")
    return secret.encode("utf-8")


def report_token(test_id: str) -> str:
    digest = hmac.new(_secret(), f"postes-laudo-v1:{test_id}".encode(), hashlib.sha256).digest()
    return base64.urlsafe_b64encode(digest).rstrip(b"=").decode("ascii")


def valid_report_token(test_id: str, token: str) -> bool:
    return len(token) == 43 and hmac.compare_digest(token, report_token(test_id))


def report_url(record, request) -> str | None:
    if record.status != "finalizado":
        return None
    origin = os.getenv("POSTES_PUBLIC_ORIGIN", "").rstrip("/")
    if not origin:
        # The staging reverse proxy uses :18446; the production proxy uses 443.
        staging = request.url.port in (13065, 18446)
        origin = "https://concrefer.concretrack.com.br" + (":18446" if staging else "")
    return f"{origin}/v/postes/{quote(record.id, safe='')}/{report_token(record.id)}"


def verification_html(record, url: str) -> str:
    sample = escape(record.numero_amostra or "—")
    serial = escape(record.numero_serie_poste or "—")
    date = record.data_ensaio.strftime("%d/%m/%Y") if record.data_ensaio else "—"
    verdict = escape(record.veredito or "—")
    download = escape(url + "/laudo.pdf", quote=True)
    return f'''<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Verificação do laudo de postes · Concrefer</title>
<style>body{{margin:0;background:#f2f5f8;color:#17313e;font:16px system-ui,sans-serif}}
main{{width:min(680px,calc(100% - 32px));margin:8vh auto;background:white;border:1px solid #d9e2e9;border-radius:16px;box-shadow:0 14px 36px #17313e14;overflow:hidden}}
header{{background:#173c64;color:white;padding:26px 30px}}header b{{font-size:22px}}header p{{margin:6px 0 0;opacity:.86}}
section{{padding:28px 30px}}h1{{font-size:23px;margin:0 0 7px}}.ok{{color:#087844;font-weight:700}}dl{{display:grid;grid-template-columns:1fr 1fr;gap:15px;margin:26px 0}}dt{{font-size:12px;color:#607582}}dd{{margin:3px 0 0;font-weight:650;overflow-wrap:anywhere}}
a{{display:inline-block;background:#184b7b;color:white;text-decoration:none;padding:13px 20px;border-radius:9px;font-weight:700}}
small{{display:block;margin-top:18px;color:#607582}}@media(max-width:520px){{dl{{grid-template-columns:1fr}}section,header{{padding:22px}}}}</style>
</head><body><main><header><b>CONCREFER</b><p>Laudo de ensaio de postes</p></header><section>
<p class="ok">Documento verificado no sistema Concrefer</p><h1>Amostra {sample}</h1>
<dl><div><dt>Série do poste</dt><dd>{serial}</dd></div><div><dt>Data do ensaio</dt><dd>{date}</dd></div>
<div><dt>Revisão</dt><dd>{record.revisao}</dd></div><div><dt>Resultado</dt><dd>{verdict}</dd></div></dl>
<a href="{download}">Baixar laudo em PDF</a><small>O PDF é gerado a partir do ensaio finalizado. Confira o número da amostra e a revisão.</small>
</section></main></body></html>'''
