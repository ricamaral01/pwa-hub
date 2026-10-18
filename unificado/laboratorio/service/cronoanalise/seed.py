"""Emit the idempotent v002 seed SQL from the bundled specification data.

Usage: python seed.py | psql -v ON_ERROR_STOP=1 -d <laboratorio_database>
The output is SQL only; all source files are bundled beside this script.
"""
from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

SEEDS = Path(__file__).resolve().parent / "seeds"


def literal(value: object) -> str:
    if value is None:
        return "NULL"
    if isinstance(value, bool):
        return "true" if value else "false"
    if isinstance(value, (int, float)):
        return str(value)
    return "'" + str(value).replace("'", "''") + "'"


def json_literal(value: object) -> str:
    return literal(json.dumps(value, ensure_ascii=False, separators=(",", ":"))) + "::jsonb"


def load(name: str):
    return json.loads((SEEDS / name).read_text(encoding="utf-8"))


def generate(unidade: str = "concrefer") -> str:
    if not re.fullmatch(r"[a-z][a-z0-9_-]{0,39}", unidade):
        raise ValueError("unidade_codigo inválido")
    catalogo = load("catalogo.json")["atividades"]
    layout = load("layout_setores.json")
    parametros = load("parametros.json")
    listas = load("listas.json")
    if len(catalogo) != 40 or len({a["codigo"] for a in catalogo}) != 40:
        raise ValueError("O catálogo precisa ter 40 códigos únicos")
    if {row["setor"] for row in layout} != {1, 2, 3, 4}:
        raise ValueError("O layout precisa ter os setores 1 a 4")

    lines = ["-- Cronoanalise v002: dados iniciais; nunca sobrescreve edição do usuário.",
             "BEGIN;"]
    activity_fields = ("codigo", "processo", "nome", "tipo", "pessoas_padrao",
                       "estimativa_min", "por_cacamba", "ponto_inicio", "ponto_fim", "ordem")
    for row in catalogo:
        values = ",".join([literal(unidade), *(literal(row[key]) for key in activity_fields)])
        lines.append("INSERT INTO cronoanalise.atividades "
                     f"(unidade_codigo,{','.join(activity_fields)}) VALUES ({values}) "
                     "ON CONFLICT DO NOTHING;")
    layout_fields = ("setor", "distancia_monovia_m", "filas", "formas_por_fila",
                     "primeira_forma_m", "ultima_forma_m", "lancamento_min_por_forma",
                     "regra_cacambas", "corredor_m", "setor_montagem_m")
    for row in layout:
        values = ",".join([literal(unidade), *(literal(row[key]) for key in layout_fields)])
        lines.append("INSERT INTO cronoanalise.layout_setores "
                     f"(unidade_codigo,{','.join(layout_fields)}) VALUES ({values}) "
                     "ON CONFLICT DO NOTHING;")
    for table, key in (("parametros_dimensionamento", "dimensionamento"),
                       ("config_simulacao", "simulacao_base")):
        lines.append(f"INSERT INTO cronoanalise.{table}(unidade_codigo,dados) "
                     f"VALUES ({literal(unidade)},{json_literal(parametros[key])}) "
                     "ON CONFLICT DO NOTHING;")
    for key, values in listas.items():
        lines.append("INSERT INTO cronoanalise.listas(unidade_codigo,chave,valores) "
                     f"VALUES ({literal(unidade)},{literal(key)},{json_literal(values)}) "
                     "ON CONFLICT DO NOTHING;")
    lines.append("INSERT INTO cronoanalise.schema_migrations(versao) VALUES ('002_seeds') ON CONFLICT DO NOTHING;")
    lines.append("COMMIT;")
    return "\n".join(lines) + "\n"


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--unidade", default="concrefer")
    parser.add_argument("--output", type=Path, help="grava SQL UTF-8 neste arquivo")
    args = parser.parse_args()
    sql = generate(args.unidade)
    if args.output:
        args.output.write_text(sql, encoding="utf-8")
    else:
        print(sql, end="")
