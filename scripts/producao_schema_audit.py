"""Compare every migration's schema effects with the tested schema and live catalog."""
import ast,copy,hashlib,json,re
from pathlib import Path
R=Path(__file__).resolve().parents[1];O=R/'docs/revisao-visual-unificado/producao-20261120';S=R/'.codex-tmp/producao-20261120/source-capture/schema'
inventory=json.loads((O/'inventory.json').read_bytes());production=inventory['databases'];expected=json.loads((O/'expected-schema.json').read_bytes());runtime_differences=[]
# Source SQL 001/007 explicitly requires DEFAULT 25. Record the homolog
# discrepancy separately instead of treating a whole-table comparison as
# evidence that migration 004 (a different column) is missing or wrong.
for col in expected['laboratorio_visual_homolog_20261118']['columns']:
 if (col['schema'],col['table_name'],col['name'])==('public','cq_parametros','fck_mpa'):
  if col['default_expr']!='25':runtime_differences.append({'database':'laboratorio_visual_homolog_20261118','schema':'public','table':'cq_parametros','column':'fck_mpa','tested_homolog_default':col['default_expr'],'source_sql_001_007_default':'25','production_default':'25','checkpoint':'FAIL: reconcile the homolog configuration and revalidate; do not change production FCK silently.'})
  col['default_expr']='25'
pairs={'pcp':('pcp_unificado_teste','pcp_visual_homolog_20261118'),'armacao':('pcp_unificado_teste','pcp_visual_homolog_20261118'),'mapa':('mapa_unificado_teste','mapa_visual_homolog_20261118'),'cq':('concretrack_postes','laboratorio_visual_homolog_20261118'),'laboratorio':('concretrack_postes','laboratorio_visual_homolog_20261118')}
all_hashes={path:meta for files in inventory['files'].values() for path,meta in files.items()}
def canonical(value):
 if not isinstance(value,str):return value
 # PostgreSQL 18 expands array element casts after restore; PostgreSQL 16
 # retains the equivalent array-level cast. Only normalize that exact pattern.
 value=re.sub(r"::character varying::text",'::character varying',value)
 value=re.sub(r"(ARRAY\[(?:'[^']*'::character varying(?:, )?)+\])::text\[\]",r'\1',value)
 return value
def compare(area,tables,columns=None,constraints=None,indexes=None):
 db,hd=pairs[area];pd=production[db];ed=expected[hd];evidence=[];differences=[];missing=[]
 for kind in ['columns','constraints','indexes']:
  actual={(r['schema']+'.'+r['table_name'],r['name']):r for r in pd[kind]}
  for row in ed[kind]:
   table=row['schema']+'.'+row['table_name']
   if table not in tables:continue
   restriction={'columns':columns,'constraints':constraints,'indexes':indexes}[kind]
   if restriction is not None and (table,row['name']) not in restriction:continue
   other=actual.get((table,row['name']))
   if other is None:missing.append({'kind':kind,'expected':row});continue
   if {k:canonical(v) for k,v in row.items()}!={k:canonical(v) for k,v in other.items()}:differences.append({'kind':kind,'expected':row,'actual':other})
   evidence.append({'kind':kind,'expected':row,'actual':other,'equivalent':not differences or differences[-1].get('expected')!=row})
 return {'database':db,'tables':sorted(tables),'status':'diferente' if differences else 'ausente' if missing else 'presente','missing':missing,'differences':differences,'evidence':evidence}
results=[]
for path in sorted(S.rglob('*')):
 if not path.is_file() or '999_rollback' in path.name:continue
 area=path.relative_to(S).parts[0];source=path.read_text(encoding='utf-8');revision=path.stem;upgrade=source
 if path.suffix=='.py':
  tree=ast.parse(source);upgrade='\n'.join(ast.get_source_segment(source,n) for n in tree.body if isinstance(n,ast.FunctionDef) and n.name=='upgrade')
  revision=next((ast.literal_eval(n.value) for n in tree.body if isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='revision' for t in n.targets)),revision)
 names=re.findall(r'(?:CREATE\s+TABLE(?:\s+IF\s+NOT\s+EXISTS)?|ALTER\s+TABLE)\s+((?:[\w]+\.)?[\w]+)',upgrade,re.I)
 tables={name if '.' in name else 'public.'+name for name in names}
 if area=='pcp' and revision=='20261023_01':tables.update('public.'+t for t in ['atividades_mao_de_obra','maodeobra','maodeobra_dias'])
 if area=='pcp' and revision=='20261029_04':tables.add('public.programacoes_alex')
 if area=='pcp' and revision=='20261029_06':tables.update(['public.programacoes','public.programacoes_consolidacao_backup_20261029'])
 if area=='armacao' and 'iam_migrations' in path.parts:
  compare_area='mapa'
 else:compare_area=area
 # Restrict CQ006 to its five additive columns, not unrelated CQ schema.
 columns=None;constraints=None;indexes=None
 if area=='cq' and path.name.startswith('006'):
  tables={'public.cq_certificados','public.cq_resultados_data'};columns={('public.cq_certificados',n) for n in ['liberacao_excepcional_por','liberacao_excepcional_nome','liberacao_excepcional_motivo','liberacao_excepcional_em']}|{('public.cq_resultados_data','resultado_origem')};constraints=set();indexes=set()
 if area=='cq' and path.name.startswith('004'):columns={('public.cq_parametros','resp_laboratorio_padrao')};constraints=set();indexes=set()
 if area=='cq' and path.name.startswith('007'):columns={('public.cq_parametros','fck_mpa')};constraints=set();indexes=set()
 if area=='pcp' and revision=='20261029_04':columns={('public.programacoes_alex','reserva')};constraints=set();indexes=set()
 entry=compare(compare_area,tables,columns,constraints,indexes)
 if tables:assert entry['evidence'] or entry['missing'],('No schema evidence captured',str(path))
 if area=='cq' and path.name.startswith('006'):assert len(entry['evidence'])+len(entry['missing'])==5
 matches=[(p,m) for p,m in all_hashes.items() if Path(p).name==path.name and any(segment in p for segment in ['/migrations/','/iam_migrations/','/alembic/'])]
 sha=hashlib.sha256(path.read_bytes()).hexdigest();source_matches=[p for p,m in matches if m['sha256']==sha]
 entry.update(area=area,revision=revision,reference=path.relative_to(S).as_posix(),reference_sha256=sha,matching_production_source=source_matches)
 if path.suffix=='.py':
  db=pairs[compare_area][0];heads={k:v for k,v in production[db]['selected_rows'].items() if 'alembic_version' in k}
  entry['live_alembic_heads']=heads
  if not source_matches:entry['source_discrepancy']=matches;entry['status']='diferente'
 elif matches and not source_matches:entry['source_discrepancy']=matches;entry['status']='diferente'
 if not tables:entry['data_only_or_seed']=True;entry['note']='No structural DDL in this upgrade; live revision ancestry plus identical production migration source. Business seed rows can evolve and will not be replayed.'
 if area=='cq':entry['runtime_configuration_discrepancies']=runtime_differences
 results.append(entry)
pcp=[r for r in results if r['area']=='pcp'];assert len(pcp)==19,len(pcp)
parents={}
for path in (S/'pcp/alembic/versions').glob('*.py'):
 values={t.id:ast.literal_eval(n.value) for n in ast.parse(path.read_text(encoding='utf-8')).body if isinstance(n,ast.Assign) for t in n.targets if isinstance(t,ast.Name) and t.id in ['revision','down_revision']}
 parents[values['revision']]=values['down_revision']
head=production['pcp_unificado_teste']['selected_rows']['public.alembic_version'][0]['version_num'];chain=[]
while head is not None:
 assert head in parents and head not in chain,head
 chain.append(head);head=parents[head]
assert set(chain)=={r['revision'] for r in pcp}
for row in pcp:row['live_revision_ancestry_verified']=True
(O/'migration-audit.json').write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf-8')
(O/'runtime-configuration-discrepancies.json').write_text(json.dumps(runtime_differences,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'migrations':len(results),'pcp':len(pcp),'statuses':{s:sum(r['status']==s for r in results) for s in ['presente','ausente','diferente']},'problems':[{k:r.get(k) for k in ['reference','status','missing','differences','source_discrepancy']} for r in results if r['status']!='presente']},ensure_ascii=True))
