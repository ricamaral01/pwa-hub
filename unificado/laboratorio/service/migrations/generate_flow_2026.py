"""Generate clearly simulated Flow examples from real same-day Campinas serials.

Input is the read-only CEC mirror export: date,id,zero-padded serial (no header).
Output is idempotent PostgreSQL SQL. No source measurement is inferred.
"""
from __future__ import annotations

import csv
import hashlib
import sys
from collections import defaultdict
from datetime import date
from pathlib import Path
from uuid import NAMESPACE_URL, uuid5


def generate(source: Path) -> str:
    by_day: dict[date, list[tuple[int, str]]] = defaultdict(list)
    with source.open(newline='', encoding='utf-8-sig') as stream:
        for row in csv.reader(stream):
            if len(row) != 3:
                raise ValueError(f'Linha inválida: {row!r}')
            day, source_id, serial = row
            day = date.fromisoformat(day)
            if day.year != 2026 or day.weekday() > 4 or not serial.isascii() or not serial.isdigit() or len(serial) != 6 or serial == '000000':
                raise ValueError(f'Série ou data inválida: {row!r}')
            by_day[day].append((int(source_id), serial))
    lines = ['BEGIN;']
    for day_index, (day, sources) in enumerate(sorted(by_day.items())):
        if len(sources) > 2:
            raise ValueError(f'Mais de duas séries selecionadas em {day}')
        if len({source_id for source_id, _ in sources}) != len(sources):
            raise ValueError(f'ID repetido em {day}')
        for index in range(2):
            source_id, serial = sources[min(index, len(sources) - 1)]
            hour = '09:10:00' if index == 0 else '14:20:00'
            key = f'flow-simulado-2026:{day}:{index}:{source_id}'
            value = 480 + int.from_bytes(hashlib.sha256(key.encode()).digest()[:4], 'big') % 221
            collaborator = 'Josué Rodrigues' if (day_index * 2 + index) % 10 == 0 else 'Philippe Augusto'
            record_id = uuid5(NAMESPACE_URL, key)
            lines.append(
                "INSERT INTO ensaio_postes.flow_simulado "
                "(id, massada, valor, medido_em, serie_id_origem, serie_data_origem, colaborador) "
                f"VALUES ('{record_id}', '{serial}', {value}, "
                f"'{day} {hour} America/Sao_Paulo'::timestamptz, {source_id}, '{day}', '{collaborator}') "
                'ON CONFLICT DO NOTHING;'
            )
    lines += ['COMMIT;', "SELECT count(*), count(DISTINCT (medido_em AT TIME ZONE 'America/Sao_Paulo')::date) FROM ensaio_postes.flow_simulado;"]
    return '\n'.join(lines) + '\n'


if __name__ == '__main__':
    if len(sys.argv) != 2:
        raise SystemExit('Uso: generate_flow_2026.py flow_series_2026.csv > seed.sql')
    print(generate(Path(sys.argv[1])), end='')
