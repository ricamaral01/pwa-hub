from __future__ import annotations

import sys
import unittest
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from write_preflight import check_new_recipe_key, validate_name  # noqa: E402


class PreflightTest(unittest.TestCase):
    def test_name_validation(self):
        self.assertEqual(validate_name("  C  30 \t  B   "), "C 30 B")
        for value in ("", " \t ", "x" * 161, None):
            with self.assertRaises(ValueError):
                validate_name(value)

    @patch("write_preflight.recipe_key_matches", return_value=[])
    def test_new_name_is_available(self, lookup):
        self.assertEqual(check_new_recipe_key("read-only-dsn", "C30"),
                         {"available": True, "existing_ids": []})
        lookup.assert_called_once_with("read-only-dsn", "C30", "supervisorio_db")

    @patch("write_preflight.recipe_key_matches", return_value=[
        {"id": 41}, {"id": 12}
    ])
    def test_existing_name_or_revision_blocks_new_group(self, lookup):
        self.assertEqual(check_new_recipe_key("read-only-dsn", "C30"),
                         {"available": False, "existing_ids": [41, 12]})


if __name__ == "__main__":
    unittest.main()
