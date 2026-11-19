"""Check changed JS and inline HTML scripts with Node's parser."""
import argparse, json, re, subprocess
from html.parser import HTMLParser
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
class Scripts(HTMLParser):
    def __init__(self):
        super().__init__();self.scripts=[];self.current=None
    def handle_starttag(self,tag,attrs):
        attrs=dict(attrs)
        if tag=='script' and not attrs.get('src') and attrs.get('type','') not in ('application/json','application/ld+json','importmap'):
            self.current=[]
    def handle_data(self,data):
        if self.current is not None:self.current.append(data)
    def handle_endtag(self,tag):
        if tag=='script' and self.current is not None:
            self.scripts.append(''.join(self.current));self.current=None
parser=argparse.ArgumentParser();parser.add_argument('--base',default='HEAD~1');args=parser.parse_args()
files=subprocess.check_output(['git','diff','--name-only',args.base],cwd=ROOT,text=True,stderr=subprocess.DEVNULL).splitlines()
failures=[];count=0
for rel in files:
    p=ROOT/rel
    if not p.exists():continue
    if p.suffix=='.js':blocks=[p.read_text(encoding='utf-8')]
    elif p.suffix=='.html':
        html=Scripts();html.feed(p.read_text(encoding='utf-8'));blocks=html.scripts
    else:continue
    for index,source in enumerate(blocks):
        if not source.strip():continue
        mode=['--input-type=module'] if re.search(r'^\s*(?:import|export)\s',source,re.M) else []
        result=subprocess.run(['node',*mode,'--check'],input=source,text=True,encoding='utf-8',capture_output=True)
        count+=1
        if result.returncode:failures.append({'file':rel,'script':index,'error':result.stderr[-1000:]})
data={'checked_blocks':count,'failures':failures}
(ROOT/'docs/revisao-visual-unificado/homolog/fase-7/syntax-checks.json').write_text(json.dumps(data,indent=2))
print(json.dumps(data));raise SystemExit(bool(failures))
