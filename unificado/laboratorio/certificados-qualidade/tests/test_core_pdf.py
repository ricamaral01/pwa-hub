import sys
from datetime import date,timedelta
from pathlib import Path

import pytest
from PIL import Image
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
              prensa_snapshot=dict(fabricante='AMC',modelo='2TQC',serie='S/N',
                                    patrimonio='2TQC-226',capacidade_kn=1000,
                                    certificado_calibracao='M-0397/26',
                                    laboratorio_rbc='Técnica Paraíso Ltda - EPP',
                                    data_calibracao='2026-07-10',validade='2027-07-10'))
    pdf=make_pdf(cert,items,results,issued=False)
    assert len(PdfReader(__import__('io').BytesIO(pdf)).pages)==1
    assert b'RASCUNHO' not in pdf  # text is compressed; extraction below is authoritative
    assert 'RASCUNHO' in PdfReader(__import__('io').BytesIO(pdf)).pages[0].extract_text()


def test_more_than_ten_dates_rejected():
    items=[dict(modelo='DT',quantidade=1,data_producao=(date(2026,7,1)+timedelta(days=i)).isoformat()) for i in range(11)]
    with pytest.raises(ValueError,match='10 datas'):validate_items(items)


def test_pdf_approved_columns_number_format_and_verification_domain():
    day='2026-09-01'
    cert=dict(numero='CQ-2026-0146',revisao=2,cliente='Cliente Exemplo',
              endereco='Campinas/SP',nota_fiscal='NF 123',data_emissao=day,
              resp_laboratorio='Ricardo Do Amaral',fck_mpa=35,
              prensa_snapshot=dict(fabricante='AMC',modelo='2TQC',serie='S/N',
                                    certificado_calibracao='M-0397/26',
                                    laboratorio_rbc='Técnica Paraíso Ltda - EPP',
                                    data_calibracao='2026-07-10',validade='2027-07-10'))
    item=dict(modelo='DT 12/600',altura_m=12,carga_dan=600,peso_kg=1530,
              quantidade=6,data_producao=day)
    result=dict(data_producao=day,n_cps=2,r3_media=20.4,r7_media=27.9,
                r28_media=38.4,resultado='conforme')
    pdf=make_pdf(cert,[item],[result],issued=True,
                 verify_base='https://concrefer.concretrack.com.br')
    page=PdfReader(__import__('io').BytesIO(pdf)).pages[0]
    text=page.extract_text()
    assert float(page.mediabox.width) == pytest.approx(595.28, abs=.02)
    for expected in ('Postes de concreto armado', 'Altura', 'Carga', 'Peso',
                     'Data de', 'Lote', 'Total de postes', '1.530', 'CONFORME',
                     'Documento emitido eletronicamente',
                     'Empresa/laboratório calibrador: Técnica Paraíso Ltda - EPP',
                     'https://concrefer.concretrack.com.br/v/CQ-2026-0146'):
        assert expected in text
    assert 'Traço' not in text
    assert 'patrimônio' not in text and ' kN' not in text and 'classe' not in text
    cert['prensa_snapshot'].update(patrimonio='P-12',capacidade_kn=100,classe='1')
    filled=PdfReader(__import__('io').BytesIO(make_pdf(cert,[item],[result],issued=True))).pages[0].extract_text()
    assert 'patrimônio P-12' in filled and '100,0 kN' in filled and 'classe 1' in filled


def test_missing_weight_renders_dash():
    day='2026-09-01'
    cert=dict(numero=None,revisao=0,cliente='Cliente',endereco='Campinas',
              nota_fiscal='123',data_emissao=day,resp_laboratorio='Ricardo Do Amaral',
              fck_mpa=35,prensa_snapshot={})
    item=dict(modelo='C 10/300',altura_m=10,carga_dan=300,peso_kg=None,
              quantidade=1,data_producao=day)
    result=dict(data_producao=day,n_cps=2,r3_media=20,r7_media=30,
                r28_media=40,resultado='conforme')
    text=PdfReader(__import__('io').BytesIO(make_pdf(cert,[item],[result],issued=False))).pages[0].extract_text()
    assert '—' in text


def test_draft_pdf_includes_engineer_signature_and_remains_draft(tmp_path):
    signature=tmp_path/'assinatura.png'
    Image.new('RGB',(120,40),'white').save(signature)
    day='2026-10-01'
    cert=dict(numero=None,revisao=0,cliente='TESTE 1',endereco='Campinas',
              nota_fiscal='123456',data_emissao=day,resp_laboratorio='Ricardo Do Amaral',
              fck_mpa=35,prensa_snapshot={})
    item=dict(modelo='C 10/2500',altura_m=10,carga_dan=2500,peso_kg=None,
              quantidade=1,data_producao=day)
    result=dict(data_producao=day,n_cps=2,r3_media=32.9,r7_media=39.1,
                r28_media=None,resultado='aguardando_28_dias')
    page=PdfReader(__import__('io').BytesIO(make_pdf(
        cert,[item],[result],issued=False,signature_path=str(signature)))).pages[0]
    assert len(page.images)==1
    text=page.extract_text()
    assert 'RASCUNHO' in text
    assert 'Prévia de rascunho, sem validade comercial.' in text
    assert 'Gerente de Qualidade' in text
