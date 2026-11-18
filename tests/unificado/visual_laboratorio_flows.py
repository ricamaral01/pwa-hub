"""Record an identified CP test and save a draft Carta through the test gateway."""
import json,requests,uuid
from datetime import date,datetime,timedelta,timezone
from pathlib import Path
from homolog_session import test_cookie_for
BASE='https://concrefer.concretrack.com.br:18446';ROOT=Path(__file__).resolve().parents[2]
s=requests.Session();s.cookies.set('mapa_unificado_homolog_session',test_cookie_for('user-ricardo'),domain='concrefer.concretrack.com.br',path='/unificado/')
trace=[]
def call(method,path,body=None,screen='labCec'):
 r=s.request(method,BASE+path,json=body,headers={'Origin':BASE,'X-Unificado-Screen':screen},timeout=35)
 trace.append({'method':method,'path':path,'status':r.status_code})
 assert r.status_code in (200,201),(path,r.status_code,r.text[:400])
 return r.json()
label='HOMOLOG VISUAL F5 '+datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')
today=date.today();cp_id=str(uuid.uuid4());series='HOM-F5-'+cp_id[:8]
reading={'id':cp_id,'qr_raw':label,'traco':'HOMOLOG-F5','numero_serie':series,'nome':label,'cp':'1','idade':28,'data_moldagem':(today-timedelta(days=28)).isoformat(),'data_ruptura':today.isoformat(),'resistencia_mpa':32.5}
saved=call('POST','/unificado/laboratorio/cec-api/qrcp',reading)
assert saved['ok'] and saved['id']==cp_id
readings=call('GET','/unificado/laboratorio/cec-api/qrcp?limit=200')
record=next(r for r in readings if r['id']==cp_id);assert record['numero_serie']==series
carta='/unificado/mapa/api/laboratorio/carta-traco'
materials=call('GET',carta+'/materiais',screen='labCartaTraco')
material=next(m for m in materials if m.get('massa_especifica') and m.get('grupo')=='cimento')
draft={'nome':label,'codigo_traco':'HOM-F5-'+cp_id[:8],'unidade_id':1,'vigencia':today.isoformat(),'status':'Rascunho','observacao':'Dados identificados de teste visual; sem publicação operacional.','itens':[{'material_id':material['id'],'qtd_kg':350,'massa_especifica':material['massa_especifica']}]}
created=call('POST',carta+'/cartas',draft,'labCartaTraco')
detail=call('GET',carta+'/cartas/'+str(created['id']),screen='labCartaTraco')['carta']
assert detail['nome']==label and detail['status']=='Rascunho'
out={'origin':BASE,'label':label,'cp_reading':{'id':cp_id,'series':series,'mpa':32.5,'persisted':True},'draft_carta':{'id':created['id'],'revision':created['revisao'],'status':detail['status']},'trace':trace,'production_calls':0}
(ROOT/'docs/revisao-visual-unificado/homolog/fase-5/flow-results.json').write_text(json.dumps(out,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'cp_reading_persisted':True,'carta_id':created['id'],'carta_status':detail['status'],'calls':len(trace)}))
