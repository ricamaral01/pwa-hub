"""Switch the GED backend image without touching its database or frontend."""
from pathlib import Path
import sys

if len(sys.argv) != 2 or sys.argv[1] not in {'homolog', 'production'}:
    raise SystemExit('Use: switch_ged_three_masters.py homolog|production')
path = Path('/opt/concrefer-unificado/homolog-next/ged/docker-compose.yml'
            if sys.argv[1] == 'homolog' else '/opt/ged_concrefer/docker-compose.yml')
old = 'image: ged-concrefer-backend:marcelo-master-v1'
new = 'image: ged-concrefer-backend:three-masters-v1'
text = path.read_text(encoding='utf-8')
if text.count(old) != 1:
    raise RuntimeError('Unexpected GED Compose baseline')
path.write_text(text.replace(old, new), encoding='utf-8')
print({'environment': sys.argv[1], 'image': 'three-masters-v1'})
