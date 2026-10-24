from importlib.util import module_from_spec, spec_from_file_location
from io import BytesIO
from pathlib import Path

from openpyxl import Workbook
import pytest


ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "unificado/pcp/backend/app/services/pederneiras_catalog.py"
spec = spec_from_file_location("pederneiras_catalog", SOURCE)
catalog = module_from_spec(spec)
spec.loader.exec_module(catalog)


def test_real_seed_and_duplicate_guard():
    source = ROOT / "docs/porting/producao-pederneiras/seed/seed_produtos_pederneiras.csv"
    rows = catalog.parse_catalog(source.name, source.read_bytes())
    assert len(rows) == 112
    assert sum(bool(row["pendencia"]) for row in rows) == 23
    assert all(row["volume_m3"] is None for row in rows)
    with pytest.raises(ValueError, match="repetido"):
        catalog.parse_catalog("duplicado.csv", b"familia;descricao;cod_pro\nF;A;123\nF;B;123\n")


def test_xlsx_preview_distinguishes_create_change_and_same():
    book = Workbook()
    sheet = book.active
    sheet.append(["Família", "Descrição", "Cód. Pro", "m³/peça", "Ativo"])
    sheet.append(["Padrão", "A", "11", "0,125", "sim"])
    sheet.append(["Padrão", "B", "12", None, "não"])
    buffer = BytesIO()
    book.save(buffer)
    rows = catalog.parse_catalog("tabela.xlsx", buffer.getvalue())
    assert str(rows[0]["volume_m3"]) == "0.125"
    existing = [{**rows[0], "id": 1, "volume_m3": None}]
    result = catalog.preview(rows, existing)
    assert [item["acao"] for item in result] == ["atualizar", "criar"]
    assert "volume_m3" in result[0]["alteracoes"]
    existing[0]["volume_m3"] = rows[0]["volume_m3"]
    assert catalog.preview(rows[:1], existing)[0]["acao"] == "igual"
