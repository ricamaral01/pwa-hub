import sys
from datetime import date,timedelta
from pathlib import Path

import pytest
from pypdf import PdfReader

sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from core import can_issue,summarize_day,validate_items
from report import make_pdf


def cp(day, trace, age, value, index=1):
    return dict(data_moldagem=day,traco_id=trace,idade_dias=age,mpa=value,cp=index)


def test_strict_fck_and_highest_trace():
    day='2026-07-07'
    rows=[cp(day,'a',28,35),cp(day,'b',28,40),cp(day,'b',28,42,2),cp(day,'b',7,29)]
    result=summarize_day(day,rows,35)
    assert result['traco']=='b' and result['r28_media']==41
    assert result['n_cps']==2 and result['resultado']=='conforme'
    assert summarize_day(day,[cp(day,'a',28,35)],35)['resultado']=='nao_conforme'


def test_missing_and_pending():
    day='2026-07-07'
    assert summarize_day(day,[],35)['resultado']=='sem_resultado'
    pending=summarize_day(day,[cp(day,'a',7,20)],35)
    assert pending['resultado']=='aguardando_28_dias'
    assert pending['data_prevista']=='2026-08-04'
    assert not can_issue([pending])


@pytest.mark.parametrize('count',[1,5,6,10])
def test_a4_one_page(count):
    start=date(2026,7,1)
    items=[];results=[]
    for i in range(count):
        day=(start+timedelta(days=i)).isoformat()
        items.append(dict(modelo='DT 11/300',altura_m=11,carga_dan=300,peso_kg=500,quantidade=1,data_producao=day))
        results.append(dict(data_producao=day,n_cps=2,r3_media=20,r7_media=30,r28_media=44,r28_min=43,resultado='conforme'))
    cert=dict(numero='CQ-2026-0001',cliente='Cliente Exemplo',endereco='Campinas',nota_fiscal='123',
              data_emissao=start,resp_laboratorio='Ricardo Do Amaral',fck_mpa=35,
              prensa_snapshot=dict(fabricante='Emic',modelo='PC100C',serie='123',certificado_calibracao='A1',validade='2027-01-01'))
    pdf=make_pdf(cert,items,results,issued=False)
    assert len(PdfReader(__import__('io').BytesIO(pdf)).pages)==1
    assert b'RASCUNHO' not in pdf  # text is compressed; extraction below is authoritative
    assert 'RASCUNHO' in PdfReader(__import__('io').BytesIO(pdf)).pages[0].extract_text()


def test_more_than_ten_dates_rejected():
    items=[dict(modelo='DT',quantidade=1,data_producao=(date(2026,7,1)+timedelta(days=i)).isoformat()) for i in range(11)]
    with pytest.raises(ValueError,match='10 datas'):validate_items(items)
