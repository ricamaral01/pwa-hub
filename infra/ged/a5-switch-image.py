"""Run only on destination after backing up Compose and building the A5 image."""
from pathlib import Path

compose = Path("/opt/ged_concrefer/docker-compose.yml")
before = compose.read_text()
old = "image: ged-concrefer-backend:a3"
new = "image: ged-concrefer-backend:a5-task-preflight"
if before.count(old) != 1 or new in before:
    raise SystemExit("Unexpected Compose backend image; no change applied")
compose.write_text(before.replace(old, new, 1))
print("Backend image switched in Compose")
