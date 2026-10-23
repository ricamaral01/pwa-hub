from __future__ import annotations

import sys
import unittest
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from sync_receitas import sync_once  # noqa: E402


class WrongDatabase:
    def __enter__(self):
        return self

    def __exit__(self, *_):
        return None

    def execute(self, *_):
        return self

    def fetchone(self):
        return {"name": "banco_errado"}


class TargetGuardTest(unittest.TestCase):
    @patch("sync_receitas.psycopg.connect", return_value=WrongDatabase())
    def test_refuses_target_other_than_explicit_name(self, connect):
        with self.assertRaisesRegex(RuntimeError, "Destino recusado"):
            sync_once("source", "target", expected_target_db="mapa_unificado_teste")
        self.assertEqual(connect.call_count, 1)


if __name__ == "__main__":
    unittest.main()
