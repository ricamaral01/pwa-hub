"""Promote Marcelo in the currently published Mapa API without other edits.

The repository copy of app.py contains independent changes. Build an overlay
from the exact deployed file for the release and run it on the local source too.
"""

from __future__ import annotations

import argparse
from pathlib import Path


def promote(source: str) -> str:
    old_import = "MASTER_USER_ID, DEFAULT_LAB_USERS, GUEST_FORBIDDEN_SCREENS,"
    new_import = "MASTER_USER_ID, MASTER_USER_IDS, DEFAULT_LAB_USERS, GUEST_FORBIDDEN_SCREENS,"
    if source.count(old_import) != 1:
        raise ValueError("Unexpected screen-access import")
    result = source.replace(old_import, new_import)
    subjects = (
        "user_id", "user['id']", 'user["id"]', "actor['id']", 'actor["id"]',
        "row['id']", "item['mapa_login']",
    )
    changed = 0
    for subject in subjects:
        for operator, replacement in (("==", "in"), ("!=", "not in")):
            old = f"{subject} {operator} MASTER_USER_ID"
            changed += result.count(old)
            result = result.replace(old, f"{subject} {replacement} MASTER_USER_IDS")
    special = "user_id in {actor['id'], MASTER_USER_ID}"
    if result.count(special) != 1:
        raise ValueError("Unexpected password-reset master guard")
    result = result.replace(special, "(user_id == actor['id'] or user_id in MASTER_USER_IDS)")
    # A second master may not edit the other's protected Mapa account.
    result = result.replace(
        "user_id in MASTER_USER_IDS and user['id'] not in MASTER_USER_IDS",
        "user_id in MASTER_USER_IDS and user['id'] != user_id",
    )
    if changed < 20 or result.count("MASTER_USER_ID") != result.count("MASTER_USER_IDS") + 1:
        raise ValueError("Unconverted master check found")
    return result


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base", type=Path, required=True)
    parser.add_argument("--out", type=Path, required=True)
    args = parser.parse_args()
    args.out.write_text(promote(args.base.read_text(encoding="utf-8")), encoding="utf-8")


if __name__ == "__main__":
    main()
