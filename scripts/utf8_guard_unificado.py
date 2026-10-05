"""Repair and reject mojibake in first party files published by the unified build."""

from __future__ import annotations

import argparse
from pathlib import Path
import re


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_ROOT = ROOT / "unificado"
TEXT_SUFFIXES = {".css", ".csv", ".html", ".js", ".json", ".md", ".py", ".txt", ".webmanifest"}
MOJIBAKE = re.compile(
    r"(?:\u00c3[\u0080-\u00bf\u0192\u201a]"
    r"|\u00c2[\u0080-\u00bf]"
    r"|\u00e2[\u0080-\u00bf\u201a\u201e\u2020\u2021\u2022\u2026\u20ac\u2013\u2014]"
    r"|\u00f0[\u0080-\u00bf\u0178])"
)
THIRD_PARTY_TEXT_TABLES = {Path("vendor/xlsx/xlsx.full.min.js")}


def mojibake_map() -> dict[str, str]:
    characters = "".join(chr(code) for code in range(0x00A0, 0x0180))
    characters += "\u2014\u2013\u2026\u2022\u2192\u2190\u201c\u201d\u2018\u2019\u00b7\u00d7"
    characters += "\u2550\u2551\u2554\u2557\u255a\u255d\u2713\u26a0\ufe0f\U0001f4ca\U0001f4c8\U0001f464\U0001f6e0"
    replacements: dict[str, str] = {}
    for character in characters:
        try:
            broken = character.encode("utf-8").decode("cp1252")
        except UnicodeError:
            continue
        if broken != character:
            replacements[broken] = character
        try:
            twice = broken.encode("utf-8").decode("cp1252")
        except UnicodeError:
            continue
        if twice != broken:
            replacements[twice] = character
    return replacements


REPLACEMENTS = mojibake_map()
REPLACEMENT_KEYS = sorted(REPLACEMENTS, key=len, reverse=True)


def repair(text: str) -> str:
    previous = None
    while text != previous:
        previous = text
        for broken in REPLACEMENT_KEYS:
            text = text.replace(broken, REPLACEMENTS[broken])
    return text


def candidates(root: Path):
    for path in root.rglob("*"):
        if path.is_file() and path.suffix.lower() in TEXT_SUFFIXES:
            yield path


def scan(root: Path, fix: bool) -> tuple[int, list[str]]:
    occurrences = 0
    changed: list[str] = []
    for path in candidates(root):
        relative = path.relative_to(root)
        try:
            source = path.read_text(encoding="utf-8")
        except UnicodeDecodeError as error:
            raise SystemExit(f"Arquivo fora de UTF-8: {path}: {error}") from error
        if relative in THIRD_PARTY_TEXT_TABLES or path.name == "xlsx.full.min.js":
            continue
        found = len(MOJIBAKE.findall(source))
        occurrences += found
        if fix and found:
            updated = repair(source)
            path.write_text(updated, encoding="utf-8", newline="\n")
            changed.append(str(relative))
    return occurrences, changed


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", type=Path, default=DEFAULT_ROOT)
    parser.add_argument("--fix", action="store_true")
    args = parser.parse_args()
    root = args.root.resolve()
    before, changed = scan(root, args.fix)
    after, _ = scan(root, False)
    html_without_charset = []
    for path in root.rglob("*.html"):
        source = path.read_text(encoding="utf-8")
        if not re.search(r'<meta\s+charset=["\']?utf-8', source, re.I):
            html_without_charset.append(str(path.relative_to(root)))
    print(f"utf8_guard before={before} after={after} changed={len(changed)}")
    if changed:
        print("changed=" + ",".join(changed))
    if after or html_without_charset:
        raise SystemExit(
            f"UTF-8 gate failed: mojibake={after}; missing_meta={html_without_charset}"
        )


if __name__ == "__main__":
    main()
