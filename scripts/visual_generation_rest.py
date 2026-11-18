"""Clone only HOMOLOG containers onto new loopback ports and the new test DB."""
import json,re,shlex,shutil,subprocess
from pathlib import Path
R=Path('/opt/concrefer-unificado');H=R/'homolog-next';S=H/'staging/visual-completo';G=H/'visual-full';E=Path('/etc/concrefer-unificado/homolog')
def run(args,**kw):return subprocess.run(args,check=True,**kw)
def inspect(name):return json.loads(subprocess.check_output(['docker','inspect',name]))[0]
def env(p):
 out={}
 for l in Path(p).read_text().splitlines():
  a=shlex.split(l)
  if len(a)==1 and '=' in a[0]:k,v=a[0].split('=',1);out[k]=v
 return out
plans=[('mapa-homolog-postgrest-reader','visual-homolog-postgrest-reader',13151,14151),('mapa-homolog-postgrest-writer','visual-homolog-postgrest-writer',13158,14158),('mapa-homolog-photo','visual-homolog-photo',13159,14159)]
results=[]
for source,name,oldport,newport in plans:
 marker=S/(name+'.json')
 if marker.exists():results.append(json.loads(marker.read_text()));continue
 original=inspect(source);assert original['HostConfig']['NetworkMode']=='host'
 conf={x.split('=',1)[0]:x.split('=',1)[1] for x in original['Config']['Env'] if '=' in x}
 for k,v in conf.items():
  v=v.replace('mapa_unificado_homolog_20261016','mapa_visual_homolog_20261118').replace(str(oldport),str(newport))
  for a,b in [(13151,14151),(13158,14158),(13159,14159),(13152,14152)]:v=v.replace('127.0.0.1:'+str(a),'127.0.0.1:'+str(b))
  conf[k]=v
 assert 'mapa_unificado_teste' not in str(conf)
 ef=E/(name+'.env');ef.write_text('\n'.join(k+'='+v for k,v in conf.items())+'\n');ef.chmod(0o600)
 args=['docker','run','-d','--name',name,'--network','host','--restart','unless-stopped','--env-file',str(ef)]
 for mount in original['Mounts']:
  sourcepath=Path(mount['Source']);assert sourcepath.is_relative_to(H)
  target=G/'photo-storage';shutil.copytree(sourcepath,target,dirs_exist_ok=True)
  args+=['-v',str(target)+':'+mount['Destination']]
 args.append(original['Image'])
 args += [x.replace(str(oldport),str(newport)) for x in original['Config'].get('Cmd') or []]
 run(args,stdout=subprocess.DEVNULL)
 info={'source_homolog_container':source,'container':name,'loopback_port':newport,'database':'mapa_visual_homolog_20261118' if 'postgrest' in name else None,'published_containers_modified':False}
 marker.write_text(json.dumps(info,indent=2));results.append(info);print(json.dumps(info),flush=True)
# Separate internal read/photo proxy. Do not edit the old 13153 proxy.
candidate=[]
for directory in ['/etc/nginx/conf.d','/etc/nginx/sites-enabled']:
 for p in Path(directory).glob('*'):
  if p.is_file() and re.search(r'listen\s+(?:127\.0\.0\.1:)?13153\b',p.read_text(errors='replace')):candidate.append(p)
assert len(candidate)==1,[str(x) for x in candidate]
src=candidate[0];text=src.read_text();new=Path('/etc/nginx/conf.d/mapa-visual-homolog-internal.conf')
for a,b in [(13153,14153),(13151,14151),(13158,14158),(13159,14159),(13152,14152)]:text=text.replace(str(a),str(b))
if not new.exists():
 new.write_text(text)
 try:run(['nginx','-t'])
 except Exception:new.unlink();raise
 run(['systemctl','reload','nginx'])
(S/'generation-rest.json').write_text(json.dumps({'containers':results,'internal_proxy':str(new),'source_proxy_unchanged':str(src)},indent=2))
