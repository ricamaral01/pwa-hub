"""Read-only authenticated smoke for production configuration."""

import subprocess

import requests

from homolog_flow import REMOTE


BASE = 'https://concrefer.concretrack.com.br'
URL = BASE + '/unificado/laboratorio/certificados-qualidade/'


def main():
    remote = REMOTE.replace('/etc/concrefer-unificado/homolog/mapa-auth.env',
                            '/etc/mapa-unificado/auth.env')
    result = subprocess.run(
        ['ssh', 'vps-concrefer', '/opt/concrefer-unificado/mapa-api/.venv/bin/python', '-'],
        input=remote, text=True, capture_output=True, check=True)
    session = requests.Session()
    session.cookies.set('mapa_unificado_session', result.stdout.strip(),
                        domain='concrefer.concretrack.com.br', path='/unificado/')
    response = session.post(BASE + '/unificado/mapa/api/unified/laboratorio-bootstrap', timeout=15)
    assert response.status_code == 200, ('bootstrap', response.status_code)
    page = session.get(URL, timeout=15)
    assert page.status_code == 200 and 'Emitir certificado' in page.text, ('page', page.status_code)
    response = session.get(URL + 'api/config', timeout=15)
    assert response.status_code == 200, ('config', response.status_code, response.text[:300])
    config = response.json()
    assert config['fonte_cp'] == 'novo'
    assert config['responsaveis_laboratorio'] == ['Ricardo Do Amaral', 'Philippe Augusto']
    assert config['params']['resp_laboratorio_padrao'] in config['responsaveis_laboratorio']
    assert len(config['presses']) == 1
    assert not config['presses'][0]['fabricante'].upper().startswith('TESTE')
    print('Production bootstrap/page/config: 200; CP source: novo; '
          'responsible default: {}; presses: 1'.format(config['params']['resp_laboratorio_padrao']))
    print('RBC status: {}'.format(config['presses'][0]['laboratorio_rbc']))


if __name__ == '__main__':
    main()
