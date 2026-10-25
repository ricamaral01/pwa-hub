"""Switch destination GED to the tested PDF isolation images."""
from pathlib import Path

path = Path('/opt/ged_concrefer/docker-compose.yml')
source = path.read_text()
replacements = {
    'image: ged-concrefer-backend:a5-limits': 'image: ged-concrefer-backend:a5-pdf-isolated',
    'image: ged-concrefer-frontend:a5-login-post': 'image: ged-concrefer-frontend:a5-pdf-warning',
}
for old, new in replacements.items():
    if source.count(old) != 1 or new in source:
        raise SystemExit(f'Unexpected Compose image: {old}')
for old, new in replacements.items():
    source = source.replace(old, new, 1)
path.write_text(source)
print('GED destination Compose set to PDF isolation images')
