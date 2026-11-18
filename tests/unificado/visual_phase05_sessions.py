"""Existing homologation identities; ephemeral credentials stay in memory."""
import json,subprocess

REMOTE=r'''
import base64,hashlib,hmac,json,shlex,time
from pathlib import Path
from urllib.parse import urlsplit
import psycopg
from itsdangerous import URLSafeTimedSerializer
def env(path):
 out={}
 for line in Path(path).read_text().splitlines():
  p=shlex.split(line)
  if len(p)==1 and '=' in p[0]:k,v=p[0].split('=',1);out[k]=v
 return out
root=Path('/etc/concrefer-unificado/homolog')
pcp=env(root/'visual-pcp.env');mapa=env(root/'visual-mapa.env')
for dsn,name in [(pcp['DATABASE_URL'],'pcp_visual_homolog_20261118'),(mapa['MAPA_AUTH_DATABASE_URL'],'mapa_visual_homolog_20261118')]:
 u=urlsplit(dsn);assert u.hostname in ('127.0.0.1','localhost') and u.path=='/'+name
with psycopg.connect(pcp['DATABASE_URL'],row_factory=psycopg.rows.dict_row) as db:
 db.execute('SET TRANSACTION READ ONLY')
 users=db.execute("SELECT id,username,nome,nivel_acesso,setor_id,ativo FROM public.usuarios WHERE ativo AND deleted_at IS NULL ORDER BY id").fetchall()
with psycopg.connect(mapa['MAPA_AUTH_DATABASE_URL'],row_factory=psycopg.rows.dict_row) as db:
 db.execute('SET TRANSACTION READ ONLY')
 maps={u['id']:u for u in db.execute('SELECT id,nome,perfil,updated_at,primeiro_acesso FROM public.usuarios WHERE ativo').fetchall()}
 links=db.execute('SELECT pcp_user_id,mapa_login FROM unificado_auth.identity_links ORDER BY id').fetchall()
signer=URLSafeTimedSerializer(mapa['MAPA_AUTH_SIGNING_KEY'],salt='mapa-login-v1')
def b64(x):return base64.urlsafe_b64encode(x).rstrip(b'=').decode()
def token(user):
 assert pcp.get('ALGORITHM','HS256')=='HS256'
 head=b64(json.dumps({'alg':'HS256','typ':'JWT'}).encode())
 body=b64(json.dumps({'sub':str(user['id']),'exp':int(time.time())+3600,'session_epoch_ms':int(time.time()*1000)}).encode())
 text=head+'.'+body
 return text+'.'+b64(hmac.new(pcp['SECRET_KEY'].encode(),text.encode(),hashlib.sha256).digest())
out={}
for role in ['ADMIN','PCP','PRODUCAO','CONSULTA']:
 candidates=[]
 for user in users:
  if user['nivel_acesso']!=role:continue
  for link in links:
   m=maps.get(link['mapa_login'])
   if link['pcp_user_id']==user['id'] and m and not m['primeiro_acesso']:candidates.append((user,m))
 candidates.sort(key=lambda pair:(pair[1]['id']!='user-ricardo',pair[0]['id']))
 if not candidates:
  available=[u for u in users if u['nivel_acesso']==role]
  if available:
   user=available[0];out[role]={'user':user,'mapa':None,'cookie':None,'token':token(user)}
  else:out[role]={'unavailable':True,'existing_api_users':0}
  continue
 user,m=candidates[0]
 cookie=signer.dumps({'scope':'session','id':m['id'],'updated_at':m['updated_at'].isoformat()})
 out[role]={'user':user,'mapa':{k:m[k] for k in ('id','nome','perfil')},'cookie':cookie,'token':token(user)}
print(json.dumps(out,default=str))
'''

def sessions():
    r=subprocess.run(['ssh','vps-concrefer','/opt/concrefer-unificado/homolog-next/visual-full/mapa/.venv/bin/python','-'],input=REMOTE,text=True,capture_output=True,check=True)
    return json.loads(r.stdout)

if __name__=='__main__':
    data=sessions()
    print(json.dumps({role:({'unavailable':True,**v} if v.get('unavailable') else {'role':v['user']['nivel_acesso'],'paired_identity':bool(v.get('mapa'))}) for role,v in data.items()}))
