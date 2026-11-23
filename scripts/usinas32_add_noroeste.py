"""Extend the homolog delta for the shell-rendered Noroeste tables."""
import hashlib,json,tarfile
from usinas32_common import R,O,T,mapped,save
D=T/'release';m=json.loads((O/'release-manifest.json').read_bytes());assert 'public/shell/noroeste-content.css' not in m;save('first-publication-manifest.json',m)
link='<link rel="stylesheet" href="/unificado/shell/noroeste-content.css?v=1.4.32" media="screen">'
for root in [R/'unificado',D/'public']:
 p=root/'index.html';text=p.read_text(encoding='utf-8');assert link not in text;p.write_text(text.replace('</head>',link+'\n</head>',1),encoding='utf-8',newline='')
 p=root/'sw.js';text=p.read_text(encoding='utf-8');assert "const CORE = [" in text;text=text.replace('const CORE = [',"const CORE = [ROOT+'shell/native-content.css?v=1.4.32',ROOT+'shell/noroeste-content.css?v=1.4.32',",1);p.write_text(text,encoding='utf-8',newline='')
key='public/shell/noroeste-content.css';(D/key).write_bytes((R/'unificado/shell/noroeste-content.css').read_bytes());m[key]={'destination':mapped(key),'before':None,'after':{}}
for key,row in m.items():row['after']={'sha256':hashlib.sha256((D/key).read_bytes()).hexdigest(),'bytes':(D/key).stat().st_size}
save('release-manifest.json',m)
with tarfile.open(O/'release.tgz','w:gz') as tar:
 for key in m:tar.add(D/key,arcname=key,recursive=False)
package=json.loads((O/'package.json').read_bytes());package.update(files=len(m),archive_sha256=hashlib.sha256((O/'release.tgz').read_bytes()).hexdigest(),noroeste_shell_scoped=True);save('package.json',package);files=json.loads((O/'source-files.json').read_bytes());files.append('unificado/shell/noroeste-content.css');save('source-files.json',files);print(json.dumps({'files':len(m),'noroeste_shell_scoped':True}))
