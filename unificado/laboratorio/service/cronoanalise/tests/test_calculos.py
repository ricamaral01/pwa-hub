from __future__ import annotations

import json
import sys
from pathlib import Path

from pytest import approx

SERVICE = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(SERVICE))
from cronoanalise.calc.estatistica import resumo  # noqa: E402
from cronoanalise.calc.dimensionamento import dimensionar, tempo_padrao  # noqa: E402

GOLDEN = json.loads((SERVICE.parents[2] / "docs/porting/cronoanalise/especificacao/tests/golden.json")
                    .read_text(encoding="utf-8"))["estatistica"]


def test_estatistica_golden():
    result = resumo(GOLDEN["amostra_P08"])
    expected = GOLDEN["esperado"]
    assert result["media_min"] == approx(expected["media"], abs=1e-6)
    assert result["desvio_min"] == approx(expected["desvio"], abs=1e-6)
    assert result["cv"] == approx(expected["cv"], abs=1e-6)
    assert result["n_necessario"] == expected["n_necessario_95_5"]
    assert result["faixa_2s"] == approx(expected["faixa_2s"], abs=1e-6)


def test_tempo_padrao_golden():
    result = tempo_padrao(GOLDEN["esperado"]["media"], 105, 13)
    for key in ("FT", "TN", "TP"):
        assert result[key] == approx(GOLDEN["tempo_padrao"][key], abs=1e-6)


def test_dimensionamento_golden():
    fixture = GOLDEN["dimensionamento"]
    activity = {"codigo": "EXEMPLO", "processo": "montagem", "tipo": "trabalho",
                "estimativa_min": fixture["HM"], "pessoas_padrao": 1, "por_cacamba": False}
    params = {"turno": 588, "intervalos": 60, "demanda": 292, "disponiveis": 26,
              "tolPes": 0, "tolFad": 0, "tolEsp": 0, "eta": 90, "over": {}}
    result = dimensionar([activity], {}, params, 129 / 292)
    for key in ("HM", "T_disp", "takt", "N_teorico", "N", "N_arred"):
        assert result[key] == approx(fixture[key], abs=1e-6)
    assert result["capacidade"] == approx(fixture["capacidade_26"], abs=0.1)
