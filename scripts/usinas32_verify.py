"""Verify 18446 publication and prove production files/configuration stay intact."""
import json,sys
from usinas32_common import R,O,S,remote,save
phase=sys.argv[1];assert phase in ['production','published']
if phase=='published':
 before=json.loads((O/'homolog-before-manifest.json').read_bytes())
 code="import json,hashlib\nfrom pathlib import Path\nH=Path('/opt/concrefer-unificado/homolog-next');S=Path("+repr(S)+");m=json.loads((S/'release-manifest.json').read_text());expected="+repr(before)+"\nexpected.update({k:r['after'] for k,r in m.items()})\nfor key,row in expected.items():\n p=H/('public/unificado' if key.startswith('public/') else 'visual-full')/key.split('/',1)[1];assert p.resolve().is_relative_to(H);assert hashlib.sha256(p.read_bytes()).hexdigest()==row['sha256'],key\nB=Path(json.loads((S/'deployment.json').read_text())['backup']);backups=0\nfor key,row in m.items():\n if row['before']:\n  assert hashlib.sha256((B/key).read_bytes()).hexdigest()==row['before']['sha256'];backups+=1\nassert (B/'rollback.py').is_file()\nassert (H/'public/unificado/VERSION').read_text().strip()=='1.4.32'\nprint(json.dumps({'version':'1.4.32','hashes_verified':len(expected),'changed_files':len(m),'backup_original_files_verified':backups,'search_and_module_pages_preserved':True,'only_homolog':True}))";data=remote(code);save('published-verification.json',data);print(json.dumps(data))
else:
 before=json.loads((O/'production-before.json').read_bytes());after=remote((R/'scripts/producao_inventory_readonly.py').read_text(encoding='utf-8'));save('production-after.json',after);assert before['version']==after['version']=='1.4.31';assert before['files']==after['files'],'Production files changed';assert before['nginx']==after['nginx'];configs=lambda d:{s['unit']:s['config_files'] for s in d['services']};assert configs(before)==configs(after)
 schema=[]
 for db,data in before['databases'].items():
  for key in ['tables','columns','constraints','indexes']:assert data[key]==after['databases'][db][key],(db,key)
  schema.append(db)
 save('production-audit.json',{'version_before':'1.4.31','version_after':'1.4.31','application_files_unchanged':sum(len(v) for v in after['files'].values()),'systemd_nginx_pool_configs_unchanged':True,'schemas_unchanged':schema,'production_changes':0,'connections_before':len(before['cluster']['sessions']),'connections_after':len(after['cluster']['sessions']),'common_headroom_after':after['cluster']['common_headroom'],'ok':True});print(json.dumps({'production_unchanged':True,'files':sum(len(v) for v in after['files'].values()),'common_headroom':after['cluster']['common_headroom']}))
