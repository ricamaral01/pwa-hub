from uuid import UUID

import pytest
from fastapi import HTTPException

from quality.api import can_read, can_treat
from quality.auth import Actor

NC = {"status": "REGISTRADA", "unidade_codigo": "pederneiras", "criado_por": "author",
      "responsavel_id": "owner", "area_emissora_id": UUID("11111111-1111-4111-8111-111111111111"),
      "area_responsavel_id": UUID("22222222-2222-4222-8222-222222222222")}


def user(uid, *actions, unit=None, superuser=False):
    return Actor(uid, "Pessoa", frozenset(actions), unit=unit, superuser=superuser)


def test_draft_visible_only_to_author_or_superuser():
    draft = NC | {"status": "RASCUNHO"}
    assert can_read(draft, user("author"))
    assert can_read(draft, user("master", superuser=True))
    assert not can_read(draft, user("other", "qualidade.nc.ver_todas"))


def test_read_scopes_and_unit():
    assert can_read(NC, user("author"))
    assert can_read(NC, user("owner"))
    assert can_read(NC, user("other", "qualidade.nc.ver_todas"))
    assert can_read(NC, user("area", "qualidade.nc.ver_area"), frozenset({str(NC["area_responsavel_id"])}))
    assert not can_read(NC, user("area", "qualidade.nc.ver_area"))
    assert not can_read(NC, user("other"))
    assert not can_read(NC, user("other", "qualidade.nc.ver_todas", unit="ribeirao"))


def test_treat_requires_action_and_assignment_or_area():
    can_treat(NC, user("owner", "qualidade.nc.tratar"))
    can_treat(NC, user("master", superuser=True))
    can_treat(NC, user("area", "qualidade.nc.tratar"), frozenset({str(NC["area_responsavel_id"])}))
    with pytest.raises(HTTPException):
        can_treat(NC, user("owner"))
    with pytest.raises(HTTPException):
        can_treat(NC, user("other", "qualidade.nc.tratar"))
