"""Switch destination Compose to the controlled A5 backend/frontend images."""
from pathlib import Path

compose = Path("/opt/ged_concrefer/docker-compose.yml")
before = compose.read_text()
replacements = {
    "image: ged-concrefer-backend:a5-task-preflight": "image: ged-concrefer-backend:a5-limits",
    "image: ged-concrefer-frontend:a3": "image: ged-concrefer-frontend:a5-login-post",
}
for old, new in replacements.items():
    if before.count(old) != 1 or new in before:
        raise SystemExit(f"Unexpected Compose tag: {old}; no change applied")
after = before
for old, new in replacements.items():
    after = after.replace(old, new, 1)
compose.write_text(after)
print("Compose switched to A5 limit and login images")
