"""Open and treat one identified NC using the isolated test origin."""
import json, requests
from datetime import datetime, timezone, date
from pathlib import Path
from homolog_session import test_cookie_for

BASE = 'https://concrefer.concretrack.com.br:18446'
s = requests.Session()
s.cookies.set('mapa_unificado_homolog_session', test_cookie_for('user-ricardo'),
              domain='concrefer.concretrack.com.br', path='/unificado/')
trace = []
def call(method, path, body=None):
    response = s.request(method, BASE + '/unificado/qualidade/api' + path,
                         json=body, headers={'Origin': BASE}, timeout=35)
    trace.append({'method': method, 'path': path, 'status': response.status_code})
    assert response.status_code in (200, 201), (path, response.status_code, response.text[:500])
    return response.json()

ctx = call('GET', '/contexto')
unit = next(u for u in ctx['units'] if u['codigo'] == 'campinas')
catalog = call('GET', '/catalogos?company=' + unit['empresa_id'] + '&unit=campinas')
label = 'HOMOLOG VISUAL F6 ' + datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')
nc = call('POST', '/nc/rascunhos', {'empresa_id': unit['empresa_id'], 'unidade_codigo': 'campinas',
          'titulo': label, 'descricao': label + ' — ocorrência identificada de teste, sem produto real.',
          'origem_id': catalog['origem'][0]['id'], 'area_emissora_id': catalog['area'][0]['id']})
prefix = '/nc/' + nc['id']
registered = call('POST', prefix + '/registrar', {'mobile': True})
call('POST', prefix + '/triagem', {'gravidade_id': catalog['gravidade'][0]['id'],
     'tipo_id': catalog['tipo'][0]['id'], 'area_responsavel_id': catalog['area'][0]['id'],
     'responsavel_id': ctx['user']['id'], 'prazo_final': date.today().isoformat(),
     'observacoes': label})
disposition = next(d for d in catalog['disposicao'] if d['codigo'] != 'CONCESSAO')
call('POST', prefix + '/contencoes', {'disposicao_id': disposition['id'], 'descricao': label,
     'responsavel_texto': 'Teste de homologação'})
call('POST', prefix + '/concluir-contencao')
detail = call('GET', prefix)
assert detail['nc']['status'] == 'ANALISE_CAUSA'
assert detail['nc_contencao']
out = {'origin': BASE, 'label': label, 'nc_id': nc['id'], 'number': registered['numero'],
       'status': detail['nc']['status'], 'containment_persisted': True, 'trace': trace,
       'external_sends': 0, 'permissions_changed': False}
dest = Path(__file__).resolve().parents[2] / 'docs/revisao-visual-unificado/homolog/fase-6/qualidade-flow.json'
dest.write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding='utf-8')
print(json.dumps({'status': 'ok', 'number': registered['numero'], 'final_state': detail['nc']['status']}))
