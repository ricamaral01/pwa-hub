from datetime import date

import pytest

from quality.rules import RuleError, draw_rnc_number, due_status, transition, validate_cause, validate_closure, validate_concession_approvals, validate_file, validate_registration, validate_verifier


@pytest.mark.parametrize("event,source,target", [
    ("registrar", "RASCUNHO", "REGISTRADA"),
    ("triar", "REGISTRADA", "CONTENCAO"),
    ("concluir_contencao", "CONTENCAO", "ANALISE_CAUSA"),
    ("concluir_causa", "ANALISE_CAUSA", "PLANO_ACAO"),
    ("concluir_plano", "PLANO_ACAO", "VERIFICACAO_EFICACIA"),
    ("eficaz", "VERIFICACAO_EFICACIA", "ENCERRAMENTO"),
    ("ineficaz", "VERIFICACAO_EFICACIA", "ENCERRAMENTO"),
    ("encerrar", "ENCERRAMENTO", "ENCERRADA"),
    ("reabrir", "ENCERRADA", "ANALISE_CAUSA"),
    ("descartar", "RASCUNHO", "CANCELADA"),
])
def test_transition(event, source, target):
    assert transition(source, event) == target


def test_no_generic_transition():
    with pytest.raises(RuleError):
        transition("REGISTRADA", "encerrar")


def test_drawn_number_retries_collision_and_keeps_six_digits(monkeypatch):
    draws = iter((0, 123456))
    monkeypatch.setattr("quality.rules.secrets.randbelow", lambda bound: next(draws))
    assert draw_rnc_number(2026, lambda value: value == "RNC-2026-100000") == "RNC-2026-223456"


def test_drawn_number_fails_after_bounded_attempts(monkeypatch):
    monkeypatch.setattr("quality.rules.secrets.randbelow", lambda bound: 0)
    with pytest.raises(RuleError):
        draw_rnc_number(2026, lambda _: True, attempts=2)


def test_mobile_minimum():
    validate_registration({"descricao": "Trinca", "setor_pcp_id": "P3"}, mobile=True)
    with pytest.raises(RuleError):
        validate_registration({"descricao": "Trinca"}, mobile=True)


def test_major_requires_corrective_and_effective_round():
    nc = {}
    closure = {"atualizar_riscos": False, "revisar_documento": True,
               "justificativa_riscos": "sem alteração", "justificativa_documento": "revisar PR"}
    with pytest.raises(RuleError):
        validate_closure(nc, closure, [], [], "MAIOR")
    with pytest.raises(RuleError):
        validate_closure(nc, closure, [{"tipo": "CORRETIVA"}], [{"resultado": "NAO_EFICAZ"}], "MAIOR")
    validate_closure(nc, closure, [{"tipo": "CORRETIVA"}], [{"resultado": "EFICAZ"}], "MAIOR")
    validate_closure(nc, closure, [{"tipo": "CORRETIVA"}], [{"resultado": "NAO_EFICAZ"}],
                     "MAIOR", successor_exists=True)


def test_concession_requires_approval_before_containment_finishes():
    items = [{"disposicao_id": "concession", "concessao_aprovada_por": None},
             {"disposicao_id": "segregation", "concessao_aprovada_por": None}]
    codes = {"concession": "CONCESSAO", "segregation": "SEGREGAR"}
    with pytest.raises(RuleError):
        validate_concession_approvals(items, codes)
    items[0]["concessao_aprovada_por"] = "quality-approver"
    validate_concession_approvals(items, codes)


def test_due_is_computed():
    assert due_status(date(2026, 10, 14), "PLANO_ACAO", date(2026, 10, 15))
    assert not due_status(date(2026, 10, 14), "ENCERRADA", date(2026, 10, 15))


def test_cause_requires_root_and_other_location_answer():
    with pytest.raises(RuleError):
        validate_cause({"causa_raiz": "", "pode_ocorrer_outro_local": None})
    with pytest.raises(RuleError):
        validate_cause({"causa_raiz": "procedimento", "pode_ocorrer_outro_local": None})
    with pytest.raises(RuleError):
        validate_cause({"causa_raiz": "procedimento", "pode_ocorrer_outro_local": True})
    validate_cause({"causa_raiz": "procedimento", "pode_ocorrer_outro_local": False})


def test_verifier_must_differ_from_executor():
    with pytest.raises(RuleError):
        validate_verifier([{"quem_id": "u1"}], "u1")
    validate_verifier([{"quem_id": "u1"}], "u2")


@pytest.mark.parametrize("mime,content", [
    ("application/pdf", b"%PDF-1.7 test"),
    ("image/png", b"\x89PNG\r\n\x1a\n"),
    ("image/jpeg", b"\xff\xd8\xff"),
    ("image/webp", b"RIFF\x00\x00\x00\x00WEBP"),
    ("text/plain", b"evidencia"),
])
def test_file_signature(mime, content):
    validate_file(mime, content)


def test_file_mime_spoofing_and_limit():
    with pytest.raises(RuleError):
        validate_file("application/pdf", b"not pdf")
    with pytest.raises(RuleError):
        validate_file("text/plain", b"x" * (25 * 1024 * 1024 + 1))
