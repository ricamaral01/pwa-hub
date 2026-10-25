"""Rollback only GED backend after a failed large-PDF health check."""
from pathlib import Path

path = Path("/opt/ged_concrefer/docker-compose.yml")
before = path.read_text()
old = "image: ged-concrefer-backend:a5-limits"
new = "image: ged-concrefer-backend:a5-task-preflight"
if before.count(old) != 1 or new in before:
    raise SystemExit("Unexpected backend tag; no rollback applied")
path.write_text(before.replace(old, new, 1))
print("GED backend tag rolled back to a5-task-preflight")
