"""Independent dimensional examples from the supplied A.1 and A.2 workbooks."""
from __future__ import annotations

import importlib.util
from pathlib import Path
from types import SimpleNamespace
import unittest


RULES = Path(__file__).resolve().parents[1] / "service/server/postes_rules.py"
spec = importlib.util.spec_from_file_location("postes_rules_test", RULES)
rules = importlib.util.module_from_spec(spec)
assert spec and spec.loader
spec.loader.exec_module(rules)


class DimensionalReferenceTests(unittest.TestCase):
    def setUp(self):
        self.criteria = {"dimensional": {
            "usar_nominais_modelo": True,
            "tolerancia_comprimento_mm": "50",
            "tolerancia_secao_mm": "5",
            "tolerancia_engastamento_mm": "15",
            "tolerancia_furacao_mm": None,
            "fonte": "Tabela dimensional A.1/A.2",
        }}

    def test_circular_a1_variants_and_length(self):
        # A.1 item 1: C-14, 9 m / 150 daN, A=140, B(20)=320, B(15)=275 mm.
        for base in (320, 275):
            pole = {"tipo": "C", "face": "C", "conicidade": "A", "altura_m": 9,
                    "resistencia_daN": 150,
                    "dimensoes_nominais": {"comprimento": 9000, "diametro_topo": 140,
                                            "diametro_base": base, "engastamento": 1500}}
            limits = rules.limites_dimensionais(pole, self.criteria)
            self.assertEqual((limits["comprimento"]["min_mm"], limits["comprimento"]["max_mm"]),
                             (8950, 9050))
            self.assertEqual((limits["diametro_topo"]["min_mm"], limits["diametro_topo"]["max_mm"]),
                             (135, 145))
            self.assertEqual((limits["diametro_base"]["min_mm"], limits["diametro_base"]["max_mm"]),
                             (base - 5, base + 5))
            self.assertFalse(limits["furacao_f"]["aplicavel"])

    def test_dt_a2_both_cross_section_faces(self):
        # A.2 item 3: DT 9 m, B type, face B 300 daN; a/A=140/392, b/B=110/290.
        pole = {"tipo": "DT", "face": "B", "conicidade": "A", "altura_m": 9,
                "resistencia_daN": 300,
                "dimensoes_nominais": {"comprimento": 9000, "largura_topo": 140,
                                        "largura_base": 392, "espessura_topo": 110,
                                        "espessura_base": 290}}
        limits = rules.limites_dimensionais(pole, self.criteria)
        self.assertEqual(limits["largura_base"]["nominal_mm"], 392)
        self.assertEqual(limits["espessura_topo"]["nominal_mm"], 110)
        self.assertEqual(limits["comprimento"]["nominal_mm"], 9000)
        self.assertFalse(limits["diametro_base"]["aplicavel"])

    def test_reference_is_overridden_only_by_explicit_model_value(self):
        model = SimpleNamespace(dimensoes_nominais={"diametro_base": 321})
        nominal = rules.catalog_nominals(model, {"comprimento": 9000,
                                                  "diametro_topo": 140,
                                                  "diametro_base": 320})
        self.assertEqual(nominal, {"comprimento": 9000, "diametro_topo": 140,
                                   "diametro_base": 321})

    def test_old_measurement_without_length_remains_na(self):
        result = rules.avaliar_inspecao({"checklist": {}, "medidas": {}})
        self.assertEqual(result["medidas"]["comprimento"]["status"], "N/A")

    def test_unknown_model_does_not_gain_measured_limits(self):
        pole = {"tipo": "PL", "face": "B", "conicidade": "A", "altura_m": 9,
                "resistencia_daN": 300, "dimensoes_nominais": {}}
        limits = rules.limites_dimensionais(pole, self.criteria)
        self.assertFalse(limits["comprimento"]["aplicavel"])
        self.assertFalse(limits["largura_base"]["aplicavel"])

    def test_manual_interval_for_missing_reference_is_evaluated_and_identified(self):
        pole = {"tipo": "C", "face": "C", "conicidade": "A", "altura_m": 10,
                "resistencia_daN": 250, "dimensoes_nominais": {}}
        inspection = rules.normalizar_inspecao({"checklist": {}, "medidas": {
            "diametro_base": {"min_mm": "300", "max_mm": "320", "leitura_mm": "311"}}},
            pole, self.criteria)
        measure = inspection["medidas"]["diametro_base"]
        self.assertEqual(measure["origem"], "manual")
        self.assertEqual((measure["min_mm"], measure["max_mm"]), ("300", "320"))
        self.assertIn("manualmente", inspection["fonte_limites"])
        self.assertEqual(rules.avaliar_inspecao(inspection)["medidas"]["diametro_base"]["status"], "DENTRO")
        inspection["medidas"]["diametro_base"]["leitura_mm"] = "321"
        self.assertEqual(rules.avaliar_inspecao(inspection)["medidas"]["diametro_base"]["status"], "FORA")
        inspection["medidas"]["diametro_base"]["max_mm"] = None
        self.assertEqual(rules.avaliar_inspecao(inspection)["medidas"]["diametro_base"]["status"], "PENDENTE")

    def test_sourced_interval_cannot_be_overridden_manually(self):
        pole = {"tipo": "C", "face": "C", "conicidade": "A", "altura_m": 9,
                "resistencia_daN": 150, "dimensoes_nominais": {"diametro_base": 320}}
        inspection = rules.normalizar_inspecao({"medidas": {
            "diametro_base": {"min_mm": "100", "max_mm": "400", "leitura_mm": "321"}}},
            pole, self.criteria)
        measure = inspection["medidas"]["diametro_base"]
        self.assertEqual((measure["min_mm"], measure["max_mm"]), (315, 325))
        self.assertEqual(measure["origem"], "tabela")

    def test_manual_interval_is_limited_to_expected_dimensions(self):
        pole = {"tipo": "C", "face": "C", "conicidade": "A", "altura_m": 10,
                "resistencia_daN": 250, "dimensoes_nominais": {}}
        inspection = rules.normalizar_inspecao({"medidas": {
            "largura_base": {"min_mm": "100", "max_mm": "120", "leitura_mm": "110"},
            "furacao_f": {"min_mm": "100", "max_mm": "120", "leitura_mm": "110"}}},
            pole, self.criteria)
        self.assertFalse(inspection["medidas"]["largura_base"]["aplicavel"])
        self.assertFalse(inspection["medidas"]["furacao_f"]["aplicavel"])

    def test_nonstandard_check_enables_manual_top_and_base_even_with_table_values(self):
        pole = {"tipo": "C", "face": "C", "conicidade": "A", "altura_m": 9,
                "resistencia_daN": 150, "nao_normatizado_8451": True,
                "dimensoes_nominais": {"comprimento": 9000, "diametro_topo": 140,
                                        "diametro_base": 320}}
        limits = rules.limites_dimensionais(pole, self.criteria)
        self.assertTrue(limits["comprimento"]["aplicavel"])
        self.assertFalse(limits["diametro_topo"]["aplicavel"])
        self.assertFalse(limits["diametro_base"]["aplicavel"])
        inspection = rules.normalizar_inspecao({"medidas": {
            "diametro_topo": {"min_mm": "130", "max_mm": "150", "leitura_mm": "141"},
            "diametro_base": {"min_mm": "300", "max_mm": "340", "leitura_mm": "321"}}},
            pole, self.criteria)
        self.assertEqual(inspection["medidas"]["diametro_topo"]["origem"], "manual")
        self.assertEqual(inspection["medidas"]["diametro_base"]["origem"], "manual")
        self.assertEqual(rules.avaliar_inspecao(inspection)["medidas"]["diametro_base"]["status"], "DENTRO")


if __name__ == "__main__":
    unittest.main()
