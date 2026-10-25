"""Switch only the destination GED backend to the built limit candidate."""
from pathlib import Path

path = Path("/opt/ged_concrefer/docker-compose.yml")
source = path.read_text()
old = "image: ged-concrefer-backend:a5-task-preflight"
new = "image: ged-concrefer-backend:a5-limits"
if source.count(old) != 1 or new in source:
    raise SystemExit("Unexpected Compose backend image; unchanged")
path.write_text(source.replace(old, new, 1))
print("GED destination backend set to a5-limits")
