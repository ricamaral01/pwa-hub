"""Pure text patches for the existing H services; no I/O or deployment on import.

The release driver verifies source hashes, backs up files/units, writes and
compiles candidates, and only then replaces H files. Production is excluded.
"""
import ast


def once(source, old, new):
    if source.count(old) != 1:
        raise ValueError('Fonte mudou ou patch já aplicado: ' + old[:80])
    return source.replace(old, new)


def laboratory(source):
    source = once(source, 'from .cec_api import router as cec_router',
                  'from .cec_api import router as cec_router\nfrom .cec_units import router_for as cec_unit_router')
    source = once(source, "    app.include_router(cec_router, prefix='/noroeste')",
                  "    app.include_router(cec_router, prefix='/noroeste')\n"
                  "    for unit in ('pederneiras', 'ribeirao'):\n"
                  "        app.include_router(cec_unit_router(unit))")
    source = once(source, "    noro_cec_static = ROOT / 'server' / 'static' / 'noroeste' / 'cec'",
                  "    for unit in ('pederneiras', 'ribeirao'):\n"
                  "        unit_cec_static = ROOT / 'server' / 'static' / unit / 'cec'\n"
                  "        if unit_cec_static.exists():\n"
                  "            app.mount('/'+unit+'/cec', StaticFiles(directory=unit_cec_static, html=True), name='cec-'+unit)\n"
                  "    noro_cec_static = ROOT / 'server' / 'static' / 'noroeste' / 'cec'")
    ast.parse(source)
    return source


def central(source):
    source = once(source, 'def screen_access_state(user):',
                  'from lab_cec_units import (filter_allowed as cec_filter_allowed,\n'
                  '                           unit_for_screen as cec_unit_for_screen,\n'
                  '                           unit_for_uri as cec_unit_for_uri,\n'
                  '                           api_screen as cec_api_screen,\n'
                  '                           assertion_scope as cec_assertion_scope)\n\n'
                  'def screen_access_state(user):')
    source = once(source, "    if (user['id'] not in MASTER_USER_IDS and planning_role != 'ADMIN'\n",
                  "    allowed = cec_filter_allowed(user, allowed, overrides,\n"
                  "                                 unit_scope['unit_code'] if unit_scope else None, extra_units,\n"
                  "                                 urllib.parse.urlsplit(os.getenv('MAPA_AUTH_DATABASE_URL','')).path == '/mapa_visual_homolog_20261118')\n"
                  "    if (user['id'] not in MASTER_USER_IDS and planning_role != 'ADMIN'\n")
    source = once(source, "    if screen_id.startswith('labNoro'):\n",
                  "    new_cec_unit = cec_unit_for_screen(screen_id)\n"
                  "    if new_cec_unit:\n        return unit == new_cec_unit\n"
                  "    if screen_id.startswith('labNoro'):\n")
    start = source.index('def laboratorio_authorize():')
    end = source.index('\ndef test_actor():', start)
    part = source[start:end]
    part = once(part, '        path = urllib.parse.urlsplit(original_uri).path',
                '        path = urllib.parse.urlsplit(original_uri).path\n'
                '        if cec_unit_for_uri(original_uri) and not unified_user:\n'
                '            return Response(status=401)')
    part = once(part, '        accepted = None',
                '        cec_manifest = cec_manifest or bool(cec_unit_for_uri(original_uri) and path.endswith("/manifest.json"))\n'
                '        new_cec_screen = cec_api_screen(original_uri, method)\n'
                '        if new_cec_screen:\n'
                '            screen = SCREENS_BY_ID.get(new_cec_screen)\n'
                '        accepted = None')
    part = once(part, '        payload = base64.urlsafe_b64encode(json.dumps({',
                '        payload = base64.urlsafe_b64encode(json.dumps({\n'
                '            **cec_assertion_scope(original_uri, method),')
    source = source[:start] + part + source[end:]
    ast.parse(source)
    return source
