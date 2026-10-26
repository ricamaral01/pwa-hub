"""Additive, repeatable schema installation for the current DATABASE_URL."""
from pathlib import Path

from app import db


if __name__=='__main__':
    sql=(Path(__file__).parent/'migrations'/'001_schema.sql').read_text(encoding='utf-8')
    with db() as conn:
        with conn.cursor() as cur:
            cur.execute(sql)
    print('cq schema ready')
