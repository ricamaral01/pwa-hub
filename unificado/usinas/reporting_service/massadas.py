"""Read-only massadas export using the reporting mirror."""

from datetime import date, datetime, time
from decimal import Decimal
from typing import Optional

import psycopg2
import psycopg2.extras
from fastapi import APIRouter, Query

from .settings import settings


router = APIRouter()


@router.get("/relatorios/massadas")
def listar_massadas(
    data_ini: Optional[date] = Query(None),
    data_fim: Optional[date] = Query(None),
):
    query = "SELECT * FROM tbl_massadas WHERE 1=1"
    params = []
    if data_ini:
        query += " AND data >= %s"
        params.append(data_ini)
    if data_fim:
        query += " AND data <= %s"
        params.append(data_fim)
    query += " ORDER BY data DESC, hora DESC"
    with psycopg2.connect(
        settings.POSTGRES_URL,
        options="-c search_path=usinas_reporting,public -c default_transaction_read_only=on",
    ) as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cursor:
            cursor.execute(query, params)
            rows = cursor.fetchall()
    output = []
    for row in rows:
        item = {}
        for key, value in row.items():
            if isinstance(value, Decimal):
                item[key] = float(value)
            elif isinstance(value, (date, datetime, time)):
                item[key] = value.isoformat()
            elif hasattr(value, "total_seconds"):
                seconds = int(value.total_seconds())
                item[key] = f"{seconds // 3600:02d}:{(seconds % 3600) // 60:02d}:{seconds % 60:02d}"
            else:
                item[key] = value
        output.append(item)
    return output
