"""Convert authored screen CSS to the shared palette; preserve print rules."""
import json,re,sys
from pathlib import Path
import tinycss2
ROOT=Path(__file__).resolve().parents[1]
PALETTE={'c-navy':'0b1730','c-blue':'15416f','c-orange':'e2702a','c-bg':'f4f5f7','c-surface':'ffffff','c-line':'e1e5eb','c-line-2':'eef1f4','c-ink-2':'5b6779','c-ink-3':'8a94a4','c-crit':'b42318','c-warn':'a15c00','c-ok':'1d7a4a'}
def rgb(s):return tuple(int(s[i:i+2],16) for i in (0,2,4))
def color(m):
 raw=m.group(1)
 if len(raw) in (3,4):raw=''.join(c*2 for c in raw)
 if len(raw) not in (6,8):return m.group()
 channels=rgb(raw[:6]);alpha=int(raw[6:],16)/255 if len(raw)==8 else 1
 name=min(PALETTE,key=lambda k:sum((a-b)**2 for a,b in zip(channels,rgb(PALETTE[k]))))
 value='var(--'+name+')'
 return value if alpha==1 else 'color-mix(in srgb, '+value+' '+str(round(alpha*100,2))+'%, transparent)'
def declarations(content,selector):
 result=[]
 for d in tinycss2.parse_declaration_list(content,skip_whitespace=True,skip_comments=False):
  if d.type!='declaration':
   if d.type=='comment':result.append(tinycss2.serialize([d]))
   continue
  name=d.lower_name;v=tinycss2.serialize(d.value).strip()
  if name=='font-family':continue
  if name=='font':
   v=re.sub(r'(?:"(?:DM Sans|IBM Plex Sans|Segoe UI)"|\b(?:Manrope|Inter|Arial|Montserrat|Sora|Gotham)\b)[^;]*$', 'var(--f-sans)',v)
  if 'linear-gradient(' in v:v='var(--c-surface)'
  if name=='text-transform':v='none'
  if name=='box-shadow' and not re.search('dialog|modal|drawer|dropdown|popover|toast',selector):v='none'
  if name=='transform' and 'translateY' in v:v='none'
  if name.endswith('radius') and '%' not in v:v='var(--r-sm)' if v in ('2px','3px','4px') else 'var(--r)'
  v=re.sub(r'#([0-9a-fA-F]{3,8})\b',color,v)
  result.append(name+':'+v+('!important' if d.important else '')+';')
 return ''.join(result)
def rules(source):
 out=[]
 for r in tinycss2.parse_stylesheet(source,skip_whitespace=True,skip_comments=False):
  if r.type=='qualified-rule':
   selector=tinycss2.serialize(r.prelude).strip()
   if 'eyebrow' in selector or 'accent-mark' in selector:continue
   out.append(selector+'{'+declarations(r.content,selector)+'}')
  elif r.type=='at-rule':
   pre=tinycss2.serialize(r.prelude).strip()
   if r.lower_at_keyword=='font-face':continue
   if r.lower_at_keyword=='import' and 'fonts.google' in pre:continue
   if r.content is None:out.append(tinycss2.serialize([r]));continue
   if r.lower_at_keyword=='media' and re.search(r'\bprint\b',pre):out.append(tinycss2.serialize([r]));continue
   body=rules(tinycss2.serialize(r.content)) if r.lower_at_keyword in ('media','supports','layer','container','keyframes') else declarations(r.content,pre)
   out.append('@'+r.at_keyword+' '+pre+'{'+body+'}')
  elif r.type=='comment':out.append(tinycss2.serialize([r]))
 return '\n'.join(out)+'\n'
def screen_only(source):
 """Keep authored print declarations and cascade exactly, including page rules."""
 clean=[]
 for r in tinycss2.parse_stylesheet(source,skip_whitespace=False,skip_comments=False):
  if r.type=='at-rule' and r.lower_at_keyword in ('import','font-face'):continue
  clean.append(tinycss2.serialize([r]))
 original=''.join(clean)
 return '@media print {\n'+original+'\n}\n@media screen {\n'+rules(original)+'\n}\n'
if __name__=='__main__':
 for path in sys.argv[1:]:
  p=ROOT/path;p.write_text(rules(p.read_text(encoding='utf-8')),encoding='utf-8',newline='\n');print(path)
