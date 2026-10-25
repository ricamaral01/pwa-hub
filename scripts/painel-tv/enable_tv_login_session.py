"""Extend the existing TV-only 30-day session to the requested tv login."""
from pathlib import Path
import sys

path = Path(sys.argv[1])
source = path.read_text()
old = "TV_USER_ID = 'tv-producao'"
if source.count(old) != 1 or source.count("== TV_USER_ID") != 1 or source.count("!= TV_USER_ID") != 1:
    raise SystemExit('TV session anchors changed; no patch applied')
source = source.replace(old, "TV_USER_IDS = frozenset({'tv-producao', 'tv'})")
source = source.replace("== TV_USER_ID", "in TV_USER_IDS")
source = source.replace("!= TV_USER_ID", "not in TV_USER_IDS")
path.write_text(source)
