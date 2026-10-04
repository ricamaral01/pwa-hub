"""Repair the isolated PCP virtualenv after moving it under /opt/concrefer-unificado."""
from __future__ import annotations

import os
from pathlib import Path

ROOT = Path("/opt/concrefer-unificado/pcp-api")
VENV = ROOT / ".venv-py310"
RUNTIME = ROOT / "python-runtimes/cpython-3.10.22-linux-x86_64-gnu/bin/python3.10"
OLD_ROOT = "/opt/pcp-unificado-test/python-runtimes/cpython-3.10-linux-x86_64-gnu/bin"


def main() -> None:
    assert ROOT.is_dir() and VENV.is_dir() and RUNTIME.is_file()
    python = VENV / "bin/python"
    config = VENV / "pyvenv.cfg"
    assert python.is_symlink()
    assert os.readlink(python) == OLD_ROOT + "/python3.10"
    original = config.read_text(encoding="utf-8")
    assert "home = " + OLD_ROOT in original
    backup = config.with_suffix(".cfg.before-path-repair")
    assert not backup.exists()
    backup.write_text(original, encoding="utf-8")
    os.chown(backup, 0, 0)
    os.chmod(backup, 0o600)
    updated = original.replace("home = " + OLD_ROOT,
                               "home = " + str(RUNTIME.parent))
    temporary_cfg = config.with_suffix(".cfg.next")
    temporary_cfg.write_text(updated, encoding="utf-8")
    os.chown(temporary_cfg, 0, 0)
    os.chmod(temporary_cfg, 0o644)
    temporary_cfg.replace(config)
    temporary_link = python.with_name("python.next")
    temporary_link.symlink_to(RUNTIME)
    temporary_link.replace(python)
    print("pcp_test_venv_path=consolidated")


if __name__ == "__main__":
    main()
