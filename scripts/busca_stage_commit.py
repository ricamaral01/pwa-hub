"""Stage search changes only, retaining unrelated worktree edits."""
import argparse,difflib,json,shutil,subprocess
from pathlib import Path
R=Path(__file__).resolve().parents[1];O=R/'docs/revisao-visual-unificado/homolog/busca-20261120';B=R/'.codex-tmp/busca-baseline'
parser=argparse.ArgumentParser();parser.add_argument('--stage',action='store_true');args=parser.parse_args()
def git(*argv,input=None):return subprocess.run(['git',*argv],cwd=R,input=input,stdout=subprocess.PIPE,stderr=subprocess.PIPE,check=True).stdout
if args.stage:assert not git('diff','--cached','--name-only').strip(),'pre-existing staged files'
hashes=json.loads((B/'hashes.json').read_text(encoding='utf-8'));paths=[*hashes,'unificado/login.html'];changes=[];partial=[]
prepared={}
for rel in paths:
 old=(B/rel).read_text(encoding='utf-8');current=(R/rel).read_text(encoding='utf-8')
 if old==current:continue
 assert git('ls-files','--',rel).strip(),rel
 changes.append(rel);head=git('show','HEAD:'+rel).decode('utf-8').replace('\r\n','\n')
 if rel=='unificado/logistica/logistica-native.js':continue # Rebuild from task-only source below.
 if head==old:
  prepared[rel]=current
  if args.stage:git('add','--',rel)
 else:
  partial.append(rel);merged=head;before=old.splitlines(True);after=current.splitlines(True)
  edits=[op for op in difflib.SequenceMatcher(a=before,b=after,autojunk=False).get_opcodes() if op[0]!='equal']
  if any(''.join(before[i:j]) and merged.count(''.join(before[i:j]))!=1 for _,i,j,_,_ in edits):
   # A prior change can share a long JSX line with this task. Match small
   # character edits with unique preceding context, retaining the prior text.
   for tag,i1,i2,j1,j2 in reversed(difflib.SequenceMatcher(a=old,b=current,autojunk=False).get_opcodes()):
    if tag=='equal':continue
    for width in [32,64,16,128,256]:
     prefix=old[max(0,i1-width):i1];needle=prefix+old[i1:i2]
     if needle and merged.count(needle)==1:break
    else:raise AssertionError(('ambiguous character delta',rel,tag,i1))
    merged=merged.replace(needle,prefix+current[j1:j2],1)
   edits=[]
  for tag,i1,i2,j1,j2 in reversed(edits):
   needle=''.join(before[i1:i2]);replacement=''.join(after[j1:j2])
   if needle:
    assert merged.count(needle)==1,('ambiguous task delta',rel,tag)
    merged=merged.replace(needle,replacement,1)
   else:
    anchor=''.join(before[max(0,i1-3):i1]);assert anchor and merged.count(anchor)==1,('ambiguous insertion',rel)
    merged=merged.replace(anchor,anchor+replacement,1)
  prepared[rel]=merged
  if args.stage:
   oid=git('hash-object','-w','--stdin',input=merged.encode()).decode().strip();git('update-index','--cacheinfo','100644',oid,rel)
# Rebuild the native artifact without bundling earlier IAM/master work. The
# deployed worktree continues to contain that previously authorized work.
frontend=R/'unificado/logistica/frontend';temp=R/'.codex-tmp/busca-commit-native';(temp/'src').mkdir(parents=True,exist_ok=True)
for name in ['package.json','vite.config.ts']:shutil.copy2(frontend/name,temp/name)
for source in (frontend/'src').iterdir():
 if not source.is_file():continue
 rel=source.relative_to(R).as_posix()
 data=prepared.get(rel)
 if data is None:data=git('show','HEAD:'+rel).decode('utf-8')
 (temp/'src'/source.name).write_text(data,encoding='utf-8')
if not (temp/'node_modules').exists():
 subprocess.run(['powershell','-NoProfile','-Command',"New-Item -ItemType Junction -Path '"+str(temp/'node_modules')+"' -Target '"+str(frontend/'node_modules')+"' | Out-Null"],check=True)
build=subprocess.run(['npm.cmd','run','build','--','--outDir',str(temp/'dist')],cwd=temp,stdout=subprocess.PIPE,stderr=subprocess.PIPE,check=True)
native='unificado/logistica/logistica-native.js';partial.append(native)
if args.stage:
 oid=git('hash-object','-w','--stdin',input=(temp/'dist/logistica-native.js').read_bytes()).decode().strip();git('update-index','--cacheinfo','100644',oid,native)
new=['unificado/shell/busca.js','unificado/shell/busca.css','unificado/shell/busca-sinonimos.json','docs/revisao-visual-unificado/PROMPT_CODEX_BUSCA.md','docs/revisao-visual-unificado/telas/f3-busca.html','docs/revisao-visual-unificado/telas/f3-m-busca.html']
new += [p.relative_to(R).as_posix() for p in (R/'scripts').glob('busca_*.py')]
new += [p.relative_to(R).as_posix() for p in (R/'tests/unificado').glob('busca*') if p.is_file()]
(O/'source-changes.json').write_text(json.dumps({'changed_files':changes,'partial_files_excluding_prior_work':partial,'native_artifact':'Index rebuilt from HEAD plus this task only. Deployed worktree retains previously authorized IAM/master changes.','prior_work_preserved':True,'push':False,'pr':False},indent=2),encoding='utf-8')
new += [p.relative_to(R).as_posix() for p in O.iterdir() if p.is_file() and p.suffix in {'.html','.json','.png','.txt','.md'} and p.name!='commit.json']
if args.stage:
 for start in range(0,len(new),60):git('add','--',*new[start:start+60])
print(json.dumps({'mode':'stage' if args.stage else 'plan','changed_files':changes,'partial_files':partial,'new_files':len(new)}))
