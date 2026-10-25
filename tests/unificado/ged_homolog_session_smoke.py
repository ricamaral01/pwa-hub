"""Verify the isolated GED SSO bridge without exposing session material."""

import urllib.error
import urllib.request

from homolog_session import test_cookies


BASE = 'https://concrefer.concretrack.com.br:18446'
COOKIE = 'mapa_unificado_homolog_session'


def status(path, token):
    request = urllib.request.Request(BASE + path, headers={'Cookie': f'{COOKIE}={token}'})
    try:
        with urllib.request.urlopen(request, timeout=12) as response:
            return response.status
    except urllib.error.HTTPError as error:
        return error.code


if __name__ == '__main__':
    cookies = test_cookies()
    for name in ('ricardo', 'unlinked'):
        print(name, 'mapa', status('/unificado/mapa/api/unified/screen-access/me', cookies[name]),
              'ged', status('/unificado/ged/api/auth/unified-session', cookies[name]))
