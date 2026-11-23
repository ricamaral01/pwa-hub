"""Mirror the exact pinned static dependencies already referenced by Usinas."""
import hashlib,json,re
from pathlib import Path
from urllib.parse import urlsplit
import requests
ROOT=Path(__file__).resolve().parents[1];U=ROOT/'unificado';files=list((U/'usinas').rglob('*.html'))
known={'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css':'/unificado/vendor/bootstrap/bootstrap.min.css','https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js':'/unificado/vendor/bootstrap/bootstrap.bundle.min.js','https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css':'/unificado/vendor/bootstrap-icons/bootstrap-icons.css'}
urls=set()
for p in files:urls.update(re.findall(r'(?:src|href)=["\x27](https?://[^"\x27]+)',p.read_text(encoding='utf-8')))
records=[]
for url in sorted(urls):
 parsed=urlsplit(url)
 if parsed.hostname in ('fonts.googleapis.com','fonts.gstatic.com'):continue
 assert parsed.hostname in ('cdn.jsdelivr.net','cdnjs.cloudflare.com') and parsed.path.endswith(('.js','.css')),url
 if url not in known:
  rel='vendor/published/'+Path(parsed.path).stem+'-'+hashlib.sha256(url.encode()).hexdigest()[:10]+Path(parsed.path).suffix
  p=U/rel;p.parent.mkdir(parents=True,exist_ok=True)
  if not p.exists():
   response=requests.get(url,timeout=40);response.raise_for_status();p.write_bytes(response.content)
  known[url]='/unificado/'+rel
 p=U/known[url].removeprefix('/unificado/')
 records.append({'source':url,'local':known[url],'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'dependency_version_changed':False})
for p in files:
 s=p.read_text(encoding='utf-8')
 s=re.sub(r'<link[^>]+(?:fonts.googleapis.com|fonts.gstatic.com)[^>]*>','',s)
 for old,new in known.items():s=s.replace(old,new)
 p.write_text(s,encoding='utf-8')
out=ROOT/'docs/revisao-visual-unificado/homolog/fase-5';out.mkdir(parents=True,exist_ok=True)
(out/'local-dependencies.json').write_text(json.dumps(records,indent=2))
print('Exact pinned static dependencies available locally:',len(records))
