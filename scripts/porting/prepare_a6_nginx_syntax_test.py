"""Make a disposable Nginx syntax-test copy with a temporary certificate."""
from pathlib import Path
import re

source = Path("infra/ged/nginx-old-domain-a6-candidate.conf").read_text(encoding="utf-8")
root = Path(".codex-tmp/a6-nginx-test")
root.mkdir(parents=True, exist_ok=True)
source = re.sub(r"(?m)^\s*ssl_certificate\s+[^;]+;", "    ssl_certificate /root/ged-a6-nginx-test/cert.pem;", source)
source = re.sub(r"(?m)^\s*ssl_certificate_key\s+[^;]+;", "    ssl_certificate_key /root/ged-a6-nginx-test/key.pem;", source)
source = re.sub(r"(?m)^\s*(include /etc/letsencrypt/[^;]+;|ssl_dhparam [^;]+;)", "", source)
(root / "vhost.conf").write_text(source, encoding="utf-8")
(root / "nginx.conf").write_text("events {}\nhttp { include /root/ged-a6-nginx-test/vhost.conf; }\n", encoding="utf-8")
print("Cópia descartável do vhost preparada para teste de sintaxe")
