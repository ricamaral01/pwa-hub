-- Registros de levantamento de defeitos dos postes desformados nos setores 3 e 4.
BEGIN;

CREATE TABLE IF NOT EXISTS public.inspecao_defeitos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setor text NOT NULL CHECK (setor IN ('Setor 3', 'Setor 4')),
  serie text NOT NULL CHECK (length(trim(serie)) BETWEEN 1 AND 80),
  data_desforma date NOT NULL,
  turno text NOT NULL CHECK (turno IN ('1','2','3')),
  tipo text NOT NULL CHECK (length(trim(tipo)) BETWEEN 1 AND 120),
  forma_numero text NOT NULL CHECK (length(trim(forma_numero)) BETWEEN 1 AND 80),
  classe text NOT NULL CHECK (classe IN ('A','B','C')),
  observacoes text NOT NULL DEFAULT '',
  defeitos jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(defeitos) = 'array'),
  producao_record_id text,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT inspecao_defeitos_setor_serie_key UNIQUE (setor, serie)
);
CREATE INDEX IF NOT EXISTS inspecao_defeitos_data_setor_idx
  ON public.inspecao_defeitos (data_desforma DESC, setor);
CREATE INDEX IF NOT EXISTS inspecao_defeitos_producao_idx
  ON public.inspecao_defeitos (producao_record_id)
  WHERE producao_record_id IS NOT NULL;

CREATE SCHEMA IF NOT EXISTS api;
CREATE OR REPLACE VIEW api.inspecao_defeitos AS SELECT * FROM public.inspecao_defeitos;
GRANT SELECT ON api.inspecao_defeitos TO mapa_api_reader;
GRANT SELECT, INSERT, UPDATE, DELETE ON api.inspecao_defeitos TO mapa_api_writer;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inspecao_defeitos TO mapa_api_writer;

COMMIT;
NOTIFY pgrst, 'reload schema';
