"""Prepare the PCP form/model reference from Ricardo's FORMAS.xlsx.

The workbook supplies data only. By default, prints SQL; use --output to save it.
Apply only after backing up pcp_unificado_teste.
"""

from __future__ import annotations

import argparse
import hashlib
from pathlib import Path

from openpyxl import load_workbook


def literal(value: object) -> str:
    return "'" + str(value).replace("'", "''") + "'"


def generate(path: Path) -> str:
    digest = hashlib.sha256(path.read_bytes()).hexdigest()
    sheet = load_workbook(path, read_only=True, data_only=True).active
    rows = []
    for line, row in enumerate(sheet.values, 1):
        if line == 1 or not any(cell is not None for cell in row[:3]):
            continue
        code, model, form_type = row[:3]
        if not all(cell is not None and str(cell).strip() for cell in (code, model, form_type)):
            raise ValueError(f"Linha {line}: código, modelo e tipo de forma são obrigatórios")
        rows.append((str(code).strip(), str(model).strip(), str(form_type).strip(), line))
    if len(rows) != 34 or len({r[0] for r in rows}) != len(rows) or len({r[2] for r in rows}) != len(rows):
        raise ValueError("Planilha inesperada: exigidas 34 linhas com códigos únicos")
    values = ",\n".join(
        f"({literal(code)}, {literal(model)}, {literal(form)}, {line}, {literal(digest)})"
        for code, model, form, line in rows
    )
    return f"""BEGIN;
CREATE TABLE IF NOT EXISTS public.catalogo_tipos_forma (
    codigo_modelo_mega text PRIMARY KEY,
    modelo_poste text NOT NULL,
    codigo_tipo_forma text NOT NULL UNIQUE,
    produto_id integer REFERENCES public.produtos(id),
    origem_linha integer NOT NULL,
    origem_sha256 char(64) NOT NULL
);
INSERT INTO public.catalogo_tipos_forma
    (codigo_modelo_mega, modelo_poste, codigo_tipo_forma, origem_linha, origem_sha256)
VALUES
{values}
ON CONFLICT (codigo_modelo_mega) DO UPDATE SET
    modelo_poste=EXCLUDED.modelo_poste,
    codigo_tipo_forma=EXCLUDED.codigo_tipo_forma,
    origem_linha=EXCLUDED.origem_linha,
    origem_sha256=EXCLUDED.origem_sha256;
-- Only exact model descriptions or identical product codes are linked automatically.
UPDATE public.catalogo_tipos_forma c SET produto_id = p.id
FROM public.produtos p
WHERE (regexp_replace(upper(c.modelo_poste), '[^A-Z0-9]', '', 'g') =
       regexp_replace(upper(p.nome), '[^A-Z0-9]', '', 'g')
       OR c.codigo_modelo_mega = p.codigo)
  AND NOT EXISTS (
    SELECT 1 FROM public.produtos other
    WHERE other.id <> p.id AND
      (regexp_replace(upper(c.modelo_poste), '[^A-Z0-9]', '', 'g') =
       regexp_replace(upper(other.nome), '[^A-Z0-9]', '', 'g')
       OR c.codigo_modelo_mega = other.codigo)
  );
ALTER TABLE public.mapeamento_formas
    ADD COLUMN IF NOT EXISTS codigo_tipo_forma text,
    ADD COLUMN IF NOT EXISTS codigo_modelo_mega text;
UPDATE public.mapeamento_formas m SET
    codigo_tipo_forma = c.codigo_tipo_forma,
    codigo_modelo_mega = c.codigo_modelo_mega
FROM public.catalogo_tipos_forma c
WHERE upper(split_part(m.codigo_forma, '-', 1)) = upper(c.codigo_tipo_forma)
  AND (m.codigo_tipo_forma IS DISTINCT FROM c.codigo_tipo_forma
       OR m.codigo_modelo_mega IS DISTINCT FROM c.codigo_modelo_mega);
-- Generic S1/S2 identifiers have no model code in their prefix. Link only
-- unambiguous exact model descriptions already present in PCP.
WITH candidates AS (
 SELECT m.id, c.codigo_tipo_forma, c.codigo_modelo_mega,
        count(*) OVER (PARTITION BY m.id) AS matches
 FROM public.mapeamento_formas m
 JOIN public.catalogo_tipos_forma c ON
   regexp_replace(upper(m.poste),'[^A-Z0-9]','','g') =
   regexp_replace(upper(c.modelo_poste),'[^A-Z0-9]','','g')
 WHERE m.codigo_modelo_mega IS NULL
)
UPDATE public.mapeamento_formas m SET
    codigo_tipo_forma=c.codigo_tipo_forma,
    codigo_modelo_mega=c.codigo_modelo_mega
FROM candidates c WHERE m.id=c.id AND c.matches=1;
WITH aliases(prefixo, codigo_tipo_forma) AS (VALUES
  ('100','SUB 100'), ('200','SUB 200 TC'), ('SB','SUB 100 E'),
  ('300-VL','300L'), ('300-VR','300R')
)
UPDATE public.mapeamento_formas m SET
    codigo_tipo_forma=c.codigo_tipo_forma,
    codigo_modelo_mega=c.codigo_modelo_mega
FROM aliases a JOIN public.catalogo_tipos_forma c
  ON c.codigo_tipo_forma=a.codigo_tipo_forma
WHERE m.codigo_modelo_mega IS NULL
  AND (m.codigo_forma=a.prefixo OR split_part(m.codigo_forma,'-',1)=a.prefixo);
UPDATE public.mapeamento_formas m SET
    codigo_tipo_forma=c.codigo_tipo_forma,
    codigo_modelo_mega=c.codigo_modelo_mega
FROM public.catalogo_tipos_forma c
WHERE m.codigo_modelo_mega IS NULL AND c.codigo_tipo_forma='TOTEM'
  AND m.codigo_forma LIKE 'Totem%';
COMMIT;
SELECT 'catalogo',count(*),count(produto_id) FROM public.catalogo_tipos_forma;
SELECT 'formas_vinculadas',count(*) FROM public.mapeamento_formas WHERE codigo_modelo_mega IS NOT NULL;
"""


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("workbook", type=Path)
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    sql = generate(args.workbook)
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(sql, encoding="utf-8")
        print(args.output)
    else:
        print(sql)


if __name__ == "__main__":
    main()
