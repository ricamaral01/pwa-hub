"""Generate the reviewed PostgreSQL import from the two supplied A.1/A.2 files.

The input workbooks remain unchanged. Run from this directory with openpyxl installed.
"""
from __future__ import annotations

from collections import Counter
from decimal import Decimal
from hashlib import sha256
import json
from pathlib import Path
from uuid import NAMESPACE_URL, uuid5

from openpyxl import load_workbook


ROOT = Path(__file__).resolve().parent
SOURCES = ROOT / "fontes"
OUTPUT = ROOT / "20261026_referencias_a1_a2.sql"


def rows(filename: str, sheet: str, expected: int) -> tuple[list[dict], str]:
    path = SOURCES / filename
    book = load_workbook(path, read_only=True, data_only=False)
    raw = list(book[sheet].values)
    headers = list(raw[0])
    assert len(headers) == len(set(headers)) and all(isinstance(h, str) for h in headers)
    values = [dict(zip(headers, row, strict=True)) for row in raw[1:] if row[0] is not None]
    assert len(values) == expected and [r["item"] for r in values] == list(range(1, expected + 1))
    for row in values:
        assert all(value is not None and not isinstance(value, str) or key in {"secao", "tipo"}
                   for key, value in row.items()), row
        assert all(not isinstance(value, str) or not value.startswith("=") for value in row.values())
    return values, sha256(path.read_bytes()).hexdigest()


def sql_string(value: str) -> str:
    return "'" + value.replace("'", "''") + "'"


def number(value: object) -> str:
    result = Decimal(str(value))
    assert result.is_finite() and result > 0
    return format(result, "f")


def source_json(row: dict) -> str:
    return sql_string(json.dumps(row, ensure_ascii=False, separators=(",", ":"))) + "::jsonb"


def dimension_json(data: dict[str, int]) -> str:
    assert all(isinstance(v, int) and v > 0 for v in data.values())
    return sql_string(json.dumps(data, ensure_ascii=False, separators=(",", ":"))) + "::jsonb"


def record(table: str, item: int, shape: str, subtype: str, face: str, taper: str,
           height: object, load: object, moment: object, additional: object, mass: object,
           dimensions: dict[str, int], tolerances: dict[str, int], raw: dict, digest: str) -> str:
    return "(" + ",".join([
        sql_string(table), str(item), sql_string(str(uuid5(NAMESPACE_URL, f"concrefer:8451-2:{table}:{item}:{face}:{taper}"))),
        sql_string(shape), sql_string(subtype),
        sql_string(face), sql_string(taper), number(height), number(load),
        number(moment), number(additional), number(mass), dimension_json(dimensions),
        dimension_json(tolerances), source_json(raw), sql_string(digest),
    ]) + ")"


def build() -> tuple[str, Counter]:
    circular, circular_hash = rows("postes_circulares_tabela_A1.xlsx", "Postes_circulares", 47)
    dt, dt_hash = rows("postes_DT_tabela_A2.xlsx", "Postes_DT", 38)
    values: list[str] = []
    keys: set[tuple] = set()
    counts: Counter = Counter()
    for row in circular:
        assert row["secao"] == "circular"
        height_mm = int(Decimal(str(row["comprimento_nominal_m"])) * 1000)
        top = int(row["dimensao_a_mm"])
        for taper, base in (("A", row["dimensao_b_conicidade20_mm"]),
                            ("B", row["dimensao_b_conicidade15_mm"])):
            dimensions = {"comprimento": height_mm, "diametro_topo": top,
                          "diametro_base": int(base), "engastamento": int(row["cota_e_mm"]),
                          "furacao_f": int(row["cota_f_mm"]), "furacao_j": int(row["cota_j_mm"])}
            tolerances = {"comprimento": 50, "diametro_topo": 5, "diametro_base": 5,
                          "engastamento": 15, "furacao_f": 20, "furacao_j": 20}
            key = ("C", "C", taper, row["comprimento_nominal_m"], row["carga_nominal_dan"])
            assert key not in keys, key
            keys.add(key)
            values.append(record("A.1", row["item"], "C", row["tipo"], "C", taper,
                                 row["comprimento_nominal_m"], row["carga_nominal_dan"],
                                 row["momento_fletor_ma_danm"], row["forca_adicional_fa_dan"],
                                 row["massa_aproximada_kg"], dimensions, tolerances, row, circular_hash))
            counts["A.1"] += 1
    for row in dt:
        assert row["secao"] == "DT"
        height_mm = int(Decimal(str(row["comprimento_m"])) * 1000)
        dimensions = {"comprimento": height_mm,
                      "largura_topo": int(row["a_topo_mm"]), "largura_base": int(row["A_base_mm"]),
                      "espessura_topo": int(row["b_topo_mm"]), "espessura_base": int(row["B_base_mm"]),
                      "engastamento": int(row["e_mm"]),
                      "furacao_f": int(row["f_mm"]), "furacao_j": int(row["j_mm"])}
        tolerances = {"comprimento": 50, "largura_topo": 5, "largura_base": 5,
                      "espessura_topo": 5, "espessura_base": 5, "engastamento": 15,
                      "furacao_f": 20, "furacao_j": 20, "cota_t": 20, "cota_m": 15}
        for face, load_col, ma_col, fa_col in (
            ("A", "cn_face_a_dan", "ma_face_a_dan_m", "fa_face_a_dan"),
            ("B", "cn_face_b_dan", "ma_face_b_dan_m", "fa_face_b_dan"),
        ):
            key = ("DT", face, "A", row["comprimento_m"], row[load_col])
            assert key not in keys, key
            keys.add(key)
            values.append(record("A.2", row["item"], "DT", row["tipo"], face, "A",
                                 row["comprimento_m"], row[load_col], row[ma_col], row[fa_col],
                                 row["massa_aprox_kg"], dimensions, tolerances, row, dt_hash))
            counts["A.2"] += 1
    assert counts == {"A.1": 94, "A.2": 76}
    schema = """-- Generated from the two user-supplied A.1/A.2 workbooks. Do not edit rows by hand.
-- Rerun gerar_importacao.py after changing a source workbook.
BEGIN;
CREATE TABLE IF NOT EXISTS ensaio_postes.referencia_dimensional (
    tabela varchar(3) NOT NULL CHECK (tabela IN ('A.1','A.2')),
    item integer NOT NULL CHECK (item > 0),
    modelo_id uuid NOT NULL UNIQUE,
    tipo varchar(2) NOT NULL CHECK (tipo IN ('C','DT')),
    subtipo varchar(20) NOT NULL,
    face char(1) NOT NULL CHECK (face IN ('A','B','C')),
    conicidade char(1) NOT NULL CHECK (conicidade IN ('A','B')),
    comprimento_m numeric(7,2) NOT NULL CHECK (comprimento_m > 0),
    carga_nominal_dan numeric(9,2) NOT NULL CHECK (carga_nominal_dan > 0),
    momento_fletor_danm numeric(10,2) NOT NULL,
    forca_adicional_dan numeric(10,2) NOT NULL,
    massa_aproximada_kg numeric(10,2) NOT NULL,
    dimensoes_nominais jsonb NOT NULL,
    tolerancias_mm jsonb NOT NULL,
    dados_fonte jsonb NOT NULL,
    fonte_sha256 char(64) NOT NULL,
    PRIMARY KEY (tabela,item,face,conicidade),
    UNIQUE (tipo,face,conicidade,comprimento_m,carga_nominal_dan)
);
COMMENT ON TABLE ensaio_postes.referencia_dimensional IS 'Tabelas A.1/A.2 fornecidas pelo usuário; dimensões em mm, comprimento em m, cargas em daN. Massa apenas orientativa.';
GRANT SELECT ON ensaio_postes.referencia_dimensional TO postes_app;
INSERT INTO ensaio_postes.referencia_dimensional
(tabela,item,modelo_id,tipo,subtipo,face,conicidade,comprimento_m,carga_nominal_dan,
 momento_fletor_danm,forca_adicional_dan,massa_aproximada_kg,dimensoes_nominais,
 tolerancias_mm,dados_fonte,fonte_sha256)
VALUES
"""
    upsert = """
ON CONFLICT (tabela,item,face,conicidade) DO UPDATE SET
  modelo_id=EXCLUDED.modelo_id, tipo=EXCLUDED.tipo, subtipo=EXCLUDED.subtipo, comprimento_m=EXCLUDED.comprimento_m,
  carga_nominal_dan=EXCLUDED.carga_nominal_dan, momento_fletor_danm=EXCLUDED.momento_fletor_danm,
  forca_adicional_dan=EXCLUDED.forca_adicional_dan, massa_aproximada_kg=EXCLUDED.massa_aproximada_kg,
  dimensoes_nominais=EXCLUDED.dimensoes_nominais, tolerancias_mm=EXCLUDED.tolerancias_mm,
  dados_fonte=EXCLUDED.dados_fonte, fonte_sha256=EXCLUDED.fonte_sha256;

-- Existing catalog rows, manual overrides and test snapshots are preserved.
INSERT INTO ensaio_postes.poste_modelo
(id,tipo,face,conicidade,altura_m,"resistencia_daN","ma_daNm",norma_parte,
 descricao,dimensoes_nominais,ativo)
SELECT r.modelo_id::text,r.tipo,r.face,r.conicidade,r.comprimento_m,
       r.carga_nominal_dan,r.momento_fletor_danm,'8451-2',
       CASE WHEN r.tipo='C' THEN
         'C ' || replace(trim(trailing '.' from trim(trailing '0' from r.comprimento_m::text)),'.',',')
           || '/' || r.carga_nominal_dan::int
           || ' · ' || r.subtipo || ' · conicidade ' || r.conicidade
       ELSE
         'DT ' || replace(trim(trailing '.' from trim(trailing '0' from r.comprimento_m::text)),'.',',')
           || '/' || r.carga_nominal_dan::int
           || ' ' || r.face || ' · ' || r.subtipo
       END,
       '{}'::jsonb,true
FROM ensaio_postes.referencia_dimensional r
WHERE NOT EXISTS (
  SELECT 1 FROM ensaio_postes.poste_modelo p
  WHERE p.tipo=r.tipo AND p.face=r.face AND p.conicidade=r.conicidade
    AND p.altura_m=r.comprimento_m AND p."resistencia_daN"=r.carga_nominal_dan
);

DO $$
BEGIN
  IF (SELECT count(*) FROM ensaio_postes.referencia_dimensional WHERE tabela='A.1') <> 94
    OR (SELECT count(*) FROM ensaio_postes.referencia_dimensional WHERE tabela='A.2') <> 76 THEN
    RAISE EXCEPTION 'Unexpected A.1/A.2 reference counts';
  END IF;
END $$;
COMMIT;
"""
    return schema + ",\n".join(values) + "\n" + upsert, counts


if __name__ == "__main__":
    sql, counts = build()
    OUTPUT.write_text(sql, encoding="utf-8", newline="\n")
    print(f"{OUTPUT.name}: {counts['A.1']} circular variants, {counts['A.2']} DT faces")
