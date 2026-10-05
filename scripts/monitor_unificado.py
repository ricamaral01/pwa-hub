"""Persist an alert when an essential service is down or a filesystem is over 80%."""
from __future__ import annotations

import json
from pathlib import Path
import subprocess
import sys

SERVICES = (
    "nginx.service", "postgresql.service", "docker.service",
    "mapa-unificado-auth.service", "mapa-unificado-realtime.service",
    "pcp-unificado-test.service", "backup-unificado-testes.timer",
    "backup-unificado-fotos.timer",
)
STATE = Path("/var/lib/concrefer-unificado-monitor/state.json")
VERSION = Path("/opt/concrefer-unificado/mapa-api/VERSION")


def run(*args: str) -> subprocess.CompletedProcess[str]:
    return subprocess.run(args, text=True, capture_output=True)


def current_alerts() -> list[str]:
    alerts = []
    for service in SERVICES:
        result = run("systemctl", "is-active", service)
        if result.stdout.strip() != "active":
            alerts.append(f"servico inativo: {service}")
    mounts: dict[str, int] = {}
    result = run("df", "-P", "/", "/opt", "/var/backups")
    if result.returncode:
        alerts.append("nao foi possivel consultar o uso do disco")
    else:
        for line in result.stdout.splitlines()[1:]:
            fields = line.split()
            if len(fields) >= 6:
                mounts[fields[5]] = int(fields[4].rstrip("%"))
        for mount, usage in sorted(mounts.items()):
            if usage >= 80:
                alerts.append(f"disco em {usage}%: {mount}")
    return alerts


def record(message: str) -> None:
    version = VERSION.read_text(encoding="utf-8").strip() if VERSION.is_file() else "desconhecida"
    sql = """INSERT INTO unificado_auth.problem_reports(actor,screen,version,report_text)
             VALUES ('monitor','infra',%s,%s)"""
    payload = json.dumps({"version": version, "message": message})
    program = """
import json,sys,psycopg
data=json.loads(sys.stdin.read())
with psycopg.connect('dbname=mapa_unificado_teste') as conn:
  with conn.cursor() as cur: cur.execute(%r,(data['version'],data['message']))
""" % sql
    result = subprocess.run(
        ["/opt/concrefer-unificado/mapa-api/.venv/bin/python", "-c", program],
        input=payload, text=True, capture_output=True)
    if result.returncode:
        raise RuntimeError("falha ao persistir alerta de infraestrutura")


def main() -> None:
    STATE.parent.mkdir(mode=0o750, parents=True, exist_ok=True)
    previous = json.loads(STATE.read_text(encoding="utf-8")) if STATE.is_file() else []
    alerts = current_alerts()
    if alerts != previous:
        if alerts:
            message = "ALERTA: " + "; ".join(alerts)
            print(message, file=sys.stderr)
            record(message)
        elif previous:
            message = "RECUPERADO: servicos ativos e discos abaixo de 80%"
            print(message)
            record(message)
        STATE.write_text(json.dumps(alerts, ensure_ascii=False) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()

