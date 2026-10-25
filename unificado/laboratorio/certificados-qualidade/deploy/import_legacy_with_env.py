"""One-time idempotent legacy import using the protected service environment."""
import json
import os
import sys
from pathlib import Path

for line in Path('/etc/concrefer-unificado/laboratorio.env').read_text().splitlines():
    if line.startswith('DATABASE_URL='):
        os.environ['DATABASE_URL'] = line.split('=', 1)[1].strip().strip('"').strip("'")
        break
else:
    raise RuntimeError('DATABASE_URL missing')

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from import_legacy import import_rows

print('historical certificates imported:', import_rows(json.loads(Path(sys.argv[1]).read_text(encoding='utf8'))))
