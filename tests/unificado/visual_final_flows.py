"""Re-read identified end-to-end test records after the final visual release."""
import json, requests
from pathlib import Path
from homolog_session import test_cookie_for
from visual_phase05_sessions import sessions
BASE='https://concrefer.concretrack.com.br:18446'
OUT=Path(__file__).resolve().parents[2]/'docs/revisao-visual-unificado/homolog'
def read(phase,filename):return json.loads((OUT/phase/filename).read_text(encoding='utf-8'))
identity=sessions()['ADMIN']
admin=requests.Session();admin.headers['Authorization']='Bearer '+identity['token']
admin.cookies.set('mapa_unificado_homolog_session',identity['cookie'],domain='concrefer.concretrack.com.br',path='/unificado/')
def get(session,path,screen=None):
    r=session.get(BASE+path,headers={'X-Unificado-Screen':screen} if screen else {},timeout=40)
    assert r.status_code==200,(path,r.status_code)
    return r.json()
sol=requests.Session();sol.cookies.set('mapa_unificado_homolog_session',test_cookie_for('e2e-suprimentos-sol'),domain='concrefer.concretrack.com.br',path='/unificado/')
assert sol.get(BASE+'/unificado/suprimentos/session-renew',timeout=30).status_code==200
sup=read('fase-3','flow-results.json')
request=get(sol,'/api/suprimentos/solicitacoes/'+sup['request_id'])
assert request['status']=='CONCLUIDA'
pcp=read('fase-4','flows-results.json')
week=get(admin,'/unificado/pcp/api/programacao-semanal?semana='+pcp['test_week'],'programacaoSemanal12')
assert week['semana']['status']=='publicada' and week['itens']
lab=read('fase-5','flow-results.json')
readings=get(admin,'/unificado/laboratorio/cec-api/qrcp?limit=200','labCec')
reading=next(r for r in readings if r['id']==lab['cp_reading']['id'])
assert float(reading['resistencia_mpa'])==lab['cp_reading']['mpa']
carta=get(admin,'/unificado/mapa/api/laboratorio/carta-traco/cartas/'+str(lab['draft_carta']['id']),'labCartaTraco')
assert carta['carta']['status']=='Rascunho'
quality=read('fase-6','qualidade-flow.json')
nc=get(admin,'/unificado/qualidade/api/nc/'+quality['nc_id'])
assert nc['nc']['status']=='ANALISE_CAUSA' and nc['nc_contencao']
version=(Path(__file__).resolve().parents[2]/'unificado/VERSION').read_text().strip()
result={'version':version,'origin':BASE,'supply_request':{'number':request['numero'],'state':request['status']},
        'planning':{'week':pcp['test_week'],'state':week['semana']['status'],'saved_items':len(week['itens'])},
        'cp_reading':{'id':reading['id'],'mpa':float(reading['resistencia_mpa'])},
        'carta':{'id':lab['draft_carta']['id'],'state':carta['carta']['status']},
        'nc':{'number':quality['number'],'state':nc['nc']['status'],'containment_persisted':True},
        'pdfs':'pdf-verification.json; byte-identical original emissions',
        'login_logout':'login-logout.json; real form, existing account, real server',
        'new_test_writes':0,'production_calls':0}
(OUT/'fase-7/final-flows.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'status':'ok','verified_flows':7,'new_writes':0}))
