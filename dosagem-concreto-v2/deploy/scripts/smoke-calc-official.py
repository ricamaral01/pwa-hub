"""Read-only calculation smoke against the Python running on the VPS."""
import json
from pathlib import Path

from app.calc.traco41 import calculate_trace41

root = Path('/opt/concretrack-dosagem/current/api/golden')
scenarios = (
    ('P1b', 'principal_abrams', 'complete', 'principal-4.1.json', 'base', 1000.0, 321.0),
    ('A1', 'alternativo_concrefer', 'spreadsheet', 'alternative-4.1.json', 'a1', 999.969085, 351.0),
)
for name, method, balance, file, key, volume, cement in scenarios:
    inputs = json.loads((root / file).read_text(encoding='utf-8'))[key]
    result = calculate_trace41({'metodo': method, 'balanco': balance, 'metodoDados': inputs})['summary']
    assert abs(result['physicalVolumeL'] - volume) <= 0.05, (name, result['physicalVolumeL'])
    assert abs(result['cementKg'] - cement) <= 0.05, (name, result['cementKg'])
    print(f'{name}_OK method={method} volumeL={result["physicalVolumeL"]:.6f} cementKg={result["cementKg"]:.3f}')
