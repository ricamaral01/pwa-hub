"""Scoped paths and SSH helpers for the homologation-only 1.4.32 release."""
import json,subprocess
from pathlib import Path
R=Path(__file__).resolve().parents[1];O=R/'docs/revisao-visual-unificado/homolog/usinas-sobreposicao-20261120';T=R/'.codex-tmp/usinas-sobreposicao-1.4.32';S='/opt/concrefer-unificado/homolog-next/staging/usinas-sobreposicao-1.4.32'
def remote(code,binary=False):
 p=subprocess.run(['ssh','vps-concrefer','python3','-'],input=code.encode(),capture_output=True);assert p.returncode==0,p.stderr.decode();return p.stdout if binary else json.loads(p.stdout)
def save(name,data):
 O.mkdir(parents=True,exist_ok=True);(O/name).write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
def mapped(key):
 assert key.startswith(('public/','services/')) and '..' not in Path(key).parts
 return '/opt/concrefer-unificado/homolog-next/'+('public/unificado/'+key[7:] if key.startswith('public/') else 'visual-full/'+key[9:])
