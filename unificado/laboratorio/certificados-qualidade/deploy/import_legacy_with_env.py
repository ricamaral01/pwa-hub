"""One-time idempotent legacy import using the protected service environment."""
import json
import os
import sys
from pathlib import Path

env_file = Path(sys.argv[2]) if len(sys.argv) > 2 else Path('/etc/concrefer-unificado/laboratorio.env')
for line in env_file.read_text().splitlines():
    if line.startswith('DATABASE_URL='):
        os.environ['DATABASE_URL'] = line.split('=', 1)[1].strip().strip('"').strip("'")
        break
else:
    raise RuntimeError('DATABASE_URL missing')

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from import_legacy import import_rows

print('historical certificates imported:', import_rows(json.loads(Path(sys.argv[1]).read_text(encoding='utf8'))))
