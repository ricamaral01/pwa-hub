"""Attach the verified GED calibration PDF and set Ricardo as default.

Usage: python tests/configure_ged_press.py homolog|production PATH_TO_GED_PDF
No certificate is issued by this script.
"""

import hashlib
import io
import subprocess
import sys
from pathlib import Path

import requests
from pypdf import PdfReader

from homolog_flow import REMOTE


HOST = 'concrefer.concretrack.com.br'
PREFIX = '/unificado/laboratorio/certificados-qualidade/'


def session(environment):
    homolog = environment == 'homolog'
    base = 'https://' + HOST + (':18446' if homolog else '')
    remote = REMOTE if homolog else REMOTE.replace(
        '/etc/concrefer-unificado/homolog/mapa-auth.env',
        '/etc/mapa-unificado/auth.env')
    python = ('/opt/concrefer-unificado/homolog-next/mapa-api/.venv/bin/python'
              if homolog else '/opt/concrefer-unificado/mapa-api/.venv/bin/python')
    token = subprocess.run(['ssh', 'vps-concrefer', python, '-'], input=remote,
                           text=True, capture_output=True, check=True).stdout.strip()
    s = requests.Session()
    s.cookies.set('mapa_unificado_homolog_session' if homolog else 'mapa_unificado_session',
                  token, domain=HOST, path='/unificado/')
    response = s.post(base + '/unificado/mapa/api/unified/laboratorio-bootstrap', timeout=20)
    assert response.status_code == 200, ('bootstrap', response.status_code)
    s.headers['Origin'] = base
    return s, base + PREFIX


def main(environment, path):
    if environment not in ('homolog', 'production'):
        raise SystemExit('Use homolog or production.')
    pdf = Path(path).read_bytes()
    assert pdf.startswith(b'%PDF-') and len(pdf) < 8 * 1024 * 1024
    assert len(PdfReader(io.BytesIO(pdf)).pages) == 1
    text = PdfReader(io.BytesIO(pdf)).pages[0].extract_text()
    for marker in ('M-0397/26', 'Técnica Paraíso Ltda - EPP', 'AMC', '2TQC'):
        assert marker in text, marker
    s, url = session(environment)
    response = s.get(url + 'api/config', timeout=20)
    assert response.status_code == 200, ('config', response.status_code)
    config = response.json()
    matches = [press for press in config['presses']
               if press['fabricante'] == 'AMC' and press['modelo'] == '2TQC'
               and press['patrimonio'] == '2TQC-226'
               and press['certificado_calibracao'] == 'M-0397/26']
    assert len(matches) == 1, ('AMC press count', len(matches))
    press = matches[0]
    for key, value in {
        'serie': 'S/N', 'laboratorio_rbc': 'Técnica Paraíso Ltda - EPP',
        'data_calibracao': '2026-07-10', 'validade': '2027-07-10'
    }.items():
        actual = str(press[key])[:10] if key in ('data_calibracao', 'validade') else press[key]
        assert actual == value, (key, press[key])
    assert float(press['capacidade_kn']) == 1000
    if not press['arquivo_certificado']:
        upload = s.post(url + f"api/prensas/{press['id']}/calibracao",
                        files={'file': ('M-0397-26-AMC-2TQC.pdf', pdf, 'application/pdf')},
                        timeout=30)
        assert upload.status_code == 200, ('upload', upload.status_code, upload.text[:200])
    saved = s.get(url + f"api/prensas/{press['id']}/calibracao", timeout=20)
    assert saved.status_code == 200 and saved.content == pdf, ('stored PDF mismatch', saved.status_code)
    if config['params']['resp_laboratorio_padrao'] != 'Ricardo Do Amaral':
        response = s.post(url + 'api/parametros', params={
            'fck_mpa': config['params']['fck_mpa'],
            'observacoes': config['params']['observacoes'],
            'resp_laboratorio_padrao': 'Ricardo Do Amaral'
        }, json={}, timeout=20)
        assert response.status_code == 200, ('responsible', response.status_code, response.text[:200])
    final = s.get(url + 'api/config', timeout=20).json()
    assert final['params']['resp_laboratorio_padrao'] == 'Ricardo Do Amaral'
    assert len([p for p in final['presses'] if p['id'] == press['id'] and p['arquivo_certificado']]) == 1
    print(f'{environment}: AMC press #{press["id"]}, GED PDF SHA-256 {hashlib.sha256(pdf).hexdigest()}, '
          'Ricardo Do Amaral default; no certificate issued')


if __name__ == '__main__':
    if len(sys.argv) != 3:
        raise SystemExit(__doc__)
    main(sys.argv[1], sys.argv[2])
