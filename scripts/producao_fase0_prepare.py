"""Compile the frozen tested frontend for production, without environment fixtures."""
import ast,hashlib,json,re,subprocess,tarfile
from pathlib import Path
R=Path(__file__).resolve().parents[1];O=R/'docs/revisao-visual-unificado/producao-20261120';B=R/'.codex-tmp/producao-20261120';S=B/'source-capture';D=B/'candidate'
assert not (O/'frozen.json').exists(),'Candidate frozen: do not rebuild or change the approved artefact'
assert (S/'public/VERSION').read_text().strip()=='1.4.30'
excluded=[];changes=[];manifest={};domain_occurrences=[]
for source in sorted(S.rglob('*')):
 if not source.is_file():continue
 key=source.relative_to(S).as_posix()
 if key.startswith('backend/'):
  # Production receives logical master-policy patches, preserving its pool,
  # DSN and all other current backend code. Raw isolated backends are evidence.
  continue
 if key in ['public/pcp/teste-programacao/index.html','public/testar/index.html','services/mapa/testar-index.html'] or '999_rollback' in key:
  excluded.append({'file':key,'reason':'test-only surface or migration rollback reference, not a production update'});continue
 raw=source.read_bytes();new=raw
 if source.suffix.lower() in {'.html','.js','.css','.json','.webmanifest','.py','.sql'}:
  text=raw.decode('utf-8').replace('\r\n','\n');before=text
  if key in ['public/index.html','public/login.html']:
   text=re.sub(r'<style>\.test-environment-bar\{position:relative;.*?</style>','',text,flags=re.S)
   text=text.replace('<div class="test-environment-bar">AMBIENTE DE TESTE · dados isolados de homologação</div>','')
  if source.suffix=='.html':
   text=re.sub(r'<a\b[^>]*(?:href|data-page)=["\'][^"\']*teste-programacao[^"\']*["\'][^>]*>.*?</a>','',text,flags=re.I|re.S)
  if key=='public/shell/menu.config.js':
   text=re.sub(r'^.*id: \'testeProgramacao\'.*\n','',text,flags=re.M)
   text=text.replace("UNIFICADO_BASE.port === '18446' ? 'homolog' : 'producao'","'producao'")
   text=text.replace("item.id === 'testeProgramacao' ? 'ADMIN' : null",'null')
   start=text.index('const ambientePorId =');end=text.index('Object.values(MENU_CONFIG).forEach',start)
   text=text[:start]+'''const environmentItemIds = new Set([
  ...Object.values(MENU_CONFIG).flatMap(module => module.groups.flatMap(group => group.items.map(item => item.id))),
  ...window.UnificadoGedMenu.map(item => item.id), 'pcpUsuarios', 'prodUsuarios'
]);
window.UnificadoCatalogEnvironment = Object.freeze({
  name: UNIFICADO_AMBIENTE,
  allows(value) { const id=typeof value==='string'?value:value?.id;return environmentItemIds.has(id) && (!value?.ambiente || value.ambiente===UNIFICADO_AMBIENTE); }
});
'''+text[end:]
  if key=='public/shell/busca.js':
   text=text.replace("if(!route||!allowed(route)||(!homolog&&(item.ambiente==='homolog'||route.ambiente==='homolog'||item.id==='testeProgramacao')))continue;","if(!route||!allowed(route)||(!homolog&&((item.ambiente&&item.ambiente!=='producao')||(route.ambiente&&route.ambiente!=='producao'))))continue;")
   text=text.replace("homolog=location.port==='18446'","homolog=false").replace('homolog','allowOtherEnvironment')
  if key=='public/shell/icons.js':
   text=re.sub(r'^.*"testeProgramacao":.*\n','',text,flags=re.M).replace('reviewed on homolog','reviewed for the candidate')
  if key=='public/shell/modelo-a/menu.js':text=re.sub(r'^\s*\["testeProgramacao"[^\n]*\],?\n','',text,flags=re.M)
  if key=='public/shell/shell.js':
   text=text.replace("  if (route.ambiente === 'homolog' && location.port !== '18446') return false;\n",'')
   text=text.replace(",testeProgramacao:'bi-wrench'",'')
   assert "route.id === 'indicadorGeralProducao' && pcpUser?.nivel_acesso === 'PCP'" in text
  if key in ['public/shell/auth.js','public/pcp/static/js/app.js']:text=re.sub(r"['\"]teste-programacao['\"],?\s*",'',text)
  if key in ['public/shell/shell.js','public/logistica/logistica-native.js','public/logistica/dist/logistica-native.js']:
   text=re.sub(r",\s*(['\"])user-alex\1",'',text)
  if key=='public/sw.js':text='// Frozen production candidate 1.4.30; environment fixtures excluded.\n'+text
  if key=='public/shell/aviso.json':assert json.loads(text)['ativo'] is False
  forbidden=['18446','visual_homolog','_homolog_','AMBIENTE DE TESTE','TESTE-REVISAO-COMPLETA','testeProgramacao','teste-programacao','Teste Programação']
  assert not any(term.lower() in text.lower() for term in forbidden),('production package contamination',key,[term for term in forbidden if term.lower() in text.lower()])
  if re.search('homolog',text,re.I):
   assert key in ['public/suprimentos/frontend/app.js','public/suprimentos/frontend/compras.js'],('unclassified test-environment reference',key)
   domain_occurrences.append({'file':key,'meaning':'supplier qualification status/fields, not a test-environment setting','occurrences':len(re.findall('homolog',text,re.I))})
  if key.startswith('public/'):assert 'user-alex' not in text,('test identity in frontend',key)
  new=text.encode('utf-8')
  if new!=raw:changes.append({'file':key,'source_sha256':hashlib.sha256(raw).hexdigest(),'production_sha256':hashlib.sha256(new).hexdigest(),'reason':'explicit production environment/test-identity/test-screen exclusions'})
 dest=D/key;dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(new)
 manifest[key]={'bytes':len(new),'sha256':hashlib.sha256(new).hexdigest()}
policy={'version':'1.4.30','add_master_identity':'alex','exclude_test_identity':'user-alex','preserve_all_other_identities':True,'preserve_production_pool_and_dsn_settings':True,'backend_targets':{'mapa/screen_access.py':'MASTER_USER_IDS','mapa/logistica_access.py':'MASTERS','logistica/logistica/core.py':'MASTERS'},'erp_stock_integration':'excluded; preserve the current production implementation','armacao':'disabled','production_pool_changes':False,'network_dropins_ebpf':'excluded','aviso_ativo':False}
dest=D/'policy/production-policy.json';dest.parent.mkdir(parents=True,exist_ok=True);dest.write_text(json.dumps(policy,ensure_ascii=False,indent=2),encoding='utf-8');manifest['policy/production-policy.json']={'bytes':dest.stat().st_size,'sha256':hashlib.sha256(dest.read_bytes()).hexdigest()}
patcher=R/'scripts/producao_master_policy.py';dest=D/'backend/master_policy.py';dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(patcher.read_bytes());manifest['backend/master_policy.py']={'bytes':dest.stat().st_size,'sha256':hashlib.sha256(dest.read_bytes()).hexdigest()}
assert json.loads((D/'public/shell/aviso.json').read_text())['ativo'] is False
for key in manifest:
 if key.endswith('.js') and key.startswith('public/'):
  data=(D/key).read_bytes();module=bool(re.search(rb'^\s*(?:export|import)\s+(?!\()',data,re.M))
  result=subprocess.run(['node','--check',*(['--input-type=module'] if module else [])],input=data,capture_output=True);assert result.returncode==0,(key,result.stderr.decode('utf-8'))
for name,data in [('candidate-manifest.json',manifest),('candidate-exclusions.json',excluded),('candidate-production-transforms.json',changes),('candidate-domain-scan.json',domain_occurrences)]:
 (O/name).write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
with tarfile.open(O/'candidate.tgz','w:gz') as archive:
 for key in sorted(manifest):archive.add(D/key,arcname=key)
print(json.dumps({'version':'1.4.30','files':len(manifest),'excluded_paths':len(excluded),'production_transforms':len(changes),'supplier_domain_occurrences_reviewed':len(domain_occurrences),'production_changed':False}))
