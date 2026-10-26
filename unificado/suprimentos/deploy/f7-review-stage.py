"""EXPLAIN, índices, flags e limites de dados na base da homologação, sem escrita."""
from __future__ import annotations

import json
import os
import sys
from pathlib import Path

import psycopg


def main(output):
    if os.environ.get("SUPRIMENTOS_ENVIRONMENT") != "homolog":
        raise RuntimeError("Somente homologação")
    dsn = os.environ["SUPRIMENTOS_DATABASE_URL"].replace("postgresql+psycopg://", "postgresql://", 1)
    if "suprimentos_homolog_20261025" not in dsn:
        raise RuntimeError("Banco inesperado")
    queries = {
        "lista_solicitacoes": """SELECT id,numero,status,criado_em FROM suprimentos.sup_solicitacao
            WHERE unidade_id=1 AND status='EM_APROVACAO' ORDER BY criado_em DESC LIMIT 50""",
        "lista_pedidos": """SELECT id,numero,status,entrega_prevista FROM suprimentos.sup_pedido
            WHERE unidade_id=1 ORDER BY criado_em DESC LIMIT 50""",
        "saldo": """SELECT s.material_id,s.quantidade,s.reservado FROM suprimentos.sup_saldo s
            WHERE s.unidade_id=1 ORDER BY s.material_id LIMIT 100""",
        "indicador_consumo": """SELECT material_id,sum(-quantidade) FROM suprimentos.sup_movimento
            WHERE unidade_id=1 AND tipo='ENTREGA' AND quantidade<0
              AND efetivado_em >= now()-interval '30 days' GROUP BY material_id""",
        "indicador_prazo": """SELECT avg(extract(epoch from entregue_em-criado_em)/86400)
            FROM suprimentos.sup_solicitacao WHERE unidade_id=1 AND entregue_em IS NOT NULL
              AND criado_em >= now()-interval '30 days'""",
    }
    data = {"consultas": {}, "indices": [], "flags": {}}
    with psycopg.connect(dsn) as db, db.cursor() as cur:
        cur.execute("SET default_transaction_read_only=on")
        cur.execute("SELECT indexname FROM pg_indexes WHERE schemaname='suprimentos' AND indexname LIKE 'ix_sup_%' ORDER BY indexname")
        data["indices"] = [row[0] for row in cur.fetchall()]
        cur.execute("SELECT fase,habilitado FROM suprimentos.sup_flag WHERE unidade_id=1 ORDER BY fase")
        data["flags"] = dict(cur.fetchall())
        for name, query in queries.items():
            cur.execute("EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) " + query)
            plan = cur.fetchone()[0][0]
            data["consultas"][name] = {"tempo_ms": round(plan["Execution Time"], 3),
                "no_raiz": plan["Plan"]["Node Type"], "linhas": plan["Plan"]["Actual Rows"],
                "buffers_lidos": plan["Plan"].get("Shared Read Blocks", 0)}
    output = Path(output)
    output.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    output.chmod(0o600)
    print("F7_REVIEW_OK", {k: v["tempo_ms"] for k,v in data["consultas"].items()},
          "indices", len(data["indices"]), "flags", data["flags"])


if __name__ == "__main__":
    main(sys.argv[1])
