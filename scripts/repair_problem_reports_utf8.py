"""Repair mojibake in problem reports stored only in the unified PostgreSQL database."""

from __future__ import annotations

import psycopg
from psycopg.rows import dict_row

from utf8_guard_unificado import MOJIBAKE, repair


def main() -> None:
    changed = 0
    before = 0
    after = 0
    with psycopg.connect("dbname=mapa_unificado_teste", row_factory=dict_row) as connection, connection.cursor() as cursor:
        cursor.execute("SELECT current_database() AS name")
        if cursor.fetchone()["name"] != "mapa_unificado_teste":
            raise RuntimeError("Refusing to modify a database other than mapa_unificado_teste")
        cursor.execute("""SELECT id,actor,screen,version,report_text
                          FROM unificado_auth.problem_reports FOR UPDATE""")
        for row in cursor.fetchall():
            values = {key: str(row[key] or "") for key in ("actor", "screen", "version", "report_text")}
            before += sum(len(MOJIBAKE.findall(value)) for value in values.values())
            fixed = {key: repair(value) for key, value in values.items()}
            after += sum(len(MOJIBAKE.findall(value)) for value in fixed.values())
            if fixed != values:
                cursor.execute("""UPDATE unificado_auth.problem_reports
                                  SET actor=%s,screen=%s,version=%s,report_text=%s WHERE id=%s""",
                               (fixed["actor"], fixed["screen"], fixed["version"],
                                fixed["report_text"], row["id"]))
                changed += 1
    print(f"problem_reports before={before} after={after} changed_rows={changed}")


if __name__ == "__main__":
    main()
