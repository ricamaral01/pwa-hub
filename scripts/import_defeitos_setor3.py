"""Repeatable import of Ricardo's September/2026 Sector 3 defect listing.

Run on the unified VPS as PostgreSQL's OS user, after a verified backup:
  sudo -u postgres /opt/concrefer-unificado/mapa-api/.venv/bin/python \
    /opt/concrefer-unificado/infra/import_defeitos_setor3.py \
    /opt/concrefer-unificado/infra/defeitos-setor3-recebidos.tsv
"""

from __future__ import annotations

from collections import Counter
from datetime import datetime
import hashlib
from pathlib import Path
import sys

import psycopg


SOURCE_KEY = "ricardo-setor3-2026-09-g-trincas"
EXPECTED_SHA256 = "fb4d1c952dfe205c9d26ebb9e7b5c3ca224f1390782b7f74128de9726fbc1b46"
EXPECTED_COUNT = 214


def parse(path: Path):
    raw = path.read_bytes()
    digest = hashlib.sha256(raw).hexdigest()
    if digest != EXPECTED_SHA256:
        raise ValueError("O arquivo recebido foi alterado; importação recusada.")
    rows = []
    for number, line in enumerate(raw.decode("utf-8-sig").splitlines(), 1):
        fields = line.split("\t")
        if len(fields) != 6:
            raise ValueError(f"Linha {number}: eram esperados seis campos.")
        model, shape, empty, sector, source_date, defect = (value.strip() for value in fields)
        if (shape != "Cir. / DT" or empty or sector != "Setor 3 - Poste Circular"
                or defect != "G - Presença de Trincas"):
            raise ValueError(f"Linha {number}: setor ou tipo de defeito inesperado.")
        event_date = datetime.strptime(source_date, "%d/%m/%Y").date()
        if not (event_date.year == 2026 and event_date.month == 9):
            raise ValueError(f"Linha {number}: data fora de setembro/2026.")
        rows.append((SOURCE_KEY, digest, number, event_date, "Setor 3",
                     model.upper() or None, "G", "Presença de Trincas"))
    if len(rows) != EXPECTED_COUNT or sum(row[5] is None for row in rows) != 1:
        raise ValueError("Contagem de linhas ou modelo ausente diverge do recebido.")
    return rows


def main() -> None:
    if len(sys.argv) != 2:
        raise SystemExit("Informe o caminho do TSV recebido.")
    rows = parse(Path(sys.argv[1]))
    with psycopg.connect("dbname=mapa_unificado_teste user=postgres") as connection:
        with connection.cursor() as cursor:
            cursor.execute("SELECT count(*),min(source_sha256),max(source_sha256) "
                           "FROM unificado_auth.reported_defects WHERE source_key=%s",
                           (SOURCE_KEY,))
            existing, first_hash, last_hash = cursor.fetchone()
            if existing and (first_hash != EXPECTED_SHA256 or last_hash != EXPECTED_SHA256):
                raise ValueError("Já há uma versão diferente desta fonte; importação recusada.")
            cursor.executemany("""INSERT INTO unificado_auth.reported_defects
                (source_key,source_sha256,source_line,event_date,sector,model,defect_code,defect_name)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s)
                ON CONFLICT (source_key,source_line) DO NOTHING""", rows)
            cursor.execute("""SELECT count(*),count(*) FILTER (WHERE model IS NULL),
                              min(event_date),max(event_date)
                              FROM unificado_auth.reported_defects WHERE source_key=%s""",
                           (SOURCE_KEY,))
            count, missing_model, first_date, last_date = cursor.fetchone()
            if (count, missing_model, first_date.isoformat(), last_date.isoformat()) != (
                    214, 1, "2026-09-01", "2026-09-30"):
                raise ValueError("Conferência após importação falhou; transação revertida.")
            cursor.execute("""SELECT event_date,count(*) FROM unificado_auth.reported_defects
                              WHERE source_key=%s GROUP BY event_date ORDER BY event_date""",
                           (SOURCE_KEY,))
            observed = Counter(dict(cursor.fetchall()))
            expected = Counter(row[3] for row in rows)
            if observed != expected:
                raise ValueError("Contagens diárias divergentes; transação revertida.")
    print(f"source={SOURCE_KEY} imported={count} missing_model={missing_model} "
          f"period={first_date}/{last_date} daily_counts=verified")


if __name__ == "__main__":
    main()
