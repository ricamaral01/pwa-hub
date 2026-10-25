"""Release 1 core IDs, using the shared golden tests without moving their fixtures."""
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import test_adjustment41_golden as adjustment
import test_alternative41_golden as alternative
import test_curves41_golden as curves
import test_moisture41_golden as moisture
import test_principal41_golden as principal
import test_rules41_golden as rules


CORE_CASES = ["P1", "P1b", "P2", "P3", "P3b", "P5", "P6", "P7", "A1", "A2", "A3", "I1", "O1", "N1", "R1", "C40-conferencia"]


@pytest.mark.parametrize("case_id", CORE_CASES, ids=CORE_CASES)
def test_release1_core_case(case_id):
    checks = {
        "P1": principal.test_principal41_golden,
        "P1b": principal.test_principal41_golden,
        "P2": curves.test_p2,
        "P3": adjustment.test_p3_p3b,
        "P3b": adjustment.test_p3_p3b,
        "P5": principal.test_principal41_golden,
        "P6": moisture.test_moisture41_golden,
        "P7": principal.test_principal41_golden,
        "A1": alternative.test_a1,
        "A2": alternative.test_a2,
        "A3": alternative.test_a3,
        "I1": curves.test_i1,
        "O1": curves.test_o1,
        "N1": rules.test_n1,
        "R1": rules.test_r1,
    }
    if case_id == "C40-conferencia":
        masses_and_densities = [(340, 3.10), (20, 2.55), (520, 2.63), (300, 2.70),
                                (250, 2.75), (782, 2.75), (180, 1),
                                (340 * .008, 1.07), (340 * .003, 1.15)]
        volume = sum(mass / density for mass, density in masses_and_densities) + 15
        assert volume == pytest.approx(1000.05, abs=.01)
    else:
        checks[case_id]()


def test_volume_property_200():
    principal.test_200_valid_mix_volumes()
