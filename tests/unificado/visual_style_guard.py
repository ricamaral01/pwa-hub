"""Reject visual regressions in authored screen CSS, HTML and UI source.

Print rules and the original <=1024px login are retained by specification.
Third-party libraries and compiled JS are verified through source/build manifests.
"""
import hashlib,json,os,re,sys
from pathlib import Path
import tinycss2
ROOT=Path(__file__).resolve().parents[2];U=ROOT/'unificado'
SKIP={'node_modules','.venv','vendor','backend','service','api','dist','dist-tasks','assets','modelo-a'}
PALETTE={'0b1730','15416f','e2702a','f4f5f7','fff','ffffff','e1e5eb','eef1f4','5b6779','8a94a4','b42318','a15c00','1d7a4a'}
# Text symbols such as a checkmark in a checkbox are not pictographic emoji.
# Also reject escaped surrogate pairs so a JS escape cannot bypass this check.
EMOJI=re.compile('[\U0001f300-\U0001faff\u2705\u274c\u274e\u2753-\u2755\u2795-\u2797]|[\u2600-\u27ff]\ufe0f|\\\\u[dD]8[3-9a-fA-F][0-9a-fA-F]\\\\u[dD][c-fC-F][0-9a-fA-F]{2}')
def css_errors(source,tokens=False):
 errors=[]
 for r in tinycss2.parse_stylesheet(source,skip_whitespace=True,skip_comments=True):
  if r.type=='at-rule':
   pre=tinycss2.serialize(r.prelude)
   if r.lower_at_keyword=='media' and re.search(r'\bprint\b',pre):continue
   if r.content and r.lower_at_keyword in ('media','supports','container','layer'):errors+=css_errors(tinycss2.serialize(r.content),tokens)
   continue
  if r.type!='qualified-rule':continue
  selector=tinycss2.serialize(r.prelude)
  if re.search(r'\.\w*eyebrow|\.accent-mark',selector):errors.append('decorative-title')
  for d in tinycss2.parse_declaration_list(r.content,skip_whitespace=True,skip_comments=True):
   if d.type!='declaration':continue
   value=tinycss2.serialize(d.value)
   if d.lower_name=='font-family' and not tokens:errors.append('font-family')
   if 'linear-gradient(' in value:errors.append('gradient')
   if not tokens and any(c.lower() not in PALETTE for c in re.findall(r'#([0-9a-fA-F]{3,8})\b',value)):errors.append('color')
 return sorted(set(errors))

def js_style_errors(source):
 errors=[]
 for m in re.finditer(r'\.style\.cssText\s*=\s*([\x22\x27`])(.*?)\1',source,re.S):
  errors+=css_errors('x{'+m[2]+'}')
 for m in re.finditer(r'\.style\.(?:color|backgroundColor|background|borderColor)\s*=\s*([\x22\x27])([^\x22\x27]*)\1',source):
  errors+=css_errors('x{color:'+m[2]+'}')
 if re.search(r'\bfontFamily\s*:|\.style\.fontFamily\s*=',source):errors.append('font-family')
 return sorted(set(errors))
def scan():
 failures={};count=0
 paths=[]
 for base, dirs, names in os.walk(U):
  dirs[:]=[d for d in dirs if d not in SKIP and d!='fonts']
  paths.extend(Path(base)/name for name in names)
 for p in paths:
  if not p.is_file() or p.suffix not in ('.css','.html','.tsx','.js'):continue
  rel=p.relative_to(U)
  if any(x in SKIP for x in rel.parts):continue
  if rel.as_posix()=='shell/login-original.css':
   if hashlib.sha256(p.read_text(encoding='utf-8').encode()).hexdigest()!='583d6a6bd731032b85fbc1daca2b8ba3afaa0eba6bbae06f91f909608631d355':
    failures[rel.as_posix()]=['frozen-narrow-login-changed']
   continue
  if p.name.endswith(('.min.js','.min.css')):continue
  if p.name in ('login.html','inter-original.css'):continue
  if 'fonts' in rel.parts:continue
  source=p.read_text(encoding='utf-8');errors=[];count+=1
  if p.suffix=='.css':errors+=css_errors(source,rel.as_posix()=='shell/tokens.css')
  elif p.suffix=='.html':
   for block in re.findall(r'<style[^>]*>(.*?)</style>',source,re.S):errors+=css_errors(block)
  if p.suffix in ('.html','.tsx','.js'):
   errors += js_style_errors(source)
   for caption in re.findall(r'class(?:Name)?=[\x22\x27]([^\x22\x27]*)[\x22\x27]',source):
    if 'section-context' in caption.split() and 'legacy-print-title' not in caption.split():errors.append('decorative-title')
   for _, block in re.findall(r'\bstyle=([\x22\x27])(.*?)\1', source, re.S):
    errors += css_errors('x{' + block + '}')
   if re.search(r'class(?:Name)?=[\x22\x27][^\x22\x27]*(?:eyebrow|accent-mark)',source):errors.append('decorative-title')
   if EMOJI.search(source):errors.append('emoji')
  if errors:failures[rel.as_posix()]=sorted(set(errors))
 return count,failures
if __name__=='__main__':
 count,failures=scan();print(json.dumps({'files_checked':count,'failures':failures},ensure_ascii=True,indent=2));sys.exit(bool(failures))
