-- Alinha padrões/obrigatoriedade observáveis pela OpenAPI oficial.
-- Aplicar somente a mapa_unificado_teste, depois de backup restaurado em teste.
BEGIN;

CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
GRANT USAGE ON SCHEMA extensions TO mapa_api_writer;

ALTER TABLE public.usuarios
  ALTER COLUMN ativo DROP NOT NULL,
  ALTER COLUMN primeiro_acesso DROP NOT NULL,
  ALTER COLUMN primeiro_acesso SET DEFAULT true,
  ALTER COLUMN created_at SET DEFAULT timezone('utc'::text, now()),
  ALTER COLUMN updated_at SET DEFAULT timezone('utc'::text, now());

ALTER TABLE public.programacao_pcp
  ALTER COLUMN id SET DEFAULT extensions.uuid_generate_v4(),
  ALTER COLUMN data_hora SET DEFAULT timezone('utc'::text, now()),
  ALTER COLUMN quantidade SET DEFAULT 1;

ALTER TABLE public.liberacao_formas
  ALTER COLUMN id SET DEFAULT extensions.uuid_generate_v4(),
  ALTER COLUMN data_hora SET DEFAULT timezone('utc'::text, now());

ALTER TABLE public.producao
  ALTER COLUMN id SET DEFAULT extensions.uuid_generate_v4(),
  ALTER COLUMN data_hora SET DEFAULT timezone('utc'::text, now()),
  ALTER COLUMN tipo_concreto SET DEFAULT 'Padrão';

ALTER TABLE public.montagem_poste
  ALTER COLUMN banco SET DEFAULT 'montagem_poste',
  ALTER COLUMN created_at SET DEFAULT timezone('utc'::text, now()),
  ALTER COLUMN updated_at SET DEFAULT timezone('utc'::text, now());

COMMIT;
