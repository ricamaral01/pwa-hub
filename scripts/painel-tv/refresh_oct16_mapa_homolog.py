"""Copy only 2026-10-16 TV source rows from production to isolated homolog.

Run after a pg_dump of the homolog Mapa database. Production connections are
strictly read-only; destination transactions insert only the missing day.
"""
from datetime import date

import psycopg
from psycopg import sql

DAY = date(2026, 10, 16)
TABLES = ('programacao_pcp', 'producao', 'liberacao_formas')
SOURCE = 'dbname=mapa_unificado_teste user=postgres host=/var/run/postgresql options=-cdefault_transaction_read_only=on'
DEST = 'dbname=mapa_unificado_homolog_20261016 user=postgres host=/var/run/postgresql'

with psycopg.connect(SOURCE) as source, psycopg.connect(DEST) as dest:
    with source.cursor() as read, dest.cursor() as write:
        for table in TABLES:
            query = sql.SQL('SELECT * FROM public.{} WHERE data_fabricacao=%s').format(sql.Identifier(table))
            read.execute(query, (DAY,))
            rows = read.fetchall()
            columns = [item.name for item in read.description]
            write.execute(sql.SQL('SELECT count(*) FROM public.{} WHERE data_fabricacao=%s').format(
                sql.Identifier(table)), (DAY,))
            existing = write.fetchone()[0]
            if existing:
                raise SystemExit(f'{table}: homolog already contains {existing} rows for day')
            if rows:
                insert = sql.SQL('INSERT INTO public.{} ({}) VALUES ({})').format(
                    sql.Identifier(table),
                    sql.SQL(',').join(map(sql.Identifier, columns)),
                    sql.SQL(',').join(sql.Placeholder() for _ in columns),
                )
                write.executemany(insert, rows)
            print(table, 'copied', len(rows))
