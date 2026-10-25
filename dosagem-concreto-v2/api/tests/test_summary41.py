"""The server letter summary must use the mass fraction for mortar alpha."""
import json
from pathlib import Path

import pytest

from app.calc.traco41 import calculate_trace41


FIXTURES = Path(__file__).resolve().parents[2] / "shared" / "golden"


@pytest.mark.parametrize("method,mode,fixture,key,expected", [
    ("principal_abrams", "complete", "principal-4.1.json", "base", 0.4880),
    ("alternativo_concrefer", "spreadsheet", "alternative-4.1.json", "a1", 0.5234),
])
def test_alpha_in_server_summary_is_mortar_mass_fraction(method, mode, fixture, key, expected):
    data = json.loads((FIXTURES / fixture).read_text(encoding="utf-8"))[key]
    calculation = calculate_trace41({"metodo": method, "balanco": mode, "metodoDados": data})
    assert calculation["summary"]["alpha"] == pytest.approx(expected, abs=0.00005)
    assert calculation["summary"]["alpha"] == calculation["result"]["mortarMassFraction"]
    if method == "alternativo_concrefer":
        assert calculation["summary"]["finesKg"] == pytest.approx(385.23, abs=0.01)
