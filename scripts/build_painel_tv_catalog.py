"""Export the physical form labels used by the Mapa UI for the TV panel."""

from __future__ import annotations

import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "mapa-concretagem/app.js"
OUTPUT = ROOT / "unificado/painel-tv/api/formas_fisicas.json"


def build() -> dict[str, list[dict[str, str]]]:
    source = SOURCE.read_text(encoding="utf-8")
    result: dict[str, list[dict[str, str]]] = {}
    names = {
        1: ("SETOR_1_LEFT_FORMS", "SETOR_1_RIGHT_FORMS"),
        2: ("SETOR_2_LEFT_FORMS", "SETOR_2_RIGHT_FORMS"),
        3: ("SETOR_3_LEFT_FORMS", "SETOR_3_RIGHT_FORMS"),
        4: ("SETOR_4_COL1_FORMS", "SETOR_4_COL2_FORMS", "SETOR_4_COL3_FORMS"),
    }
    for sector, arrays in names.items():
        rows: list[dict[str, str]] = []
        seen: set[str] = set()
        for name in arrays:
            match = re.search(rf"const {name} = \[(.*?)\];", source, re.S)
            if not match:
                raise RuntimeError(f"Mapa layout missing: {name}")
            for item in re.findall(r"\{[^{}]*\}", match.group(1)):
                form = re.search(r'\bforma:\s*"([^"]+)"', item)
                model = re.search(r'\bmodelo:\s*"([^"]+)"', item)
                if not form:
                    continue
                code = form.group(1).strip()
                key = re.sub(r"\s+", "", code).upper()
                if key in seen:
                    raise RuntimeError(f"Duplicate form in Setor {sector}: {code}")
                seen.add(key)
                rows.append({"codigo": code, "modelo": model.group(1) if model else ""})
        result[str(sector)] = rows
    return result


if __name__ == "__main__":
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    payload = build()
    OUTPUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print({sector: len(rows) for sector, rows in payload.items()})
