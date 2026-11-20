"""Shared release paths and read-only SSH helpers. No work runs on import."""
import json,subprocess
from pathlib import Path
R=Path(__file__).resolve().parents[1];P=R/'docs/revisao-visual-unificado/producao-20261120';O=P/'retomada-2';B=R/'.codex-tmp/producao-1.4.31';D=B/'candidate';S='/opt/concrefer-unificado/homolog-next/staging/producao-1.4.31'
def remote(code,python='python3',binary=False):
 p=subprocess.run(['ssh','vps-concrefer',python,'-'],input=code.encode(),capture_output=True);assert p.returncode==0,p.stderr.decode();return p.stdout if binary else json.loads(p.stdout)
def save(name,data):(O/name).write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
def target(key):
 if key.startswith('public/'):return '/opt/concrefer-unificado/public/unificado/'+key[7:]
 for prefix,dest in [('services/laboratorio/','/opt/concrefer-unificado/laboratorio/service/'),('services/dosagem-static/','/opt/concrefer-unificado/dosagem-native/static/'),('services/carta-static/','/opt/concrefer-unificado/homolog/laboratorio/service/server/static/carta-traco/')]:
  if key.startswith(prefix):return dest+key[len(prefix):]
 raise ValueError(key)
