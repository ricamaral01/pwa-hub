"""Explicit authentication challenges, retained as evidence instead of API failures."""
from urllib.parse import urlsplit
from urllib.parse import unquote
import posixpath

EXTERNAL_REPORT_PREFIX='https://dautomacao.com/concretrack/relatorios/reports-diarios/generated/pcp-producao/'

def permitted_external_report(url,method):
    if method!='GET' or not url.startswith(EXTERNAL_REPORT_PREFIX):return False
    parsed=urlsplit(url)
    if parsed.scheme!='https' or parsed.netloc!='dautomacao.com':return False
    path=parsed.path
    for _ in range(3):path=unquote(path)
    root=urlsplit(EXTERNAL_REPORT_PREFIX).path
    normalized=posixpath.normpath(path)
    return normalized==root.rstrip('/') or normalized.startswith(root)

def legacy_login_challenge(response,module,visible_login):
    return (module=='usinas' and visible_login and response.get('status')==401
            and urlsplit(response.get('url','')).path.startswith('/unificado/mapa/api/usina/legacy/'))
