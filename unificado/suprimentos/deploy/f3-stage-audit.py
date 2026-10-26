"""Resumo de homologação sem dados sensíveis."""
import os
import psycopg
dsn=os.environ['SUPRIMENTOS_DATABASE_URL'].replace('postgresql+psycopg://','postgresql://',1)
with psycopg.connect(dsn) as db, db.cursor() as cur:
    cur.execute("SELECT version_num FROM alembic_version")
    print('MIGRATION',cur.fetchone())
    cur.execute("SELECT fase,habilitado FROM suprimentos.sup_flag WHERE unidade_id=1 AND fase IN ('S1','S2','S3A','S3B') ORDER BY fase")
    print('FLAGS',cur.fetchall())
    cur.execute("SELECT status,count(*) FROM suprimentos.sup_pedido GROUP BY status ORDER BY status")
    print('ORDERS',cur.fetchall())
    cur.execute("SELECT count(*) FROM suprimentos.sup_recebimento")
    print('RECEIPTS',cur.fetchone()[0])
