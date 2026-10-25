"""Return 401 before screen authorization when a PCP API bearer is absent.

Only changes the isolated port 18446 vhost; keeps a backup outside sites-enabled.
"""
from datetime import datetime, timezone
from pathlib import Path
import shutil


VHOST = Path('/etc/nginx/sites-enabled/unificado-homolog.conf')
BACKUPS = Path('/root/nginx-backups/maodeobra-20261017')
OLD = '''    location ^~ /unificado/pcp/api/ {
        auth_request /unificado/screen-authorize;'''
NEW = '''    location ^~ /unificado/pcp/api/ {
        if ($http_authorization = "") { return 401; }
        auth_request /unificado/screen-authorize;'''


def main() -> None:
    original = VHOST.read_text()
    if original.count(OLD) != 1 or original.count(NEW) != 0:
        raise RuntimeError('Vhost inesperado; nenhuma alteração aplicada')
    BACKUPS.mkdir(mode=0o700, parents=True, exist_ok=True)
    stamp = datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')
    backup = BACKUPS / f'unificado-homolog.conf.before-missing-token-{stamp}'
    shutil.copy2(VHOST, backup)
    VHOST.write_text(original.replace(OLD, NEW))
    print(f'Backup: {backup}; executar nginx -t antes de reload')


if __name__ == '__main__':
    main()
