"""Recheck saved workflows, immutable emitted PDFs, and the frozen narrow login."""
import hashlib,json
from pathlib import Path
from PIL import Image,ImageChops
R=Path(__file__).resolve().parents[2];O=R/'docs/revisao-visual-unificado/homolog/revisao-completa'
source=Path(__file__).with_name('visual_final_flows.py')
ns={'__file__':str(source),'__name__':'review_preservation_flows'}
exec(compile(source.read_text(encoding='utf-8').replace("OUT/'fase-7/final-flows.json'","OUT/'revisao-completa/final-flows.json'"),str(source),'exec'),ns)
pcp=ns['pcp'];session=ns['admin'];pdfs=[]
for kind,key,path,screen in [('armaduras','armaduras_emission','armaduras','armadurasRelatorio'),('series','series_emission','postes-series','postesNumerosSerie')]:
 r=session.get(ns['BASE']+'/unificado/pcp/api/'+path+'/emissoes/'+str(pcp[key]['id'])+'/pdf',headers={'X-Unificado-Screen':screen},timeout=40)
 assert r.status_code==200
 digest=hashlib.sha256(r.content).hexdigest();expected=pcp[kind+'_pdf_sha256'];assert digest==expected
 pdfs.append({'kind':kind,'status':200,'sha256':digest,'byte_identical':True})
(O/'pdf-verification.json').write_text(json.dumps(pdfs,indent=2))
checks=[]
for width in [1024,820,390]:
 a=Image.open(O.parent/'fase-1/antes'/f'login-{width}.png');b=Image.open(O/'capturas/gerencia'/f'shell-login-{width}.png')
 box=(0,0,a.width,a.height-28);same=ImageChops.difference(a.crop(box),b.crop(box)).getbbox() is None
 checks.append({'width':width,'identical_except_version_footer':same})
(O/'login-comparison.json').write_text(json.dumps({'version':(R/'unificado/VERSION').read_text().strip(),'baseline':'published 1.4.6','excluded':'bottom 28px version footer','checks':checks},indent=2));assert all(c['identical_except_version_footer'] for c in checks),checks
print('Existing flows, emitted PDFs and narrow login preserved')
