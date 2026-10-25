"""Clone Alex Zaranello's existing Mapa/PCP identities to isolated homolog DBs.

Run as the postgres OS user on the new VPS. No credentials are printed.
"""
from __future__ import annotations

import psycopg
from psycopg import sql
from psycopg.rows import dict_row


def copy_rows(src, dst, schema: str, table: str, where: str, value):
    with src.cursor(row_factory=dict_row) as cur:
        cur.execute(sql.SQL("SELECT * FROM {}.{} WHERE ").format(
            sql.Identifier(schema), sql.Identifier(table)) + sql.SQL(where), (value,))
        rows = cur.fetchall()
    for row in rows:
        if table == "identity_links":
            row.pop("id", None)  # generated always as identity in homolog
        columns = list(row)
        statement = sql.SQL("INSERT INTO {}.{} ({}) VALUES ({}) ON CONFLICT DO NOTHING").format(
            sql.Identifier(schema), sql.Identifier(table),
            sql.SQL(",").join(map(sql.Identifier, columns)),
            sql.SQL(",").join(sql.Placeholder() for _ in columns),
        )
        with dst.cursor() as cur:
            cur.execute(statement, list(row.values()))
    return len(rows)


def main():
    with psycopg.connect("dbname=pcp_unificado_teste user=postgres") as pcp_src, \
         psycopg.connect("dbname=pcp_unificado_homolog_20261016 user=postgres") as pcp_dst, \
         psycopg.connect("dbname=mapa_unificado_teste user=postgres") as mapa_src, \
         psycopg.connect("dbname=mapa_unificado_homolog_20261016 user=postgres") as mapa_dst:
        pcp = copy_rows(pcp_src, pcp_dst, "public", "usuarios", "id=%s", 145)
        mapa = copy_rows(mapa_src, mapa_dst, "public", "usuarios", "id=%s", "alex")
        links = copy_rows(mapa_src, mapa_dst, "unificado_auth", "identity_links", "mapa_login=%s", "alex")
        counts = {}
        for table in ("user_screen_permissions", "user_action_permissions", "user_quality_areas"):
            counts[table] = copy_rows(mapa_src, mapa_dst, "unificado_auth", table, "user_id=%s", "alex")
        assert pcp == mapa == links == 1, (pcp, mapa, links)
        pcp_dst.commit()
        mapa_dst.commit()
    print({"pcp_user": pcp, "mapa_user": mapa, "identity_link": links,
           "copied_permissions": counts})


if __name__ == "__main__":
    main()
