"""Print production database names and deployment paths, never credentials."""
from pathlib import Path
from urllib.parse import urlsplit

paths = [
    Path('/etc/mapa-unificado/auth.env'),
    Path('/etc/mapa-unificado/unified-auth.env'),
    Path('/etc/concrefer-unificado/pcp.env'),
    Path('/etc/concrefer-unificado/pcp-api.env'),
]
for path in paths:
    if not path.exists():
        continue
    for line in path.read_text().splitlines():
        if '=' not in line or line.lstrip().startswith('#'):
            continue
        key, value = line.split('=', 1)
        if 'DATABASE_URL' not in key and key not in {'DB_NAME', 'POSTGRES_DB'}:
            continue
        value = value.strip().strip('"').strip("'")
        db = urlsplit(value).path.lstrip('/') if '://' in value else value
        print(path.name, key, 'database=' + db)
