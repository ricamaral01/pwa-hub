from __future__ import annotations

import sys
import unittest
from datetime import datetime
from decimal import Decimal
from pathlib import Path
from uuid import UUID

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from sync_receitas import SOURCE_COLUMNS, source_hash  # noqa: E402


class SourceHashTest(unittest.TestCase):
    def row(self):
        row = dict.fromkeys(SOURCE_COLUMNS)
        row.update(id=1, nome="C30", nome_traco="C30", ativa=True, alterado=1,
                   revisao_grupo=UUID("8bc60283-c753-4f3b-b388-f44fcd3f8412"),
                   revisao_numero=1, created_at=datetime(2026, 10, 22, 12, 0))
        return row

    def test_numeric_scale_does_not_create_false_conflict(self):
        row = self.row()
        row["cimento1"] = Decimal("350.00")
        first = source_hash(row)
        row["cimento1"] = Decimal("350.0")
        self.assertEqual(source_hash(row), first)

    def test_revision_or_audit_change_changes_hash(self):
        row = self.row()
        first = source_hash(row)
        row["alterado_por"] = "homologacao"
        self.assertNotEqual(source_hash(row), first)
        row["alterado_por"] = None
        row["revisao_numero"] = 2
        self.assertNotEqual(source_hash(row), first)

    def test_schema_change_fails_closed(self):
        row = self.row()
        row["unexpected"] = "new column"
        with self.assertRaisesRegex(ValueError, "Colunas da origem"):
            source_hash(row)


if __name__ == "__main__":
    unittest.main()
