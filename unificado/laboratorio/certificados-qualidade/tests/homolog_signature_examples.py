"""Issue clearly marked test certificates on :18446 and inspect PDF signatures."""
from __future__ import annotations

import hashlib
import json
import subprocess
from datetime import date
from io import BytesIO
from pathlib import Path

import pymupdf
import requests
from pypdf import PdfReader

from homolog_flow import REMOTE


BASE = 'https://concrefer.concretrack.com.br:18446'
ROOT = Path(__file__).resolve().parents[4]
EXAMPLES = ROOT / 'docs/certificado-qualidade/exemplos'
EVIDENCE = ROOT / 'docs/certificado-qualidade/evidencias'


def pdf_observation(data: bytes, *, expanded: bool) -> dict:
    doc = pymupdf.open(stream=data, filetype='pdf')
    assert len(doc) == 1
    page = doc[0]
    line_y = float(page.rect.height) - (128 if expanded else 85)
    lines = []
    for drawing in page.get_drawings():
        for segment in drawing['items']:
            if segment[0] != 'l':
                continue
            a, b = segment[1:3]
            if (abs(a.y - b.y) < .5 and abs(a.y - line_y) < 1
                    and abs(a.x - b.x) > 150):
                lines.append([round(min(a.x, b.x), 2), round(a.y, 2),
                              round(max(a.x, b.x), 2)])
    images = []
    for info in page.get_image_info(xrefs=True):
        rect = pymupdf.Rect(info['bbox'])
        if rect.x0 > page.rect.width / 2 and rect.y0 > 600:
            images.append([round(rect.x0, 2), round(rect.y0, 2),
                           round(rect.x1, 2), round(rect.y1, 2)])
    return {'pages': len(doc), 'line_y_pt': round(line_y, 2),
            'signature_lines_pt': sorted(lines), 'signature_images_pt': images}


def main():
    token = subprocess.run(
        ['ssh', 'vps-concrefer',
         '/opt/concrefer-unificado/homolog-next/mapa-api/.venv/bin/python', '-'],
        input=REMOTE, text=True, capture_output=True, check=True).stdout.strip()
    session = requests.Session()
    session.cookies.set('mapa_unificado_homolog_session', token,
                        domain='concrefer.concretrack.com.br', path='/unificado/')
    assert session.post(BASE+'/unificado/mapa/api/unified/laboratorio-bootstrap',
                        timeout=15).status_code == 200
    api = BASE+'/unificado/laboratorio/certificados-qualidade/api/'
    config = session.get(api+'config', timeout=15).json()
    assert config['fonte_cp'] == 'novo'
    model = min(config['models'], key=lambda row: len(row['modelo']))

    # The API has no separate test flag. All identifying fields mark this press
    # as a homologation-only fixture, and the environment is isolated from prod.
    series = 'TESTE-CQ-ASSINATURA-20261024'
    existing = next((press for press in config['presses']
                     if press['serie'] == series), None)
    if existing:
        press_id = existing['id']
        assert existing['laboratorio_rbc'] == 'TESTE HOMOLOGAÇÃO'
    else:
        press = {
            'fabricante': 'TESTE HOMOLOGAÇÃO',
            'modelo': 'TESTE',
            'serie': series,
            'patrimonio': '', 'capacidade_kn': None, 'classe': '',
            'certificado_calibracao': 'TESTE',
            'laboratorio_rbc': 'TESTE HOMOLOGAÇÃO',
            'data_calibracao': '2026-10-24', 'validade': '2027-10-24',
            'ativa': True,
        }
        response = session.post(api+'prensas', json=press,
                                headers={'Origin': BASE}, timeout=20)
        assert response.status_code == 200, response.text[:300]
        press_id = response.json()['id']

    audit = json.loads((EVIDENCE/'comparacao-fontes-20261024.json').read_text(encoding='utf8'))
    days = [row['data'] for row in audit['gate_10_datas']]
    assert len(days) == 10
    history = session.get(api+'certificados',
                          params={'q': 'TESTE HOMOLOGAÇÃO - ASSINATURA'}, timeout=15)
    assert history.status_code == 200
    previous = {}
    for row in history.json():
        detail = session.get(api+f'certificados/{row["id"]}', timeout=15).json()
        if detail['certificado']['prensa_snapshot'].get('id') == press_id:
            previous[len(detail['itens'])] = detail['certificado']
    records = []
    for count in (3, 10):
        body = {
            'cliente': 'TESTE HOMOLOGAÇÃO - ASSINATURA - SEM VALOR COMERCIAL',
            'endereco': 'Ambiente de homologação :18446',
            'nota_fiscal': 'TESTE - SEM NF',
            'data_emissao': date.today().isoformat(),
            'resp_laboratorio': 'Ricardo Do Amaral',
            'observacoes': 'Teste visual da assinatura; sem valor comercial.',
            'prensa_id': press_id,
            'itens': [
                {'modelo': model['modelo'], 'altura_m': model['altura_m'],
                 'carga_dan': model['carga_dan'], 'peso_kg': model['peso_kg'],
                 'quantidade': 1, 'data_producao': day}
                for day in days[:count]
            ],
        }
        checked = session.post(api+'resultados', json=body,
                               headers={'Origin': BASE}, timeout=30)
        assert checked.status_code == 200, checked.text[:300]
        assert all(row['resultado'] == 'conforme' for row in checked.json()['rows'])
        prior = previous.get(count)
        if prior:
            cert_id = prior['id']
            if prior['status'] == 'rascunho':
                refreshed = session.put(api+f'certificados/{cert_id}', json=body,
                                        headers={'Origin': BASE}, timeout=20)
                assert refreshed.status_code == 200, refreshed.text[:300]
            else:
                assert prior['status'] == 'emitido'
        else:
            draft = session.post(api+'certificados', json=body,
                                 headers={'Origin': BASE}, timeout=20)
            assert draft.status_code == 200, draft.text[:300]
            cert_id = draft.json()['id']
        draft_path = EXAMPLES/f'homolog-assinatura-rascunho-{count}-datas-id{cert_id}.pdf'
        if prior and prior['status'] == 'emitido':
            draft_data = draft_path.read_bytes()
        else:
            draft_pdf = session.get(api+f'certificados/{cert_id}/pdf', timeout=30)
            assert draft_pdf.status_code == 200 and draft_pdf.content.startswith(b'%PDF-')
            draft_data = draft_pdf.content
        draft_obs = pdf_observation(draft_data, expanded=count <= 5)
        assert len(draft_obs['signature_lines_pt']) == 2
        assert len(draft_obs['signature_images_pt']) == 1
        draft_path.write_bytes(draft_data)
        pymupdf.open(stream=draft_data, filetype='pdf')[0].get_pixmap(
            matrix=pymupdf.Matrix(2, 2), alpha=False).save(draft_path.with_suffix('.png'))

        if prior and prior['status'] == 'emitido':
            issue_data = {'numero': prior['numero'], 'pdf_hash': prior['pdf_hash']}
        else:
            issued = session.post(api+f'certificados/{cert_id}/emitir', json={},
                                  headers={'Origin': BASE}, timeout=40)
            assert issued.status_code == 200, issued.text[:300]
            issue_data = issued.json()
        number = issue_data['numero']
        pdf = session.get(api+f'certificados/{cert_id}/pdf', timeout=30)
        assert pdf.status_code == 200 and pdf.content.startswith(b'%PDF-')
        assert hashlib.sha256(pdf.content).hexdigest() == issue_data['pdf_hash']
        assert len(PdfReader(BytesIO(pdf.content)).pages) == 1
        observation = pdf_observation(pdf.content, expanded=count <= 5)
        assert len(observation['signature_lines_pt']) == 2
        assert len(observation['signature_images_pt']) == 1
        assert abs(observation['signature_lines_pt'][0][1]
                   - observation['signature_lines_pt'][1][1]) < .5
        image = observation['signature_images_pt'][0]
        assert image[3] < observation['line_y_pt']
        observation['signature_height_96dpi_px'] = round((image[3]-image[1])*96/72, 1)
        expected_px = 72 if count <= 5 else 49.3
        assert abs(observation['signature_height_96dpi_px']-expected_px) < 4
        path = EXAMPLES/f'homolog-assinatura-{count}-datas-{number}.pdf'
        path.write_bytes(pdf.content)
        pymupdf.open(stream=pdf.content, filetype='pdf')[0].get_pixmap(
            matrix=pymupdf.Matrix(2, 2), alpha=False).save(path.with_suffix('.png'))
        records.append({'datas': count, 'prensa_teste_id': press_id,
                        'certificado_id': cert_id, 'numero': number,
                        'rascunho': draft_path.relative_to(ROOT).as_posix(),
                        'emitido': path.relative_to(ROOT).as_posix(),
                        'rascunho_medidas': draft_obs,
                        'emitido_medidas': observation})
    target = EVIDENCE/'assinatura-homolog-20261024.json'
    target.write_text(json.dumps(records, ensure_ascii=False, indent=2)+'\n', encoding='utf8')
    print(json.dumps(records, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
