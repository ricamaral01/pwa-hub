import psycopg2
import psycopg2.extras
from fastapi import APIRouter, Query

from .settings import settings

router = APIRouter()


def _conn():
    return psycopg2.connect(settings.POSTGRES_URL, options="-c search_path=usinas_reporting,public -c default_transaction_read_only=on")


@router.get("/relatorios/custos")
def relatorio_custos(meses: int = Query(12, ge=3, le=36)):
    conn = _conn(); cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("""
      WITH base AS (
        SELECT m.*,
          a.valor_unitario AS ajuste_valor, a.vigencia AS ajuste_data, a.motivo, a.responsavel,
          e.valor_unitario_liquido AS entrada_valor, e.data AS entrada_data
        FROM tbl_est_materiais m
        LEFT JOIN LATERAL (SELECT * FROM tbl_est_custos_ajustes a WHERE a.material_id=m.id AND a.vigencia<=CURRENT_DATE ORDER BY a.vigencia DESC,a.created_at DESC LIMIT 1) a ON true
        LEFT JOIN LATERAL (SELECT valor_unitario_liquido,data FROM tbl_est_movimentos e WHERE e.material_id=m.id AND e.tipo='entrada' AND e.valor_unitario_liquido>0 ORDER BY e.data DESC,e.created_at DESC LIMIT 1) e ON true
        WHERE m.ativo=true
      )
      SELECT *, COALESCE(ajuste_valor,entrada_valor,0) custo_vigente,
        CASE WHEN ajuste_valor IS NOT NULL THEN 'ajuste' WHEN entrada_valor IS NOT NULL THEN 'nota fiscal' ELSE 'sem custo' END fonte
      FROM base ORDER BY categoria,nome
    """)
    materiais=[dict(x) for x in cur.fetchall()]
    cur.execute("""
      SELECT a.id,a.material_id,m.nome material_nome,a.valor_unitario,a.vigencia,a.motivo,a.responsavel,a.created_at
      FROM tbl_est_custos_ajustes a JOIN tbl_est_materiais m ON m.id=a.material_id
      ORDER BY a.vigencia DESC,a.created_at DESC LIMIT 100
    """); ajustes=[dict(x) for x in cur.fetchall()]
    cur.execute("""
      WITH meses AS (SELECT generate_series(date_trunc('month',CURRENT_DATE)-(%s-1)*interval '1 month',date_trunc('month',CURRENT_DATE),interval '1 month')::date mes),
      mats AS (SELECT id,nome,categoria FROM tbl_est_materiais WHERE ativo=true)
      SELECT ms.mes,m.id material_id,m.nome,m.categoria,
        COALESCE(a.valor_unitario,e.valor_unitario_liquido,0) custo
      FROM meses ms CROSS JOIN mats m
      LEFT JOIN LATERAL (SELECT valor_unitario FROM tbl_est_custos_ajustes a WHERE a.material_id=m.id AND a.vigencia<ms.mes+interval '1 month' ORDER BY a.vigencia DESC,a.created_at DESC LIMIT 1) a ON true
      LEFT JOIN LATERAL (SELECT valor_unitario_liquido FROM tbl_est_movimentos e WHERE e.material_id=m.id AND e.tipo='entrada' AND e.valor_unitario_liquido>0 AND e.data<ms.mes+interval '1 month' ORDER BY e.data DESC,e.created_at DESC LIMIT 1) e ON true
      ORDER BY ms.mes,m.nome
    """,(meses,)); historico=[dict(x) for x in cur.fetchall()]
    cur.close(); conn.close()
    for rows in (materiais,ajustes,historico):
        for r in rows:
            for k,v in list(r.items()):
                if hasattr(v,'as_tuple'): r[k]=float(v)
                elif hasattr(v,'isoformat'): r[k]=v.isoformat()
    return {"materiais":materiais,"ajustes":ajustes,"historico":historico,"meses":meses}
