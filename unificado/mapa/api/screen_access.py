"""Per-screen visibility for the unified copy; business roles remain authoritative."""
from __future__ import annotations

import json
from pathlib import Path
from urllib.parse import parse_qs, urlsplit


CATALOG = json.loads((Path(__file__).parent / 'screen_catalog.json').read_text(encoding='utf-8'))
BY_ID = {row['id']: row for row in CATALOG}
MASTER_USER_ID = 'user-ricardo'
MASTER_USER_IDS = frozenset({MASTER_USER_ID, 'marcelo', 'alex', 'alex51', 'philippe'})
DEFAULT_LAB_USERS = frozenset({'user-ricardo', 'ricardo.teste', 'user-alex'})
GUEST_FORBIDDEN_SCREENS = frozenset({'prodUsuarios', 'pcpUsuarios', 'labUsuarios'})
MAPA_ROLE_MODES = {
    'GERENCIA': {row['screen'] for row in CATALOG if row['module'] == 'producao'},
    'GESTOR': {'PROD_ANALISE','LIBERACAO','LIBERACAO_S1','LIBERACAO_S2',
               'LIBERACAO_S3','LIBERACAO_S4','MONTAGEM_POSTES','MONTAGEM_INDICADORES',
               'DASHBOARD_DEFEITOS','RELATORIO','HISTORICO','ACMP_CONCRETAGEM',
               'SEQUENCIA_S3','MANDRIL_CIRCULAR','RELATORIO_MANUTENCAO','TRATATIVA_DEFEITOS',
               'FECHAMENTO_DIARIO'},
    'MONTADOR': {'INSPECAO','MONTAGEM_POSTES','SEQUENCIA_S3',
                 'RELATORIO_MANUTENCAO','TRATATIVA_DEFEITOS'},
    'APONTADOR': {'LIBERACAO_S1','LIBERACAO_S2','LIBERACAO_S3','LIBERACAO_S4',
                  'MANDRIL_CIRCULAR','RELATORIO_MANUTENCAO','TRATATIVA_DEFEITOS'},
}


def role_allows(user, screen, planning_role=None, lab_users=frozenset()):
    if screen['id'] == 'labCartaTraco':
        return user['id'] in MASTER_USER_IDS or user['id'] in lab_users
    if screen['id'] == 'usinasCartaTraco':
        return user['id'] in MASTER_USER_IDS
    if user['id'] in MASTER_USER_IDS:
        return True
    if screen['id'] == 'tvFormas':
        return bool(user.get('id'))
    module = screen['module']
    if screen['id'].startswith('cronoanalise.'):
        return bool(user.get('id'))
    if module == 'laboratorio':
        return user['id'] in lab_users
    if module == 'qualidade':
        return bool(user.get('id'))
    if module == 'usinas':
        return False  # liberado inicialmente apenas aos administradores master acima
    if module == 'suprimentos':
        return bool(user.get('id'))  # a concessão individual e o papel na API continuam obrigatórios
    if module == 'planejamento':
        if not planning_role:
            return False
        required = screen['require']
        if required == 'ADMIN':
            return planning_role == 'ADMIN'
        if required == 'PCP':
            return planning_role in {'ADMIN', 'PCP'}
        if required == 'PRODUCAO':
            return planning_role != 'CONSULTA'
        return True
    if screen['id'].startswith(('pdr', 'rbr')):
        return bool(planning_role)
    mode = screen['screen']
    if mode in MAPA_ROLE_MODES.get(user['perfil'], set()):
        return True
    if user['id'].casefold() == 'diegobat' and mode in {'MANDRIL_CIRCULAR','INSPECAO'}:
        return True
    if user['id'].casefold() == 'cgomes' and mode == 'MANDRIL_CIRCULAR':
        return True
    return mode == 'USUARIOS' and user['nome'].strip().casefold() == 'ricardo'


def allowed_screens(user, planning_role, overrides, lab_users):
    if user['id'] in MASTER_USER_IDS:
        return [row['id'] for row in CATALOG]
    if user['perfil'] == 'CONVIDADO':
        return [row['id'] for row in CATALOG if row['id'] not in GUEST_FORBIDDEN_SCREENS
                and row['id'] != 'labCartaTraco'
                and overrides.get(row['id']) is True
                and (row['module'] != 'planejamento' or
                     role_allows(user, row, planning_role, lab_users))]
    allowed = [row['id'] for row in CATALOG if role_allows(user, row, planning_role, lab_users)
            and overrides.get(row['id'],
                              False if row['id'].startswith(('pdr', 'rbr')) else
                              row['module'] not in {'laboratorio', 'qualidade', 'suprimentos'} and row['id'] != 'tvFormas'
                              or row['module'] == 'laboratorio' and user['id'] in DEFAULT_LAB_USERS
                              and not row['id'].startswith('cronoanalise.'))]
    if (overrides.get('labUsinasRelatorios') is not False
            and 'labUsinasRelatorios' not in allowed
            and any(BY_ID[item]['module'] == 'laboratorio' for item in allowed)):
        allowed.append('labUsinasRelatorios')
    if ('qualidadePainel' in allowed and 'qualidadeResultadosBancada' not in allowed
            and overrides.get('qualidadeResultadosBancada') is not False):
        allowed.append('qualidadeResultadosBancada')
    return allowed


def screen_for_uri(original_uri, screen_header=''):
    uri = urlsplit(original_uri)
    path = uri.path.replace('index.html', '')
    query = parse_qs(uri.query)
    if (path.startswith('/unificado/laboratorio/carta-traco/') or
            path.startswith('/unificado/mapa/api/laboratorio/carta-traco/')):
        return BY_ID.get('labCartaTraco')
    if path.startswith('/unificado/laboratorio/cec-api/'):
        return BY_ID.get('labCec')
    if path.startswith('/unificado/laboratorio/cec/rompimentos-mes/'):
        return BY_ID.get('labCec')
    if path.rstrip('/') == '/unificado/laboratorio/cec/resultados':
        return BY_ID.get('labCecResultados')
    if path.rstrip('/') == '/unificado/laboratorio/cec/relatorio':
        return BY_ID.get('labCecRelatorio')
    if path.startswith('/unificado/laboratorio/dosagem/'):
        return BY_ID.get('labDosagem')
    if path.startswith('/unificado/laboratorio/certificados-qualidade/'):
        return BY_ID.get('labCertificados')
    if path.startswith('/unificado/laboratorio/usinas-relatorios/'):
        return BY_ID.get('labUsinasRelatorios')
    if path.startswith('/unificado/laboratorio/slump/'):
        return BY_ID.get('labSlump')
    if path in {'/unificado/relatorios/fechamento-diario/',
                '/unificado/relatorios/api/fechamento-diario'}:
        return BY_ID.get('fechamentoDiario')
    if path == '/unificado/pcp/fechamento-diario/data.json':
        return BY_ID.get('fechamentoDiarioPcp')
    if path == '/unificado/m/inspecao/' or path == '/unificado/m/inspecao/login.html':
        return BY_ID.get('inspecao') if path == '/unificado/m/inspecao/' else None
    if path == '/unificado/tv/formas/' or path == '/unificado/tv/formas/tv.js':
        return BY_ID.get('tvFormas')
    if path == '/unificado/painel-tv/api/resumo':
        return BY_ID.get('tvFormas')
    if path == '/unificado/mapa/operacao/':
        mode = query.get('tela', ['LIBERACAO'])[0]
        return next((row for row in CATALOG if row['module'] == 'producao'
                     and row['screen'] == mode), None)
    if path.startswith('/unificado/producao/pederneiras/'):
        if path.startswith('/unificado/producao/pederneiras/mao-de-obra/app/'):
            return BY_ID.get('pdrMaoDeObra')
        if path.startswith('/unificado/producao/pederneiras/app/'):
            return BY_ID.get('pdrApontamento')
        if path == '/unificado/producao/pederneiras/':
            tab = query.get('tab', ['apontamento'])[0]
            return next((row for row in CATALOG
                         if row['id'].startswith('pdr')
                         and parse_qs(row['query'].lstrip('?')).get('tab') == [tab]), None)
        return None
    if path.startswith('/unificado/producao/ribeirao/'):
        if path.startswith('/unificado/producao/ribeirao/mao-de-obra/app/'):
            return BY_ID.get('rbrMaoDeObra')
        if path.startswith('/unificado/producao/ribeirao/app/'):
            return BY_ID.get('rbrApontamento')
        if path == '/unificado/producao/ribeirao/':
            tab = query.get('tab', ['apontamento'])[0]
            return next((row for row in CATALOG
                         if row['id'].startswith('rbr')
                         and parse_qs(row['query'].lstrip('?')).get('tab') == [tab]), None)
        return None
    if path.startswith('/unificado/pcp/') and not path.startswith('/unificado/pcp/api/'):
        return next((row for row in CATALOG if row['module'] == 'planejamento'
                     and row['path'] == path), None)
    if path.startswith('/unificado/laboratorio/') and not path.startswith('/unificado/laboratorio/api/'):
        for row in CATALOG:
            if row['module'] != 'laboratorio' or row['path'].rstrip('/') != path.rstrip('/'):
                continue
            expected = parse_qs(row['query'].lstrip('?'))
            if all(query.get(key) == value for key, value in expected.items()) and (
                expected or not query
            ):
                return row
        return None
    if path.startswith('/unificado/qualidade/') and not path.startswith('/unificado/qualidade/api/'):
        if path.startswith('/unificado/qualidade/nc/'):
            return BY_ID.get('qualidadeTratativa')
        return next((row for row in CATALOG if row['module'] == 'qualidade'
                     and row['path'].rstrip('/') == path.rstrip('/')), None)
    if path.startswith('/unificado/suprimentos/'):
        if path.startswith('/unificado/suprimentos/pwa/'):
            return BY_ID.get('suprimentosSolicitacoes')
        if path.startswith('/unificado/suprimentos/solicitacao/'):
            return BY_ID.get('suprimentosSolicitacoes')
        return next((row for row in CATALOG if row['module'] == 'suprimentos'
                     and row['path'].rstrip('/') == path.rstrip('/')), None)
    if path == '/unificado/usinas/':
        return BY_ID.get('usinasInicio')
    if path == '/unificado/usinas/carta-traco.html':
        return BY_ID.get('usinasCartaTraco')
    if path.startswith('/unificado/pcp/api/usuarios'):
        return BY_ID['pcpUsuarios'] if screen_header == 'pcpUsuarios' else None
    if screen_header in BY_ID:
        candidate = BY_ID[screen_header]
        expected = {'planejamento':'/unificado/pcp/', 'producao':'/unificado/mapa/',
                    'laboratorio':'/unificado/laboratorio/',
                    'qualidade':'/unificado/qualidade/',
                    'usinas':'/unificado/usinas/',
                    'suprimentos':'/unificado/suprimentos/'}[candidate['module']]
        return candidate if path.startswith(expected) else None
    if path.startswith('/unificado/mapa/api/'):
        if screen_header in {'INSPECAO_DETALHE','MONTAGEM_POSTES_DETALHE'}:
            screen_header = screen_header.replace('_DETALHE', '')
        return next((row for row in CATALOG if row['module'] == 'producao'
                     and row['screen'] == screen_header), None)
    if path.startswith('/unificado/pcp/api/'):
        if path == '/unificado/pcp/api/dashboard':
            return BY_ID['dashboard']
        return None
    if path.startswith('/unificado/laboratorio/api/'):
        if path == '/unificado/laboratorio/api/slump' or path.startswith('/unificado/laboratorio/api/slump/'):
            return BY_ID['labSlump']
        if path.startswith('/unificado/laboratorio/api/laboratorio/cronoanalise/'):
            return None  # the Cronoanalise router checks its signed actions per endpoint
        if '/auth/users' in path:
            return BY_ID['labUsuarios']
        if '/absorcao/' in path:
            return BY_ID['labAbsorption']
        if '/criterios' in path:
            return BY_ID['labCriteria']
        if '/equipamentos' in path or '/responsaveis' in path:
            return BY_ID['labRegisters']
        if '/ensaios' in path or '/postes' in path:
            return BY_ID['labPole']
        return BY_ID['labMonitor']
    return None
