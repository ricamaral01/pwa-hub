"""Route only PCP Users API traffic through the unified test auth service."""

from __future__ import annotations

from pathlib import Path
import shutil
import subprocess


CONFIG = Path("/etc/nginx/sites-enabled/concrefer.concretrack.com.br")
BACKUP = Path("/root/mapa-unificado-migration/concrefer.nginx.before-unified-users.conf")
ANCHOR = "    location ^~ /unificado/pcp/api/ {"
BLOCK = """    location = /unificado/pcp/api/usuarios {
        proxy_pass http://127.0.0.1:13052/unified/pcp/usuarios;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        add_header Cache-Control "no-store" always;
    }

    location ^~ /unificado/pcp/api/usuarios/ {
        proxy_pass http://127.0.0.1:13052/unified/pcp/usuarios/;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        add_header Cache-Control "no-store" always;
    }

"""


def main() -> None:
    original = CONFIG.read_text()
    if "location = /unificado/pcp/api/usuarios {" in original:
        print("unified_pcp_users_nginx=already_present")
        return
    if original.count(ANCHOR) != 1:
        raise RuntimeError("Expected PCP API location exactly once")
    shutil.copy2(CONFIG, BACKUP)
    CONFIG.write_text(original.replace(ANCHOR, BLOCK + ANCHOR))
    check = subprocess.run(["nginx", "-t"], capture_output=True, text=True)
    if check.returncode:
        CONFIG.write_text(original)
        raise RuntimeError(check.stderr)
    subprocess.run(["systemctl", "reload", "nginx"], check=True)
    print("unified_pcp_users_nginx=published nginx_test=ok")


if __name__ == "__main__":
    main()
