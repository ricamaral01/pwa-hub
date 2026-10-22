import os
import sys
import unittest
from datetime import date
from decimal import Decimal
from pathlib import Path
from types import SimpleNamespace

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "unificado" / "pcp" / "backend"))
previous_debug = os.environ.get("DEBUG")
os.environ["DEBUG"] = "false"

from app.services.dashboard_service import _kg_homem_diario

if previous_debug is None:
    os.environ.pop("DEBUG", None)
else:
    os.environ["DEBUG"] = previous_debug


def mao(day, tipo, quantidade, grupo=None, setor=None):
    return SimpleNamespace(
        data=day, quantidade_pessoas=Decimal(quantidade), setor_id=setor,
        atividade=SimpleNamespace(tipo=tipo, grupo_setor=grupo, setor_id=setor),
    )


class KgHomemDiarioTest(unittest.TestCase):
    def test_grupos_e_rateio_moi_por_dia(self):
        day = date(2026, 10, 22)
        pesos = {
            ("2026-10-22", "12"): Decimal("12000"),
            ("2026-10-22", "3"): Decimal("8000"),
            ("2026-10-22", "4"): Decimal("6000"),
        }
        registros = [
            mao(day, "MOD", "4", "12"), mao(day, "MOI", "2", "12"),
            mao(day, "MOD", "3", "34", 3), mao(day, "MOD", "2", "34", 4),
            mao(day, "MOI", "3", "34"),
        ]
        result = {row.grupo_id: row for row in _kg_homem_diario(pesos, registros, day, day)}
        self.assertEqual(result["12"].kg_por_homem, 2000)
        self.assertEqual(result["3"].moi, Decimal("1.5"))
        self.assertEqual(result["3"].kg_por_homem, 1777.78)
        self.assertEqual(result["4"].kg_por_homem, 1714.29)

    def test_sem_pessoas_nao_divide_e_dias_nao_se_misturam(self):
        first = date(2026, 10, 21)
        second = date(2026, 10, 22)
        rows = _kg_homem_diario(
            {("2026-10-21", "3"): Decimal("1000"), ("2026-10-22", "3"): Decimal("2000")},
            [mao(second, "MOD", "2", "34", 3)], first, second,
        )
        by_day = {(row.data, row.grupo_id): row for row in rows}
        self.assertIsNone(by_day[("2026-10-21", "3")].kg_por_homem)
        self.assertEqual(by_day[("2026-10-22", "3")].kg_por_homem, 1000)


if __name__ == "__main__":
    unittest.main()
