"""Unit-scoped CEC permissions, evaluated by the central Uni session handler.

New unit screens require an explicit central screen grant. Existing PCP ADMIN
and missing user_units rows never imply a new unit. Alex's master access is an
explicit requirement; other masters follow the approved nominal screen grants.
"""
from urllib.parse import urlsplit

UNITS = {
    'pederneiras': {'name': 'Pederneiras', 'prefix': 'labPedeCec'},
    'ribeirao': {'name': 'Ribeirão Preto', 'prefix': 'labRibCec'},
}
ALEX_IDS = frozenset({'alex'})
SUFFIXES = ('', 'Etiquetas', 'Leitura', 'Resultados', 'RompimentosMes', 'Analise', 'Relatorio')


def unit_for_screen(screen_id):
    return next((unit for unit, meta in UNITS.items()
                 if screen_id.startswith(meta['prefix'])), None)


def unit_for_uri(uri):
    path = urlsplit(uri).path
    return next((unit for unit in UNITS
                 if path.startswith('/unificado/laboratorio/' + unit + '/')), None)


def filter_allowed(user, allowed, overrides, primary_unit=None, extra_units=(), homolog_aliases=False):
    """Only new screens change; old Campinas/Noroeste results remain identical."""
    scopes = set(extra_units)
    if primary_unit:
        scopes.add(primary_unit)
    result = []
    for screen_id in allowed:
        unit = unit_for_screen(screen_id)
        if not unit:
            result.append(screen_id)
        elif user['id'] in ALEX_IDS or homolog_aliases and user['id'] == 'user-alex':
            result.append(screen_id)
        elif (overrides.get(screen_id) is True
              and (not scopes or 'todos' in scopes or unit in scopes)):
            # The screen grant itself is explicit and scoped to this Lab unit;
            # it does not grant that unit in PCP, Usinas, or another module.
            result.append(screen_id)
    return result


def api_screen(uri, method='GET'):
    unit = unit_for_uri(uri)
    if not unit:
        return None
    root = '/unificado/laboratorio/' + unit + '/cec-api/'
    path = urlsplit(uri).path
    if not path.startswith(root):
        return None
    operation = path[len(root):].strip('/')
    prefix = UNITS[unit]['prefix']
    if method not in {'GET', 'HEAD'}:
        return prefix + ('Etiquetas' if operation == 'moldagens' else 'Leitura')
    return prefix + ('Etiquetas' if operation == 'massadas' else
                     'Leitura' if operation in {'auth/me', 'qrcp'} else '')


def assertion_scope(uri, method):
    unit = unit_for_uri(uri)
    if not unit:
        return {}
    path = urlsplit(uri).path
    root = '/unificado/laboratorio/' + unit + '/cec-api/'
    return {'cec_unit': unit, 'cec_method': method,
            'cec_operation': path[len(root):].strip('/') if path.startswith(root) else 'screen'}
