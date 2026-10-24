from datetime import date
from decimal import Decimal
from pathlib import Path
import sys

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "unificado/pcp/backend"))
from app.services.pederneiras_rules import (
    assert_can_confirm, counts_as_post, monthly_target, posts_per_person, production_summary,
    validate_day, validate_people, validate_quantity,
)


def test_day_and_quantities():
    assert validate_day(date(2026, 10, 23), today=date(2026, 10, 23)) == date(2026, 10, 23)
    with pytest.raises(ValueError, match="futura"):
        validate_day(date(2026, 10, 24), today=date(2026, 10, 23))
    assert validate_quantity(0) == 0
    for value in (-1, 1.5, True):
        with pytest.raises(ValueError):
            validate_quantity(value)


def test_people_step_and_confirmation():
    assert validate_people(Decimal("1.25")) == Decimal("1.25")
    for value in (Decimal("-0.25"), Decimal("0.10"), Decimal("NaN")):
        with pytest.raises(ValueError):
            validate_people(value)
    with pytest.raises(ValueError, match="sem mão de obra"):
        assert_can_confirm(8, Decimal("0"))
    assert_can_confirm(8, Decimal("1.25"))


def test_shared_indicators():
    assert counts_as_post("Padrão")
    assert not counts_as_post("Acessórios")
    assert posts_per_person(59, Decimal("10")) == Decimal("5.90")
    assert posts_per_person(59, Decimal("0")) is None
    assert monthly_target(23, 64) == 1472
    assert production_summary([(3, Decimal("0.1234")), (2, Decimal("0.2000"))]) == {
        "postes": 5, "volume_m3": Decimal("0.7702"), "produtos_sem_volume": 0,
    }
    assert production_summary([(2, None), (1, Decimal("0.1"))]) == {
        "postes": 3, "volume_m3": None, "produtos_sem_volume": 1,
    }
