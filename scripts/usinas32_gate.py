"""Run the required gate against homolog only and keep UTF-8 evidence."""
import os,subprocess,sys
from usinas32_common import O
p=subprocess.run([sys.executable,'tests/unificado/modelo_a_gate.py'],env={**os.environ,'UNIFICADO_BASE_URL':'https://concrefer.concretrack.com.br:18446','PCP_ANON_EXPECTED':'401','PYTHONIOENCODING':'utf-8'},capture_output=True);(O/'gate.txt').write_bytes(p.stdout+p.stderr);print(p.stdout.decode('utf-8'));assert p.returncode==0,p.stderr.decode('utf-8')
