"""Local prompt and wrapper checks; never use the real A1 key or password."""
from __future__ import annotations

import importlib.util
import io
import sys
import tempfile
import unittest
from contextlib import redirect_stdout
from pathlib import Path
from unittest.mock import patch


SCRIPT = Path(__file__).resolve().parents[2] / "scripts" / "porting" / "a1_password_recovery.py"
spec = importlib.util.spec_from_file_location("a1_password_recovery_test", SCRIPT)
assert spec and spec.loader
a1 = importlib.util.module_from_spec(spec)
spec.loader.exec_module(a1)


class PasswordPromptTest(unittest.TestCase):
    def test_prepare_prompts_twice_without_copying_or_storing_password(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            private = Path(tmp)
            (private / "a1_run.py").write_text("def unprotect_key():\n    return b'K' * 32\n", encoding="utf8")
            password = "temporary-test-password-with-20-chars"
            output = io.StringIO()
            sys.modules.pop("a1_run", None)
            with patch.object(a1, "PRIVATE", private), patch.object(a1.getpass, "getpass", side_effect=[password, password]) as prompt, patch.object(a1, "ssh", side_effect=AssertionError("prepare must stay local")), patch.object(a1.subprocess, "run", side_effect=AssertionError("prepare must stay local")), redirect_stdout(output):
                a1.prepare()
            self.assertEqual(prompt.call_count, 2)
            wrapper = (private / "key.password-wrap.json").read_bytes()
            self.assertNotIn(password.encode(), wrapper)
            self.assertNotIn(password, output.getvalue())
            with patch.object(a1, "PRIVATE", private):
                self.assertEqual(a1.unwrap_key(password), b"K" * 32)
            sys.modules.pop("a1_run", None)

    def test_short_password_creates_nothing(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            private = Path(tmp)
            with patch.object(a1, "PRIVATE", private), patch.object(a1.getpass, "getpass", side_effect=["short", "short"]):
                with self.assertRaisesRegex(ValueError, "20 caracteres"):
                    a1.prepare()
            self.assertFalse((private / "key.password-wrap.json").exists())


if __name__ == "__main__":
    unittest.main()
