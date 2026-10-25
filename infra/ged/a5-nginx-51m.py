"""Run on destination only after backing up the active GED Nginx snippet."""
from pathlib import Path

path = Path("/etc/nginx/snippets/ged-unificado.conf")
current = path.read_text()
old = "    client_max_body_size 50m;"
new = "    client_max_body_size 51m;"
if current.count(old) != 1 or new in current:
    raise SystemExit("Unexpected GED API upload limit; no change applied")
path.write_text(current.replace(old, new, 1))
print("GED API multipart envelope raised to 51m")
