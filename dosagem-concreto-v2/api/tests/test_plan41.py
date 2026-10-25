import copy

import pytest

from app.acoes.documentos import _validate_experimental_plan
from app.erros import ErroAPI


def _document():
    return {
        "objetivo": {"fckMPa": 30, "abatimentoMm": 100, "toleranciaMm": 20},
        "planoExperimental": {
            "misturasPrevistas": 3, "condicoes": [{"id": f"m{i}", "dia": f"2026-10-{i+18}"} for i in range(3)],
            "volumeBetonadaL": 25, "ensaiosFresco": ["abatimentoMm", "abatimento30MinMm", "arPct", "massaEspecificaKgM3"],
            "idadesDias": [28], "cpsPorIdade": 2, "resistenciaMinMPa": 30, "resistenciaMediaMinMPa": 34,
            "abatimento30MinMinMm": 75, "arMinPct": 1, "arMaxPct": 3, "massaEspecificaMinKgM3": 2300,
        },
        "experimentais": [
            {"condicaoId": f"m{i}", "abatimentoMm": 100, "abatimento30MinMm": 85,
             "arPct": 1.5, "massaEspecificaKgM3": 2380,
             "rupturas": [{"idadeDias": 28, "resultadosMPa": [35, 36]}]} for i in range(3)
        ],
    }


def test_plan_complete_and_gate_failures():
    document = _document()
    _validate_experimental_plan(document, False)
    _validate_experimental_plan(document, True)
    broken = copy.deepcopy(document)
    broken["planoExperimental"]["condicoes"][1]["dia"] = broken["planoExperimental"]["condicoes"][0]["dia"]
    with pytest.raises(ErroAPI):
        _validate_experimental_plan(broken, False)
    for field, value in (("abatimento30MinMm", 50), ("arPct", 4), ("massaEspecificaKgM3", 2200)):
        broken = copy.deepcopy(document)
        broken["experimentais"][0][field] = value
        with pytest.raises(ErroAPI):
            _validate_experimental_plan(broken, True)
    broken = copy.deepcopy(document)
    broken["experimentais"][0]["rupturas"][0]["resultadosMPa"] = [29, 36]
    with pytest.raises(ErroAPI):
        _validate_experimental_plan(broken, True)
    broken = copy.deepcopy(document)
    broken["planoExperimental"]["resistenciaMediaMinMPa"] = 40
    with pytest.raises(ErroAPI):
        _validate_experimental_plan(broken, True)
