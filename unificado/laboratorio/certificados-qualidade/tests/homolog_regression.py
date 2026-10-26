"""Write tests in the isolated homolog database only."""
import subprocess
from concurrent.futures import ThreadPoolExecutor
from datetime import date,timedelta
from pathlib import Path

import requests

from homolog_flow import BASE,REMOTE

URL=BASE+'/unificado/laboratorio/certificados-qualidade/'


def session(user_id):
    script=REMOTE.replace("id='user-ricardo'",f"id='{user_id}'")
    token=subprocess.run(['ssh','vps-concrefer','/opt/concrefer-unificado/homolog-next/mapa-api/.venv/bin/python','-'],
                         input=script,text=True,capture_output=True,check=True).stdout.strip()
    s=requests.Session()
    s.cookies.set('mapa_unificado_homolog_session',token,domain='concrefer.concretrack.com.br',path='/unificado/')
    response=s.post(BASE+'/unificado/mapa/api/unified/laboratorio-bootstrap',timeout=15)
    assert response.status_code==200,(user_id,response.status_code)
    s.headers.update({'Origin':BASE})
    return s,token


def body(config,press_id,client):
    model=min(config['models'],key=lambda row:len(row['modelo']))
    return {'cliente':client,'endereco':'Campinas/SP','nota_fiscal':'TESTE','data_emissao':date.today().isoformat(),
            'resp_laboratorio':'Ricardo Do Amaral','observacoes':'Teste de homologação',
            'prensa_id':press_id,'itens':[{'modelo':model['modelo'],'altura_m':model['altura_m'],
              'carga_dan':model['carga_dan'],'peso_kg':model['peso_kg'],
              'quantidade':1,'data_producao':'2026-07-07'}]}


def create(s,payload):
    r=s.post(URL+'api/certificados',json=payload,timeout=15)
    assert r.status_code==200,r.text[:200]
    return r.json()['id']


def issue(s,cert_id):
    return s.post(URL+f'api/certificados/{cert_id}/emitir',json={},timeout=30)


def main():
    ricardo,token=session('user-ricardo')
    cfg=ricardo.get(URL+'api/config',timeout=15).json()
    press_id=cfg['presses'][0]['id']
    other,_=session('e2e-lab-probe')
    cert_id=create(other,body(cfg,press_id,'TESTE PERMISSÃO E REVISÃO'))
    emitted=issue(other,cert_id)
    assert emitted.status_code==200,emitted.text[:300]
    original_pdf=other.get(URL+f'api/certificados/{cert_id}/pdf',timeout=15).content
    forbidden=other.post(URL+f'api/certificados/{cert_id}/revisar',json={},timeout=15)
    assert forbidden.status_code==403,forbidden.text[:200]
    revision=ricardo.post(URL+f'api/certificados/{cert_id}/revisar',json={},timeout=15)
    assert revision.status_code==200,revision.text[:200]
    revision_id=revision.json()['id']
    before=ricardo.get(URL+f'api/certificados/{cert_id}',timeout=15).json()['certificado']
    assert before['status']=='emitido'
    updated=body(cfg,press_id,'TESTE PERMISSÃO E REVISÃO');updated['nota_fiscal']='TESTE REVISÃO 1'
    changed=ricardo.put(URL+f'api/certificados/{revision_id}',json=updated,timeout=15)
    assert changed.status_code==200,changed.text[:200]
    revised=issue(ricardo,revision_id)
    assert revised.status_code==200,revised.text[:300]
    after=ricardo.get(URL+f'api/certificados/{cert_id}',timeout=15).json()['certificado']
    assert after['status']=='substituido'
    assert ricardo.get(URL+f'api/certificados/{cert_id}/pdf',timeout=15).content==original_pdf
    print('issue by lab user, correction denied, revision and immutable PDF: OK')

    expired={'fabricante':'TESTE DE HOMOLOGAÇÃO','modelo':'Calibração vencida',
             'serie':'TESTE','patrimonio':'','capacidade_kn':None,'classe':'',
             'certificado_calibracao':'TESTE','laboratorio_rbc':'TESTE',
             'data_calibracao':'2024-01-01','validade':'2024-12-31','ativa':True}
    press=ricardo.post(URL+'api/prensas',json=expired,timeout=15)
    assert press.status_code==200,press.text[:200]
    example=Path(__file__).resolve().parents[4]/'docs'/'certificado-qualidade'/'exemplos'/'homolog-3-datas-CQ-2026-0005.pdf'
    sample=example.read_bytes()
    uploaded=ricardo.post(URL+f"api/prensas/{press.json()['id']}/calibracao",
                          files={'file':('teste-calibracao.pdf',sample,'application/pdf')},timeout=20)
    assert uploaded.status_code==200,uploaded.text[:200]
    fetched=ricardo.get(URL+f"api/prensas/{press.json()['id']}/calibracao",timeout=20)
    assert fetched.status_code==200 and fetched.content==sample
    print('protected calibration PDF upload/download: OK')
    blocked_id=create(ricardo,body(cfg,press.json()['id'],'TESTE PRENSA VENCIDA'))
    blocked=issue(ricardo,blocked_id)
    assert blocked.status_code==422 and 'vencida' in blocked.text
    print('expired calibration blocks issue: OK')

    a=create(ricardo,body(cfg,press_id,'TESTE CONCORRÊNCIA A'))
    b=create(ricardo,body(cfg,press_id,'TESTE CONCORRÊNCIA B'))
    def concurrent(cert):
        s=requests.Session();s.cookies.set('unificado_homolog_laboratorio_session',token,
                            domain='concrefer.concretrack.com.br',path='/unificado/laboratorio/')
        s.headers.update({'Origin':BASE})
        return issue(s,cert)
    with ThreadPoolExecutor(max_workers=2) as pool:
        first,second=list(pool.map(concurrent,(a,b)))
    assert first.status_code==second.status_code==200,(first.text[:200],second.text[:200])
    assert first.json()['numero']!=second.json()['numero']
    print('concurrent numbering:',first.json()['numero'],second.json()['numero'])


if __name__=='__main__':main()
