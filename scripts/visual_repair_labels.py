"""Repair reversible UTF-8/Windows-1252 mojibake in authored Lab labels."""
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def repair(value):
 for _ in range(3):
  out=[];i=0;changed=False
  while i<len(value):
   replacement=None
   if value[i] in 'ÃÂâð':
    for size in range(min(4,len(value)-i),1,-1):
     part=value[i:i+size]
     for encoding in ['cp1252','latin1']:
      try:decoded=part.encode(encoding).decode('utf-8')
      except (UnicodeEncodeError,UnicodeDecodeError):continue
      if decoded!=part:replacement=(decoded,size);break
     if replacement:break
   if replacement:out.append(replacement[0]);i+=replacement[1];changed=True
   else:out.append(value[i]);i+=1
  value=''.join(out)
  if not changed:break
 return value
if __name__=='__main__':
 count=0
 for p in (ROOT/'unificado/laboratorio/frontend/src').rglob('*'):
  if p.is_file() and p.suffix in ('.tsx','.inc'):
   source=p.read_text(encoding='utf-8');fixed=repair(source)
   if fixed!=source:p.write_text(fixed,encoding='utf-8');count+=1
 print('Authored files with repaired display labels:',count)
