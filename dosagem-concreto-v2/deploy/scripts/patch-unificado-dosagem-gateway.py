"""Apply the small Dosagem gateway patch to the live Mapa API without replacing other edits."""

from datetime import datetime, timezone
from pathlib import Path


ROOT = Path("/opt/concrefer-unificado/mapa-api")
STAMP = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")


def patch(path: Path, substitutions: list[tuple[str, str]]) -> None:
    original = path.read_text()
    updated = original
    for before, after in substitutions:
        if updated.count(before) != 1:
            raise RuntimeError(f"Expected one exact match in {path.name}: {before[:50]}")
        updated = updated.replace(before, after, 1)
    backup = path.with_name(path.name + f".before-dosagem-native-{STAMP}")
    backup.write_text(original)
    path.write_text(updated)
    print(f"Patched {path.name}; backup: {backup.name}")


def main() -> None:
    patch(ROOT / "screen_access.py", [(
        "    query = parse_qs(uri.query)\n",
        "    query = parse_qs(uri.query)\n"
        "    if path.startswith('/unificado/laboratorio/dosagem/'):\n"
        "        return BY_ID.get('labDosagem')\n",
    )])
    patch(ROOT / "app.py", [(
        "        if '/api/ensaios' in path:\n",
        "        if path.startswith('/unificado/laboratorio/dosagem/api/'):\n"
        "            accepted = {'labDosagem'}\n"
        "        elif '/api/ensaios' in path:\n",
    ), (
        '            "id": user["id"], "name": user["nome"], "role": role,\n',
        '            "id": user["id"], "name": user["nome"], "role": role,\n'
        '            "dosagem": "labDosagem" in allowed and screen is not None and screen["id"] == "labDosagem",\n',
    )])


if __name__ == "__main__":
    main()
