"""Read-only CP selection and isolated test issuance on :18446."""
import json
import os
import subprocess
import sys
from datetime import date,timedelta
from io import BytesIO
from pathlib import Path

import requests
from pypdf import PdfReader

sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from core import summarize_day

BASE=os.getenv('CQ_HOMOLOG_BASE','https://concrefer.concretrack.com.br:18446')
REMOTE=r'''
import json
from pathlib import Path
import psycopg
from itsdangerous import URLSafeTimedSerializer
values={}
for line in Path('/etc/concrefer-unificado/homolog/mapa-auth.env').read_text().splitlines():
 if '=' in line and not line.startswith('#'):
  k,v=line.split('=',1);values[k]=v.strip().strip('"').strip("'")
with psycopg.connect(values['MAPA_AUTH_DATABASE_URL']) as conn:
 with conn.cursor() as cur:
  cur.execute("SELECT id,updated_at FROM public.usuarios WHERE id='user-ricardo' AND ativo")
  row=cur.fetchone()
print(URLSafeTimedSerializer(values['MAPA_AUTH_SIGNING_KEY'],salt='mapa-login-v1').dumps({'scope':'session','id':row[0],'updated_at':row[1].isoformat()}))
'''


def main():
    proc=subprocess.run(['ssh','vps-concrefer','/opt/concrefer-unificado/homolog-next/mapa-api/.venv/bin/python','-'],
                        input=REMOTE,text=True,capture_output=True,check=True)
    token=proc.stdout.strip()
    session=requests.Session()
    session.cookies.set('mapa_unificado_homolog_session',token,domain='concrefer.concretrack.com.br',path='/unificado/')
    bootstrap=session.post(BASE+'/unificado/mapa/api/unified/laboratorio-bootstrap',timeout=15)
    assert bootstrap.status_code==200,bootstrap.text[:200]
    url=BASE+'/unificado/laboratorio/certificados-qualidade/'
    home=session.get(url,timeout=15)
    assert home.status_code==200 and 'Emitir certificado' in home.text,(home.status_code,home.text[:100])
    config=session.get(url+'api/config',timeout=15)
    assert config.status_code==200,config.text[:300]
    print('authenticated page/config:',home.status_code,config.status_code)
    cfg=config.json()
    assert cfg['user']['id']=='user-ricardo' and cfg['can_correct']
    selected_model=min(cfg['models'],key=lambda row:len(row['modelo']))
    cp=requests.get('https://concretrack.com.br/api/controle-estatistico/rompimentos-grupos',
                    params={'data_inicio':'2026-06-01','data_fim':'2026-09-15','limit':1000},timeout=20).json()
    assert cp['success'] and not cp['pagination']['has_more']
    days=sorted({r['data_moldagem'] for r in cp['rows']})
    good=[d for d in days if summarize_day(d,cp['rows'],35)['resultado']=='conforme']
    assert len(good)>=10,len(good)
    if not cfg['presses']:
        press={'fabricante':'Kratos','modelo':'IK-14 A/P','serie':'2220879','patrimonio':'',
               'capacidade_kn':None,'classe':'','certificado_calibracao':'2354/26',
               'laboratorio_rbc':'Não informado no cadastro de origem',
               'data_calibracao':'2026-07-14','validade':'2027-07-14','ativa':True}
        response=session.post(url+'api/prensas',json=press,headers={'Origin':BASE},timeout=15)
        assert response.status_code==200,response.text[:300]
        press_id=response.json()['id']
    else:press_id=cfg['presses'][0]['id']
    examples=Path(__file__).resolve().parents[4]/'docs'/'certificado-qualidade'/'exemplos'
    examples.mkdir(parents=True,exist_ok=True)
    for count in (3,10):
        body={'cliente':'HOMOLOGAÇÃO · DADOS REAIS DE CP','endereco':'Campinas/SP',
              'nota_fiscal':'TESTE, SEM VALOR COMERCIAL','data_emissao':date.today().isoformat(),
              'resp_laboratorio':'Ricardo Do Amaral','observacoes':'Ensaio de homologação, sem valor comercial.',
              'prensa_id':press_id,
              'itens':[{'modelo':selected_model['modelo'],'altura_m':selected_model['altura_m'],
                        'carga_dan':selected_model['carga_dan'],'peso_kg':selected_model['peso_kg'],
                        'quantidade':1,'data_producao':day}
                       for day in good[:count]]}
        checked=session.post(url+'api/resultados',json=body,headers={'Origin':BASE},timeout=25)
        assert checked.status_code==200,checked.text[:300]
        assert all(row['resultado']=='conforme' for row in checked.json()['rows'])
        draft=session.post(url+'api/certificados',json=body,headers={'Origin':BASE},timeout=20)
        assert draft.status_code==200,draft.text[:300]
        cert_id=draft.json()['id']
        issued=session.post(url+f'api/certificados/{cert_id}/emitir',json={},headers={'Origin':BASE},timeout=30)
        assert issued.status_code==200,issued.text[:300]
        pdf=session.get(url+f'api/certificados/{cert_id}/pdf',timeout=25)
        assert pdf.status_code==200,pdf.text[:200] if not pdf.content.startswith(b'%PDF') else ''
        assert len(PdfReader(BytesIO(pdf.content)).pages)==1
        name=issued.json()['numero']
        (examples/f'homolog-{count}-datas-{name}.pdf').write_bytes(pdf.content)
        print(f'{count} dates: {name}; 1 page; {len(pdf.content)} bytes; {cert_id}')


if __name__=='__main__':main()
