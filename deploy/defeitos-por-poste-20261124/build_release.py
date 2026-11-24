"""Build a narrow release from a downloaded production baseline."""
import hashlib
import json
from pathlib import Path
import re
import shutil
import sys

ROOT = Path(__file__).resolve().parents[2]
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT / 'scripts'))
from patch_mapa_dashboard_defects_kpis_unificado import apply_to_published

RELEASE = 'defeitos-por-poste-20261124'
FILES = {
    'mapa-api/dashboard_defects_indicators.py': 'api.py',
    'public/unificado/mapa/operacao/dashboard-defeitos-v5.js': 'dashboard-defeitos-v5.js',
    'public/unificado/mapa/operacao/index.html': 'index.html',
    'public/unificado/mapa/operacao/sw.js': 'sw.js',
}


def main():
    release = HERE / 'release'
    manifest = {'release': RELEASE, 'files': []}
    for target, baseline in FILES.items():
        old = HERE / 'baseline' / baseline
        output = release / target
        output.parent.mkdir(parents=True, exist_ok=True)
        if baseline == 'api.py':
            shutil.copy2(ROOT / 'unificado/mapa/api/dashboard_defects_indicators.py', output)
        elif baseline == 'dashboard-defeitos-v5.js':
            shutil.copy2(ROOT / 'unificado/mapa/operacao/dashboard-defeitos-v5.js', output)
        elif baseline == 'index.html':
            text = apply_to_published(old.read_text(encoding='utf-8'))
            text, changed = re.subn(r'src="dashboard-defeitos-v5\.js\?v=[^"]+"',
                f'src="dashboard-defeitos-v5.js?v={RELEASE}"', text)
            assert changed == 1
            output.write_text(text, encoding='utf-8', newline='\n')
        else:
            text = old.read_text(encoding='utf-8')
            text, changed = re.subn(r'const CACHE_NAME = "([^"]+)";',
                lambda match: f'const CACHE_NAME = "{match[1]}-{RELEASE}";', text, count=1)
            assert changed == 1
            output.write_text(text, encoding='utf-8', newline='\n')
        manifest['files'].append({'target': target,
            'before_sha256': hashlib.sha256(old.read_bytes()).hexdigest(),
            'after_sha256': hashlib.sha256(output.read_bytes()).hexdigest()})
    (HERE / 'manifest.json').write_text(json.dumps(manifest, indent=2), encoding='utf-8')
    print(json.dumps(manifest, indent=2))


if __name__ == '__main__':
    main()
