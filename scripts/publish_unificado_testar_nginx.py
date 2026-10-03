"""Add only the protected test landing route to the test VPS Nginx site."""

from __future__ import annotations

from pathlib import Path
import shutil
import subprocess


CONFIG = Path("/etc/nginx/sites-enabled/concrefer.concretrack.com.br")
BACKUP = Path("/root/mapa-unificado-migration/concrefer.nginx.before-testar.conf")
ANCHOR = "    location = /unificado/mapa/api/login {"
BLOCK = """    location = /unificado/testar {
        return 301 /unificado/testar/;
    }

    location = /unificado/testar/ {
        proxy_pass http://127.0.0.1:13052/testar/;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        add_header Cache-Control "no-store" always;
    }

"""


def main() -> None:
    original = CONFIG.read_text()
    if "location = /unificado/testar/" in original:
        print("testar_nginx=already_present")
        return
    if original.count(ANCHOR) != 1:
        raise RuntimeError("Expected Mapa login anchor exactly once")
    shutil.copy2(CONFIG, BACKUP)
    CONFIG.write_text(original.replace(ANCHOR, BLOCK + ANCHOR))
    check = subprocess.run(["nginx", "-t"], capture_output=True, text=True)
    if check.returncode:
        CONFIG.write_text(original)
        raise RuntimeError(check.stderr)
    subprocess.run(["systemctl", "reload", "nginx"], check=True)
    print("testar_nginx=published nginx_test=ok")


if __name__ == "__main__":
    main()
