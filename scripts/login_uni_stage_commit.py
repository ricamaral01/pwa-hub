"""Stage this task only; preserve the worktree and previously uncommitted changes."""
import argparse,difflib,json,subprocess
from pathlib import Path
R=Path(__file__).resolve().parents[1];O=R/'docs/revisao-visual-unificado/homolog/login-uni-20261120';B=R/'.codex-tmp/login-uni-baseline'
parser=argparse.ArgumentParser();parser.add_argument('--stage',action='store_true');args=parser.parse_args()
def git(*args,input=None):return subprocess.run(['git',*args],cwd=R,input=input,stdout=subprocess.PIPE,stderr=subprocess.PIPE,check=True).stdout
if args.stage:assert not git('diff','--cached','--name-only').strip(),'pre-existing staged changes; do not include them'
hashes=json.loads((B/'source-hashes.json').read_text(encoding='utf-8'));changes=[];preexisting_untracked=[];partial=[];patches=[]
for rel in hashes:
 p=R/rel
 old=(B/rel).read_text(encoding='utf-8');current=p.read_text(encoding='utf-8')
 if old==current:continue
 changes.append(rel)
 tracked=bool(git('ls-files','--',rel).strip())
 patch=''.join(difflib.unified_diff(old.splitlines(True),current.splitlines(True),fromfile='a/'+rel,tofile='b/'+rel,n=3));patches.append(patch)
 if not tracked:
  preexisting_untracked.append(rel);continue
 head=git('show','HEAD:'+rel).decode('utf-8').replace('\r\n','\n')
 if head==old:
  if args.stage:git('add','--',rel)
 else:
  partial.append(rel);merged=head
  # Apply only task substitutions. Stop on ambiguity rather than stage prior work.
  before=old.splitlines(True);after=current.splitlines(True)
  edits=[op for op in difflib.SequenceMatcher(a=before,b=after,autojunk=False).get_opcodes() if op[0]!='equal']
  for tag,i1,i2,j1,j2 in reversed(edits):
   needle=''.join(before[i1:i2]);replacement=''.join(after[j1:j2])
   if needle:
    assert merged.count(needle)==1,('ambiguous partial stage',rel,tag)
    merged=merged.replace(needle,replacement,1)
   else:
    anchor=''.join(before[max(0,i1-3):i1]);assert anchor and merged.count(anchor)==1,('ambiguous addition',rel)
    merged=merged.replace(anchor,anchor+replacement,1)
  if args.stage:
   oid=git('hash-object','-w','--stdin',input=merged.encode()).decode().strip();git('update-index','--cacheinfo','100644',oid,rel)
(O/'source-task-delta.patch').write_text(''.join(patches),encoding='utf-8')
(O/'source-changes.json').write_text(json.dumps({'changed_files':changes,'partially_staged_without_prior_work':partial,'preexisting_untracked_recorded_as_patch_only':preexisting_untracked},indent=2),encoding='utf-8')
new_files=['unificado/shell/login-uni.js','unificado/shell/login-uni.css','unificado/shell/aviso.json','unificado/assets/img/unificado-pwa-icon.svg']
new_files += [p.relative_to(R).as_posix() for p in (R/'scripts').glob('login_uni_*.py')]
new_files += [p.relative_to(R).as_posix() for p in (R/'tests/unificado').glob('login_uni_*.py')]
new_files += ['docs/revisao-visual-unificado/PROMPT_CODEX_LOGIN_UNI.md','docs/revisao-visual-unificado/telas/f3-login-uni.html','docs/revisao-visual-unificado/telas/f3-login-uni-erro.html']
new_files += [p.relative_to(R).as_posix() for p in (R/'docs/revisao-visual-unificado/img/f3').glob('*.png')]
new_files += [p.relative_to(R).as_posix() for p in O.iterdir() if p.is_file() and p.suffix in {'.html','.json','.png','.txt','.md','.patch','.pdf'} and p.name not in ['profile-failure.png','commit.json']]
if args.stage:
 for start in range(0,len(new_files),60):git('add','--',*new_files[start:start+60])
print(json.dumps({'mode':'stage' if args.stage else 'plan','source_files_changed':len(changes),'partial_files':partial,'preexisting_untracked_patch_only':preexisting_untracked,'new_artifacts':len(new_files)}))
