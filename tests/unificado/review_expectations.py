"""Explicit authentication challenges, retained as evidence instead of API failures."""
from urllib.parse import urlsplit

def legacy_login_challenge(response,module,visible_login):
    return (module=='usinas' and visible_login and response.get('status')==401
            and urlsplit(response.get('url','')).path.startswith('/unificado/mapa/api/usina/legacy/'))
