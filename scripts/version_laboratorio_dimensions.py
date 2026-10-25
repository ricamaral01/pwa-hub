"""Emit an idempotent criterion migration using only already registered values.

Usage: python scripts/version_laboratorio_dimensions.py > dimensions.sql
Run dimensions.sql on the unified Laboratory PostgreSQL database only.
"""
from __future__ import annotations

import json
from pathlib import Path
import sys

sys.stdout.reconfigure(encoding="utf-8")


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "unificado" / "laboratorio" / "service" / "server"))
from postes_rules import DEFAULT_CRITERIA  # noqa: E402


def literal(value):
    return "'" + json.dumps(value, ensure_ascii=False).replace("'", "''") + "'::jsonb"


dim = DEFAULT_CRITERIA["dimensional"]
grounding = literal(dim["grounding"])
source = literal(dim["fonte"])
tolerance = literal(dim["tolerancia_engastamento_mm"])
furation_tolerance = literal(dim["tolerancia_furacao_mm"])
print("-- New Laboratory criterion version; never update completed test snapshots.")
print("BEGIN;")
print("INSERT INTO ensaio_postes.criterio (versao, vigente_desde, valores, criado_por, motivo)")
print("SELECT versao + 1, now(),")
print("  jsonb_set(jsonb_set(jsonb_set(jsonb_set(valores::jsonb,")
print(f"    '{{dimensional,grounding}}', {grounding}, true),")
print(f"    '{{dimensional,fonte}}', {source}, true),")
print(f"    '{{dimensional,tolerancia_engastamento_mm}}', {tolerance}, true),")
print(f"    '{{dimensional,tolerancia_furacao_mm}}', {furation_tolerance}, true),")
print("  'migracao-dimensoes-2020',")
print("  'Versionar cotas F, J e e existentes e registrar fonte ABNT NBR 8451-2:2020.'")
print("FROM (SELECT versao, valores FROM ensaio_postes.criterio ORDER BY versao DESC LIMIT 1) current_criterion")
print("WHERE NOT (valores::jsonb->'dimensional' ? 'grounding')")
print(";")
print("COMMIT;")
