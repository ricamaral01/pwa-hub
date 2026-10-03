"""Extrai os itens das inspeções da fonte atual para a cópia PostgreSQL."""

from __future__ import annotations

import json
from pathlib import Path
import re


ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "mapa-concretagem" / "app.js"
TARGET = ROOT / "unificado" / "mapa" / "checklists.json"
SECTION = re.compile(r'id:\s*"([^"]+)",\s*titulo:\s*"([^"]+)",\s*itens:\s*\[(.*?)\]\s*\}', re.S)
ITEM = re.compile(r'\{\s*id:\s*"([^"]+)",\s*texto:\s*"([^"]+)",\s*critico:\s*(true|false)', re.S)


def extract(source: str, start: str, end: str) -> list[dict]:
    block = source.split(start, 1)[1].split(end, 1)[0]
    sections = []
    for section_id, title, items_source in SECTION.findall(block):
        items = [
            {"id": item_id, "label": label, "critical": critical == "true"}
            for item_id, label, critical in ITEM.findall(items_source)
        ]
        if not items:
            raise RuntimeError(f"Seção sem itens: {section_id}")
        sections.append({"id": section_id, "title": title, "items": items})
    if not sections:
        raise RuntimeError(f"Nenhuma seção encontrada em {start}")
    return sections


def main() -> None:
    source = SOURCE.read_text(encoding="utf-8")
    result = {
        "INSPECAO": extract(source, "function getInspecaoChecklistSections", "function getMontagemChecklistSections"),
        "MONTAGEM": extract(source, "function getMontagemChecklistSections", "const CONCRETO_TIPOS"),
    }
    TARGET.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"{TARGET.relative_to(ROOT)}: " + ", ".join(f"{key}={sum(len(s['items']) for s in sections)}" for key, sections in result.items()))


if __name__ == "__main__":
    main()
