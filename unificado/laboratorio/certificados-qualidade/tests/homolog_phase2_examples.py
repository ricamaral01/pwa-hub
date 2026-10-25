"""Three one-page preview certificates with real new-source CP data on :18446."""
import json
import os
import subprocess
from datetime import date
from io import BytesIO
from pathlib import Path

import requests
from pypdf import PdfReader

from homolog_flow import REMOTE


def main():
    base='https://concrefer.concretrack.com.br:18446'
    proc=subprocess.run(['ssh','vps-concrefer','/opt/concrefer-unificado/homolog-next/mapa-api/.venv/bin/python','-'],
                        input=REMOTE,text=True,capture_output=True,check=True)
    session=requests.Session()
    session.cookies.set('mapa_unificado_homolog_session',proc.stdout.strip(),
                        domain='concrefer.concretrack.com.br',path='/unificado/')
    assert session.post(base+'/unificado/mapa/api/unified/laboratorio-bootstrap',timeout=15).status_code==200
    url=base+'/unificado/laboratorio/certificados-qualidade/'
    cfg=session.get(url+'api/config',timeout=15).json()
    assert cfg['fonte_cp']=='novo',cfg.get('fonte_cp')
    model=min(cfg['models'],key=lambda row:len(row['modelo']))
    assert cfg['presses']
    press_id=cfg['presses'][0]['id']
    audit=json.loads((Path(__file__).resolve().parents[4]/'docs/certificado-qualidade/evidencias/comparacao-fontes-20261024.json').read_text(encoding='utf8'))
    days=[row['data'] for row in audit['gate_10_datas']]
    folder=Path(__file__).resolve().parents[4]/'docs/certificado-qualidade/exemplos'
    records=[]
    for count in (1,3,10):
        body={'cliente':'HOMOLOGAÇÃO · EXEMPLO PARA CONFERÊNCIA','endereco':'Campinas/SP',
              'nota_fiscal':'EXEMPLO, SEM VALOR COMERCIAL','data_emissao':date.today().isoformat(),
              'resp_laboratorio':'Ricardo Do Amaral','prensa_id':press_id,
              'itens':[{'modelo':model['modelo'],'altura_m':model['altura_m'],
                        'carga_dan':model['carga_dan'],'peso_kg':model['peso_kg'],
                        'quantidade':1,'data_producao':day} for day in days[:count]]}
        checked=session.post(url+'api/resultados',json=body,headers={'Origin':base},timeout=25)
        assert checked.status_code==200,checked.text[:200]
        rows=checked.json()['rows']
        assert len(rows)==count and all(row['resultado']=='conforme' for row in rows)
        draft=session.post(url+'api/certificados',json=body,headers={'Origin':base},timeout=20)
        assert draft.status_code==200,draft.text[:200]
        cert_id=draft.json()['id']
        pdf=session.get(url+f'api/certificados/{cert_id}/pdf',timeout=25)
        assert pdf.status_code==200 and pdf.content.startswith(b'%PDF-')
        assert len(PdfReader(BytesIO(pdf.content)).pages)==1
        filename=f'fase2-homolog-rascunho-{count}-datas-id{cert_id}.pdf'
        (folder/filename).write_bytes(pdf.content)
        records.append({'datas':count,'id':cert_id,'pdf':filename,'paginas':1})
        if count==1:
            issue=session.post(url+f'api/certificados/{cert_id}/emitir',json={},headers={'Origin':base},timeout=25)
            assert issue.status_code==422 and 'laboratório calibrador' in issue.text,issue.text[:300]
    print(json.dumps(records,ensure_ascii=False))


if __name__=='__main__':main()
