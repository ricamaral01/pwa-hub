"""Pure NC workflow rules shared by the API and its tests."""
from __future__ import annotations

from datetime import date, timedelta
from io import BytesIO
import secrets
from zipfile import BadZipFile, ZipFile

STATES = (
    "RASCUNHO", "REGISTRADA", "CONTENCAO", "ANALISE_CAUSA", "PLANO_ACAO",
    "VERIFICACAO_EFICACIA", "ENCERRAMENTO", "ENCERRADA", "CANCELADA",
)
TRANSITIONS = {
    "registrar": ("RASCUNHO", "REGISTRADA"),
    "triar": ("REGISTRADA", "CONTENCAO"),
    "concluir_contencao": ("CONTENCAO", "ANALISE_CAUSA"),
    "dispensar_corretiva": ("CONTENCAO", "ENCERRAMENTO"),
    "concluir_causa": ("ANALISE_CAUSA", "PLANO_ACAO"),
    "concluir_plano": ("PLANO_ACAO", "VERIFICACAO_EFICACIA"),
    "eficaz": ("VERIFICACAO_EFICACIA", "ENCERRAMENTO"),
    "ineficaz": ("VERIFICACAO_EFICACIA", "ENCERRAMENTO"),
    "encerrar": ("ENCERRAMENTO", "ENCERRADA"),
    "reabrir": ("ENCERRADA", "ANALISE_CAUSA"),
    "cancelar_registrada": ("REGISTRADA", "CANCELADA"),
    "cancelar_contencao": ("CONTENCAO", "CANCELADA"),
    "descartar": ("RASCUNHO", "CANCELADA"),
}


class RuleError(ValueError):
    pass


def draw_rnc_number(year: int, is_used, *, attempts: int = 64) -> str:
    """Draw a six digit public number; the caller serializes allocation by counter row.

    The internal counter is deliberately separate from the visible random label.
    ``is_used`` must query the same database transaction that will save the label.
    """
    for _ in range(attempts):
        number = f"RNC-{year}-{100000 + secrets.randbelow(900000):06d}"
        if not is_used(number):
            return number
    raise RuleError("Não foi possível sortear um número RNC disponível.")


def transition(status: str, event: str) -> str:
    pair = TRANSITIONS.get(event)
    if pair is None or pair[0] != status:
        raise RuleError(f"Transição {event} indisponível em {status}.")
    return pair[1]


def require_text(value: str | None, label: str) -> str:
    result = (value or "").strip()
    if not result:
        raise RuleError(f"{label} é obrigatório.")
    return result


def validate_registration(nc: dict, *, mobile: bool = False) -> None:
    require_text(nc.get("descricao"), "Descrição")
    if mobile:
        if not (nc.get("setor_pcp_id") or nc.get("area_emissora_id")):
            raise RuleError("Informe onde ocorreu (setor ou área).")
    else:
        for key, label in (("titulo", "Título"), ("origem_id", "Origem"),
                           ("data_deteccao", "Data de detecção")):
            require_text(str(nc.get(key) or ""), label)
        if not (nc.get("setor_pcp_id") or nc.get("area_emissora_id")):
            raise RuleError("Informe setor ou área.")


def validate_closure(nc: dict, closure: dict, actions: list[dict], efficacy: list[dict], severity: str,
                     *, successor_exists: bool = False) -> None:
    for key in ("atualizar_riscos", "revisar_documento"):
        if closure.get(key) is None:
            raise RuleError(f"Resposta {key} é obrigatória.")
    for key in ("justificativa_riscos", "justificativa_documento"):
        require_text(closure.get(key), key)
    if severity == "MAIOR":
        if not any(a["tipo"] == "CORRETIVA" for a in actions):
            raise RuleError("NC Maior exige ação corretiva.")
        if not efficacy or (efficacy[-1].get("resultado") != "EFICAZ" and not successor_exists):
            raise RuleError("RNC Maior exige eficácia eficaz ou nova RNC vinculada.")


def validate_cause(cause: dict) -> None:
    require_text(cause.get("causa_raiz"), "Causa-raiz")
    if cause.get("pode_ocorrer_outro_local") is None:
        raise RuleError("Responda se pode ocorrer em outro local.")
    if cause["pode_ocorrer_outro_local"]:
        require_text(cause.get("outro_local_descricao"), "Outro local")


def validate_verifier(actions: list[dict], verifier_id: str) -> None:
    if any(a.get("quem_id") == verifier_id for a in actions):
        raise RuleError("Executor da ação não pode verificar a eficácia.")


def validate_file(mime: str, data: bytes) -> None:
    if len(data) > 25 * 1024 * 1024:
        raise RuleError("Arquivo excede 25 MiB.")
    if mime == "application/pdf":
        valid = data.startswith(b"%PDF-")
    elif mime == "image/png":
        valid = data.startswith(b"\x89PNG\r\n\x1a\n")
    elif mime == "image/jpeg":
        valid = data.startswith(b"\xff\xd8\xff")
    elif mime == "image/webp":
        valid = data.startswith(b"RIFF") and data[8:12] == b"WEBP"
    elif mime == "text/plain":
        try:
            data.decode("utf-8")
            valid = b"\0" not in data
        except UnicodeDecodeError:
            valid = False
    elif mime in ("application/msword", "application/vnd.ms-excel"):
        valid = data.startswith(b"\xd0\xcf\x11\xe0\xa1\xb1\x1a\xe1")
    elif mime in ("application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"):
        try:
            with ZipFile(BytesIO(data)) as archive:
                entries = archive.namelist()
                valid = "[Content_Types].xml" in entries and ("word/document.xml" in entries if "wordprocessingml" in mime else "xl/workbook.xml" in entries)
        except BadZipFile:
            valid = False
    else:
        valid = False
    if not valid:
        raise RuleError("Conteúdo não corresponde ao MIME permitido.")


def validate_concession_approvals(containments: list[dict], disposition_codes: dict) -> None:
    if any(disposition_codes.get(item["disposicao_id"]) == "CONCESSAO"
           and not item.get("concessao_aprovada_por") for item in containments):
        raise RuleError("Concessao exige aprovacao antes de concluir a contencao.")


def due_status(prazo: date | None, status: str, today: date | None = None) -> bool:
    return bool(prazo and prazo < (today or date.today()) and status not in ("ENCERRADA", "CANCELADA"))


def due_notice_at(prazo: date) -> date:
    return prazo - timedelta(days=2)
