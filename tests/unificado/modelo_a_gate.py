"""Seven read-only shell/module boundary checks for the Modelo A release."""

import os
import requests


BASE = os.environ.get("UNIFICADO_BASE_URL", "https://concrefer.concretrack.com.br").rstrip("/")
CASES = [
    ("casca", "/unificado/", 200),
    ("login", "/unificado/login.html", 200),
    ("PCP protegido", "/unificado/pcp/api/dashboard", int(os.environ.get("PCP_ANON_EXPECTED", "403"))),
    ("Mapa saúde", "/unificado/mapa/api/health", 200),
    ("Laboratório requer sessão", "/unificado/laboratorio/", 302),
    ("Qualidade protegida", "/unificado/qualidade/api/health", 401),
    ("GED QR público", "/unificado/ged/calibrations/verify/b3e3ac18-01fa-40d2-9629-9390b60e5dfc", 200),
]

for label, path, expected in CASES:
    response = requests.get(BASE + path, timeout=20, allow_redirects=False)
    print(f"{label}: {response.status_code}/{expected}", flush=True)
    if response.status_code != expected:
        raise SystemExit(f"Gate failed: {label}")
print("Gate Modelo A: 7/7", flush=True)
