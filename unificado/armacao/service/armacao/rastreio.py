"""Read-only reverse trace and supervisor summaries; all queries enforce unit scope."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session

from .auth import Context, context, need
from .db import session

router=APIRouter(tags=["armacao-rastreio"])


def _scope(ctx: Context):
    return {"uid":ctx.unit_id}


@router.get("/rastreio")
def trace(q: str, ctx: Context=Depends(context), db: Session=Depends(session)):
    need(ctx,"armacao.consulta")
    q=q.strip()
    if len(q)<3 or len(q)>100: raise HTTPException(422,"Busque por código, corrida ou série (3 a 100 caracteres)")
    records=[dict(row) for row in db.execute(text("""SELECT
      u.codigo AS unidade,ca.poste_serie,ca.concretagem_origem,ca.concretagem_ref,
      al.codigo AS armadura_codigo,al.modelo_poste_id,al.qtd AS armaduras,
      lc.codigo AS feixe_codigo,lc.produto_codigo,c.barras_baixadas,
      b.id AS bobina_id,b.corrida,b.fornecedor,b.norma,b.lote_fornecedor
      FROM armacao.concretagem_armadura ca
      JOIN producao.unidade u ON u.id=ca.unidade_id
      JOIN armacao.armadura_lote al ON al.id=ca.armadura_lote_id
      JOIN armacao.armacao_consumo c ON c.apontamento_id=al.apontamento_id
      JOIN armacao.aco_lote_corte lc ON lc.id=c.lote_corte_id
      JOIN armacao.aco_bobina b ON b.id=lc.bobina_id
      WHERE (:uid IS NULL OR ca.unidade_id=:uid)
        AND (ca.poste_serie=:q OR al.codigo=:q OR lc.codigo=:q OR b.corrida=:q)
      ORDER BY ca.vinculado_em DESC LIMIT 100"""),{"uid":ctx.unit_id,"q":q}).mappings()]
    if not records:
        records=[dict(row) for row in db.execute(text("""SELECT
          u.codigo AS unidade,NULL::text AS poste_serie,NULL::text AS concretagem_origem,
          NULL::text AS concretagem_ref,al.codigo AS armadura_codigo,
          al.modelo_poste_id,al.qtd AS armaduras,lc.codigo AS feixe_codigo,
          lc.produto_codigo,c.barras_baixadas,b.id AS bobina_id,b.corrida,b.fornecedor,
          b.norma,b.lote_fornecedor
          FROM armacao.armadura_lote al JOIN producao.unidade u ON u.id=al.unidade_id
          JOIN armacao.armacao_consumo c ON c.apontamento_id=al.apontamento_id
          JOIN armacao.aco_lote_corte lc ON lc.id=c.lote_corte_id
          JOIN armacao.aco_bobina b ON b.id=lc.bobina_id
          WHERE (:uid IS NULL OR al.unidade_id=:uid)
            AND (al.codigo=:q OR lc.codigo=:q OR b.corrida=:q)
          ORDER BY al.id DESC LIMIT 100"""),{"uid":ctx.unit_id,"q":q}).mappings()]
    if not records:
        records=[dict(row) for row in db.execute(text("""SELECT u.codigo AS unidade,
          NULL::text AS poste_serie,NULL::text AS concretagem_origem,NULL::text AS concretagem_ref,
          NULL::text AS armadura_codigo,NULL::bigint AS modelo_poste_id,
          NULL::integer AS armaduras,lc.codigo AS feixe_codigo,lc.produto_codigo,
          NULL::integer AS barras_baixadas,b.id AS bobina_id,b.corrida,b.fornecedor,b.norma,b.lote_fornecedor
          FROM armacao.aco_lote_corte lc JOIN producao.unidade u ON u.id=lc.unidade_id
          JOIN armacao.aco_bobina b ON b.id=lc.bobina_id
          WHERE (:uid IS NULL OR lc.unidade_id=:uid)
            AND (lc.codigo=:q OR b.corrida=:q)
          ORDER BY lc.id DESC LIMIT 100"""),{"uid":ctx.unit_id,"q":q}).mappings()]
    for record in records:
        record["foto_url"]=(f"/unificado/armacao/api/armacao/bobinas/{record['bobina_id']}/foto"
                            if ctx.unit_id is not None else None)
    return {"busca":q,"registros":records,"total":len(records)}


@router.get("/relatorios/feixes-abertos")
def open_bundles(ctx: Context=Depends(context), db: Session=Depends(session)):
    if "armacao.consulta" not in ctx.actor.actions: need(ctx,"armacao.supervisor")
    return [dict(row) for row in db.execute(text("""SELECT u.codigo AS unidade,l.codigo,l.status,
      l.produto_codigo,l.qtd_barras,l.saldo_barras,l.cortado_em,
      b.corrida,b.fornecedor,m.nome AS maquina,
      ab.nome AS banca,extract(day FROM now()-l.cortado_em)::integer AS dias_parado
      FROM armacao.aco_lote_corte l JOIN producao.unidade u ON u.id=l.unidade_id
      JOIN armacao.aco_bobina b ON b.id=l.bobina_id
      JOIN armacao.aco_maquina m ON m.id=l.maquina_id
      LEFT JOIN armacao.armacao_entrada_feixe e ON e.lote_corte_id=l.id AND e.ativa
      LEFT JOIN armacao.armacao_banca ab ON ab.id=e.banca_id
      WHERE (:uid IS NULL OR l.unidade_id=:uid)
        AND l.status NOT IN ('CANCELADO','CONSUMIDO')
      ORDER BY l.cortado_em DESC LIMIT 1000"""),_scope(ctx)).mappings()]


@router.get("/relatorios/saldo-rolos")
def coil_balance(ctx: Context=Depends(context), db: Session=Depends(session)):
    if "armacao.consulta" not in ctx.actor.actions: need(ctx,"armacao.supervisor")
    return [dict(row) for row in db.execute(text("""SELECT u.codigo AS unidade,b.id,b.fornecedor,b.corrida,
      b.peso_liquido_kg,b.status,m.nome AS maquina,
      b.peso_liquido_kg-COALESCE(sum(l.peso_kg) FILTER(WHERE l.status<>'CANCELADO'),0) AS saldo_kg,
      c.tolerancia_saldo
      FROM armacao.aco_bobina b JOIN producao.unidade u ON u.id=b.unidade_id
      JOIN armacao.configuracao_unidade c ON c.unidade_id=b.unidade_id
      LEFT JOIN armacao.aco_lote_corte l ON l.bobina_id=b.id
      LEFT JOIN armacao.aco_maquina m ON m.id=b.maquina_id
      WHERE (:uid IS NULL OR b.unidade_id=:uid)
      GROUP BY u.codigo,b.id,m.nome,c.tolerancia_saldo
      ORDER BY b.id DESC LIMIT 1000"""),_scope(ctx)).mappings()]


@router.get("/supervisor")
def supervisor(ctx: Context=Depends(context), db: Session=Depends(session)):
    need(ctx,"armacao.supervisor")
    coils=coil_balance(ctx,db)
    bundles=open_bundles(ctx,db)
    adjustments=[dict(row) for row in db.execute(text("""SELECT u.codigo AS unidade,a.*
      FROM armacao.armacao_ajuste a JOIN producao.unidade u ON u.id=a.unidade_id
      WHERE (:uid IS NULL OR a.unidade_id=:uid)
      ORDER BY a.registrado_em DESC LIMIT 100"""),_scope(ctx)).mappings()]
    alerts=[coil for coil in coils if coil["saldo_kg"] <
            -coil["peso_liquido_kg"]*coil["tolerancia_saldo"]]
    return {"rolos_em_uso":[coil for coil in coils if coil["status"]=="EM_USO"],
            "alertas_saldo":alerts,"feixes_parados":[b for b in bundles if b["dias_parado"]>=3],
            "fechamentos_com_ajuste":adjustments}
