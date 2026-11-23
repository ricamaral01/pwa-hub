"""Build a small static delta from live 18446 bytes; keep unrelated WIP intact."""
import hashlib,json,re,tarfile
from pathlib import Path
from usinas32_common import R,O,T,save,mapped
D=T/'release';D.mkdir(exist_ok=True);before=json.loads((O/'homolog-before-manifest.json').read_bytes());inventory=json.loads((O/'native-component-inventory.json').read_bytes());link='<link rel="stylesheet" href="/unificado/shell/native-content.css?v=1.4.32" media="screen">';keys=['public/'+x for x in ['VERSION','index.html','login.html','sw.js','shell/shell.js']]+[r['file'] for r in inventory if r['visual_style']];changes=[]
def source_path(key):
 if key.startswith('public/'):return R/'unificado'/key.removeprefix('public/')
 if key.startswith('services/laboratorio/'):return R/'unificado/laboratorio/service'/key.removeprefix('services/laboratorio/')
 if key=='services/carta-static/index.html':return R/'unificado/laboratorio/frontend/embedded/carta-static/index.html'
 raise ValueError(key)
for key in keys:assert source_path(key).is_file(),source_path(key)
for key in keys:
 old=(T/'before'/key).read_text(encoding='utf-8');text=old.replace('1.4.31','1.4.32') if key.startswith('public/') and key in keys[:5] else old
 if key not in keys[:5]:assert '</head>' in text;text=text.replace('</head>',link+'\n</head>',1)
 p=D/key;p.parent.mkdir(parents=True,exist_ok=True);p.write_text(text,encoding='utf-8',newline='')
 source=source_path(key)
 assert source.is_file(),source
 original=source.read_text(encoding='utf-8');updated=original.replace('1.4.31','1.4.32') if key in keys[:5] else original.replace('</head>',link+'\n</head>',1);assert updated!=original,source;source.write_text(updated,encoding='utf-8',newline='');changes.append(str(source.relative_to(R)))
 if key.startswith('services/laboratorio/'):
  mirror=R/'unificado/laboratorio/frontend/embedded/laboratorio'/key.removeprefix('services/laboratorio/')
  if mirror.is_file():
   text=mirror.read_text(encoding='utf-8');assert '</head>' in text;mirror.write_text(text.replace('</head>',link+'\n</head>',1),encoding='utf-8',newline='');changes.append(str(mirror.relative_to(R)))
key='public/shell/native-content.css';p=D/key;p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes((R/'unificado/shell/native-content.css').read_bytes());keys.append(key)
manifest={key:{'destination':mapped(key),'before':before.get(key),'after':{'sha256':hashlib.sha256((D/key).read_bytes()).hexdigest(),'bytes':(D/key).stat().st_size}} for key in keys};save('release-manifest.json',manifest);save('source-files.json',changes+['unificado/shell/native-content.css'])
with tarfile.open(O/'release.tgz','w:gz') as tar:
 for key in keys:tar.add(D/key,arcname=key,recursive=False)
save('package.json',{'version':'1.4.32','only_homolog':True,'files':len(keys),'native_html_files':len(keys)-6,'archive_sha256':hashlib.sha256((O/'release.tgz').read_bytes()).hexdigest(),'database_changes':0,'service_restarts':0,'production_changes':0});print(json.dumps({'files':len(keys),'native_html_files':len(keys)-6,'only_homolog':True}))
