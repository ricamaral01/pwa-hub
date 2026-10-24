"""Shared production calculations, independent of transport and user interface."""
from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from zoneinfo import ZoneInfo

BRAZIL_TIME = ZoneInfo("America/Sao_Paulo")
QUARTER = Decimal("0.25")
NON_POST_FAMILY = "Acessórios"


def counts_as_post(family: str) -> bool:
    """The LT-PRO-04 total excludes its accessory rows (58 through 64)."""
    return family.strip().casefold() != NON_POST_FAMILY.casefold()


def validate_day(day: date, *, today: date | None = None) -> date:
    today = today or datetime.now(BRAZIL_TIME).date()
    if day > today:
        raise ValueError("Data futura não permitida")
    return day


def validate_quantity(value: int) -> int:
    if isinstance(value, bool) or not isinstance(value, int) or value < 0:
        raise ValueError("Quantidade deve ser um inteiro não negativo")
    return value


def validate_people(value: Decimal) -> Decimal:
    amount = Decimal(str(value))
    if not amount.is_finite() or amount < 0 or amount % QUARTER != 0:
        raise ValueError("Mão de obra deve ser não negativa, em passos de 0,25")
    return amount


def production_summary(items: list[tuple[int, Decimal | None]]) -> dict:
    total_posts = 0
    total_volume = Decimal("0")
    missing_volume = 0
    for quantity, volume in items:
        total_posts += validate_quantity(quantity)
        if volume is None:
            if quantity:
                missing_volume += 1
            continue
        amount = Decimal(str(volume))
        if not amount.is_finite() or amount < 0:
            raise ValueError("Volume por peça inválido")
        total_volume += quantity * amount
    return {
        "postes": total_posts,
        "volume_m3": None if missing_volume else total_volume.quantize(Decimal("0.0001")),
        "produtos_sem_volume": missing_volume,
    }


def posts_per_person(posts: int, people: Decimal) -> Decimal | None:
    validate_quantity(posts)
    people = validate_people(people)
    if not people:
        return None
    return (Decimal(posts) / people).quantize(Decimal("0.01"))


def assert_can_confirm(posts: int, people: Decimal) -> None:
    validate_quantity(posts)
    people = validate_people(people)
    if posts and not people:
        raise ValueError("Há produção sem mão de obra confirmada")


def monthly_target(workdays: int, pieces_per_day: int) -> int:
    return validate_quantity(workdays) * validate_quantity(pieces_per_day)
