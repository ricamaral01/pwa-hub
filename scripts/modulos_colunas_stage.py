"""Stage module-column implementation separately from search and prior changes."""
import argparse,difflib,json,subprocess
from pathlib import Path
R=Path(__file__).resolve().parents[1];O=R/'docs/revisao-visual-unificado/homolog/modulos-colunas-20261120';B=R/'.codex-tmp/modulos-colunas-baseline'
parser=argparse.ArgumentParser();parser.add_argument('--stage',action='store_true');args=parser.parse_args()
def git(*argv,input=None):return subprocess.run(['git',*argv],cwd=R,input=input,stdout=subprocess.PIPE,stderr=subprocess.PIPE,check=True).stdout
if args.stage:assert not git('diff','--cached','--name-only').strip(),'pre-existing staged files'
changes=[];partial=[]
paths=[p.relative_to(B).as_posix() for p in B.rglob('*') if p.is_file()]+['tests/unificado/busca_browser.py']
for rel in paths:
 head=git('show','HEAD:'+rel).decode('utf-8').replace('\r\n','\n');old=(B/rel).read_text(encoding='utf-8') if (B/rel).exists() else head;current=(R/rel).read_text(encoding='utf-8')
 if old==current:continue
 changes.append(rel)
 if old==head:
  if args.stage:git('add','--',rel)
 else:
  partial.append(rel);merged=head;before=old.splitlines(True);after=current.splitlines(True)
  edits=[op for op in difflib.SequenceMatcher(a=before,b=after,autojunk=False).get_opcodes() if op[0]!='equal']
  for tag,i1,i2,j1,j2 in reversed(edits):
   needle=''.join(before[i1:i2]);replacement=''.join(after[j1:j2])
   if needle:
    assert merged.count(needle)==1,('ambiguous partial delta',rel,tag);merged=merged.replace(needle,replacement,1)
   else:
    anchor=''.join(before[max(0,i1-3):i1]);assert anchor and merged.count(anchor)==1,('ambiguous insertion',rel);merged=merged.replace(anchor,anchor+replacement,1)
  if args.stage:
   oid=git('hash-object','-w','--stdin',input=merged.encode()).decode().strip();git('update-index','--cacheinfo','100644',oid,rel)
new=['unificado/shell/module-columns.css','docs/revisao-visual-unificado/PROMPT_CODEX_MODULOS_COLUNAS.md','docs/revisao-visual-unificado/telas/f3-modulo-planejamento.html']
new += [p.relative_to(R).as_posix() for p in (R/'scripts').glob('modulos_*.py')]
new += [p.relative_to(R).as_posix() for p in (R/'tests/unificado').glob('modulos*') if p.is_file()]
new += [p.relative_to(R).as_posix() for p in O.glob('new-descriptions*.json')]
result={'source_files':changes,'partial_files_excluding_prior_work':partial,'search_commit':'964e4281','unchanged_mobile_source':True,'search_engine_css_and_synonyms_unchanged':True,'prior_work_preserved':True,'push':False,'pr':False}
(O/'source-changes.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
if args.stage:
 for start in range(0,len(new),60):git('add','--',*new[start:start+60])
print(json.dumps(result))
