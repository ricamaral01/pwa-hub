import copy

import pytest

from app.acoes.documentos import _validate_experimental_plan
from app.erros import ErroAPI


def _caa_document():
    return {
        "tipoConcreto": "caa",
        "objetivo": {"fckMPa": 30, "classesCAA": {"SF": "SF2", "VS": "VS1", "IEV": 0}},
        "planoExperimental": {
            "misturasPrevistas": 3,
            "condicoes": [{"id": f"m{i}", "dia": f"2026-10-{18 + i}"} for i in range(3)],
            "volumeBetonadaL": 25,
            "ensaiosFresco": ["espalhamentoMm", "t500S", "iev", "manutencaoEspalhamento", "arPct", "massaEspecificaKgM3"],
            "temposManutencaoMin": [10, 20, 30], "perdaEspalhamentoMaxPct": 10,
            "idadesDias": [28], "cpsPorIdade": 2, "resistenciaMinMPa": 30,
        },
        "experimentais": [{
            "condicaoId": f"m{i}", "espalhamentoMm": 700, "t500S": 1.5, "iev": 0,
            "manutencaoEspalhamento": [{"minuto": minute, "espalhamentoMm": 680} for minute in (10, 20, 30)],
            "indicadorFinosKgM3": 420, "arPct": 1.5, "massaEspecificaKgM3": 2380,
            "rupturas": [{"idadeDias": 28, "resultadosMPa": [35, 36]}],
        } for i in range(3)],
    }


def test_caa_required_classes_spread_and_maintenance():
    """R1-CAA: approval requires specified CAA classes and measured maintenance for every mix."""
    document = _caa_document()
    _validate_experimental_plan(document, False)
    _validate_experimental_plan(document, True)
    for mutation in (
        lambda d: d["objetivo"]["classesCAA"].pop("SF"),
        lambda d: d["experimentais"][0].update(espalhamentoMm=650),
        lambda d: d["experimentais"][0].update(t500S=2.5),
        lambda d: d["experimentais"][0].update(iev=2),
        lambda d: d["experimentais"][0]["manutencaoEspalhamento"][2].update(espalhamentoMm=600),
        lambda d: d["experimentais"][0].pop("indicadorFinosKgM3"),
    ):
        broken = copy.deepcopy(document)
        mutation(broken)
        with pytest.raises(ErroAPI):
            _validate_experimental_plan(broken, True)
