"""Correct existing PNG size metadata so the real 1.4.26 app can be installed."""
import base64,json,shutil,struct
from datetime import datetime,timezone
from pathlib import Path
H=Path('/opt/concrefer-unificado/homolog-next');P=H/'public/unificado'
assert (P/'VERSION').read_text().strip()=='1.4.26'
png=P/'mapa/operacao/unificado-icon.png';width,height=struct.unpack('>II',png.read_bytes()[16:24]);assert width==height and width>=144
B=H/'backups'/('login-uni-icon-'+datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ'));B.mkdir(mode=0o700)
changes=[]
svgrel='assets/img/unificado-pwa-icon.svg';svg=P/svgrel
if svg.exists():saved=B/svgrel;saved.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(svg,saved)
svg.write_text('<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 '+str(width)+' '+str(height)+'"><image width="'+str(width)+'" height="'+str(height)+'" href="data:image/png;base64,'+base64.b64encode(png.read_bytes()).decode()+'"/></svg>');svg.chmod(0o644)
for rel in ['manifest.webmanifest','mapa/operacao/manifest.json']:
 p=P/rel;data=json.loads(p.read_text());saved=B/rel;saved.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(p,saved)
 old=data['icons'][0]['sizes'];data['icons']=[{'src':'/unificado/'+svgrel,'sizes':'any','type':'image/svg+xml','purpose':'any'}]+[dict(icon,sizes=f'{width}x{height}') for icon in data['icons'] if icon['type']=='image/png'];p.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n');p.chmod(0o644)
 changes.append({'file':rel,'before_sizes':old,'after_sizes':data['icons'][0]['sizes'],'image_bytes_changed':False})
result={'backup':str(B),'changes':changes,'version_unchanged':'1.4.26','production_changed':False,'rollback':'restore the two manifest files from this backup; no restart'}
(H/'staging/login-uni-20261120/pwa-icon-correction.json').write_text(json.dumps(result,indent=2));print(json.dumps(result))
