"""Compare official and unified launches by business key without changing either side.

Usage: python scripts/compare_old_new_business.py 2026-10-04 --setores 1 2 3
Only GET is sent to official Mapa/PCP. Output contains rows/differences, no secrets.
"""
from __future__ import annotations
import argparse, base64, collections, json, subprocess, sys
from pathlib import Path
import httpx
from audit_pcp_api_parity import APIS, token

REMOTE_MAPA = r'''import base64,json,os,re,subprocess,sys,urllib.parse,urllib.request
day=sys.argv[1]; sectors=json.loads(base64.b64decode(sys.argv[2]))
for line in open('/opt/concrefer-unificado/migration/supabase-source.env',encoding='utf-8'):
 if line.strip() and not line.lstrip().startswith('#') and '=' in line:
  k,v=line.strip().split('=',1); os.environ[k]=v.strip().strip(chr(34)).strip(chr(39))
base=os.environ['SUPABASE_URL'].rstrip('/'); key=os.environ['SUPABASE_SECRET_KEY']
assert re.fullmatch(r'\d{4}-\d{2}-\d{2}',day)
assert all(re.fullmatch(r'Setor [1-4]',s) for s in sectors)
values=','.join(chr(39)+s+chr(39) for s in sectors)
def source_rows(table):
 rows=[]; last_id=None
 while True:
  params=[('select','*'),('data_fabricacao','eq.'+day),('setor','in.('+','.join(chr(34)+s+chr(34) for s in sectors)+')'),('order','id.asc'),('limit','500')]
  if last_id is not None: params.append(('id','gt.'+str(last_id)))
  req=urllib.request.Request(base+'/rest/v1/'+table+'?'+urllib.parse.urlencode(params),headers={'apikey':key,'Authorization':'Bearer '+key})
  with urllib.request.urlopen(req,timeout=60) as response: page=json.load(response)
  rows.extend(page)
  if len(page)<500: return rows
  if str(page[-1]['id'])==str(last_id): raise RuntimeError('Source pagination did not advance')
  last_id=page[-1]['id']
def destination_rows(table):
 sql="\\copy (SELECT COALESCE(json_agg(row_to_json(p) ORDER BY id),'[]'::json) FROM public."+table+" p WHERE data_fabricacao='"+day+"' AND setor IN ("+values+")) to stdout"
 raw=subprocess.check_output(['sudo','-u','postgres','psql','-X','-At','-d','mapa_unificado_teste','-c',sql],text=True)
 return json.loads(raw)
print(json.dumps({table:{'old':source_rows(table),'new':destination_rows(table)} for table in ('producao','montagem_poste')},ensure_ascii=False,default=str))'''

MONTAGEM_IGNORED = frozenset({'codigo_poste', 'descricao_poste', 'codigo_produto'})

def clean(row, ignored_fields=frozenset()):
 return {k:v for k,v in row.items() if k not in {'id','created_at','updated_at','data_hora'} | ignored_fields }
def bucket(rows,key,ignored_fields=frozenset()):
 out=collections.defaultdict(list)
 for row in rows: out['|'.join(str(row.get(k,'')) for k in key)].append(clean(row,ignored_fields))
 for values in out.values(): values.sort(key=lambda v:json.dumps(v,sort_keys=True,ensure_ascii=False,default=str))
 return out
def compare(left,right,key,ignored_fields=frozenset()):
 a,b=bucket(left,key,ignored_fields),bucket(right,key,ignored_fields); result=[]
 for k in sorted(set(a)|set(b)):
  if k not in a: status='so_no_novo'
  elif k not in b: status='so_no_antigo'
  elif a[k]==b[k]: status='igual_nos_dois'
  else: status='diferente'
  item={'chave':k,'situacao':status}
  if status=='diferente': item.update({'antigo':a[k],'novo':b[k]})
  elif status.startswith('so_'): item['registros']=a.get(k,b.get(k))
  result.append(item)
 return result

def main():
 p=argparse.ArgumentParser(); p.add_argument('data'); p.add_argument('--setores',nargs='+',required=True); p.add_argument('--saida',type=Path); args=p.parse_args()
 sectors=[s if s.lower().startswith('setor') else 'Setor '+s for s in args.setores]
 encoded=base64.b64encode(json.dumps(sectors).encode()).decode()
 run=subprocess.run(['ssh','vps-staging','sudo','/opt/concrefer-unificado/mapa-api/.venv/bin/python','-',args.data,encoded],input=REMOTE_MAPA,text=True,capture_output=True,check=True)
 mapa=json.loads(run.stdout)
 toks={name:token(*settings[:4]) for name,settings in APIS.items()}; pcp={}
 path=f'/producao/supabase?data_inicio={args.data}&data_fim={args.data}'
 with httpx.Client(timeout=90) as client:
  for name,settings in APIS.items():
   response=client.get(settings[4]+path,headers={'Authorization':'Bearer '+toks[name]}); response.raise_for_status(); pcp[name]=[r for r in response.json() if r.get('setor_nome') in sectors]
 report={'data':args.data,'setores':sectors,'somente_leitura_nos_antigos':True,'observacao_defeitos':'O novo conta uma ocorrencia por peca e inspecao; o antigo pode exibir a mesma ocorrencia duas vezes. Nenhum dado e importado ou corrigido.',
 'mapa_producao':compare(mapa['producao']['old'],mapa['producao']['new'],('data_fabricacao','setor','forma','tipo_concreto')),
 'mapa_montagem':compare(mapa['montagem_poste']['old'],mapa['montagem_poste']['new'],('data_fabricacao','setor','forma_numero','record_id','etapa','finalizado_em'),MONTAGEM_IGNORED),
 'mapa_montagem_campos_ignorados':sorted(MONTAGEM_IGNORED),
 'pcp_producao':compare(pcp['oficial'],pcp['copia'],('data','setor_nome','produto_nome','codigo_forma'))}
 raw=json.dumps(report,ensure_ascii=False,indent=2,default=str); print(raw)
 if args.saida: args.saida.write_text(raw+'\n',encoding='utf-8')
if __name__=='__main__': main()
