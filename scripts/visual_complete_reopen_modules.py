"""Reopen module indexes after their asynchronous selection, including unit variants."""
import json,subprocess,sys
from pathlib import Path
R=Path(__file__).resolve().parents[1]
O=R/'docs/revisao-visual-unificado/homolog/revisao-completa'
ids=sorted({row['id'] for row in json.loads((O/'inventario.json').read_text(encoding='utf-8')) if row['id'].startswith('module-')})
for role in sys.argv[1:]:
    result=subprocess.run([sys.executable,'tests/unificado/review_complete_matrix.py','--role',role,'--concurrency','1','--only',*ids],cwd=R)
    assert result.returncode==0,role
