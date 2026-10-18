-- Cronoanalise v001. Apply with psql -v ON_ERROR_STOP=1 inside the existing
-- Laboratorio database. Additive and safe to rerun. No other schema is changed.
BEGIN;
CREATE SCHEMA IF NOT EXISTS cronoanalise;

DO $$ BEGIN
  CREATE TYPE cronoanalise.processo_etapa AS ENUM ('desforma','montagem','usina','concretagem');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE cronoanalise.tipo_atividade AS ENUM ('trabalho','deslocamento','espera');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS cronoanalise.schema_migrations (
  versao text PRIMARY KEY,
  aplicada_em timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cronoanalise.atividades (
  unidade_codigo text NOT NULL DEFAULT 'concrefer',
  codigo text NOT NULL,
  processo cronoanalise.processo_etapa NOT NULL,
  nome text NOT NULL,
  tipo cronoanalise.tipo_atividade NOT NULL,
  pessoas_padrao smallint NOT NULL DEFAULT 1 CHECK (pessoas_padrao BETWEEN 1 AND 20),
  estimativa_min numeric(8,3) NOT NULL CHECK (estimativa_min > 0),
  por_cacamba boolean NOT NULL DEFAULT false,
  ponto_inicio text NOT NULL,
  ponto_fim text NOT NULL,
  ordem smallint NOT NULL,
  ativo boolean NOT NULL DEFAULT true,
  atualizado_por text,
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (unidade_codigo,codigo)
);

CREATE TABLE IF NOT EXISTS cronoanalise.medicoes (
  id uuid PRIMARY KEY,
  unidade_codigo text NOT NULL DEFAULT 'concrefer',
  atividade_codigo text NOT NULL,
  processo cronoanalise.processo_etapa NOT NULL,
  setor smallint CHECK (setor BETWEEN 1 AND 4),
  forma text,
  tipo_poste text,
  equipamento text,
  batelada text,
  pessoas smallint NOT NULL CHECK (pessoas BETWEEN 1 AND 20),
  inicio timestamptz NOT NULL,
  fim timestamptz NOT NULL CHECK (fim >= inicio),
  bruta_s numeric(10,2) NOT NULL CHECK (bruta_s >= 0),
  duracao_s numeric(10,2) NOT NULL CHECK (duracao_s >= 0 AND duracao_s <= bruta_s + 1),
  distancia_m numeric(8,2) CHECK (distancia_m IS NULL OR distancia_m > 0),
  observacao text,
  cronometrista_nome text,
  autor_id text,
  dispositivo_id text,
  valido boolean NOT NULL DEFAULT true,
  invalid_motivo text,
  invalid_por text,
  invalid_em timestamptz,
  criado_em timestamptz NOT NULL DEFAULT now(),
  app_versao text,
  FOREIGN KEY (unidade_codigo,atividade_codigo)
    REFERENCES cronoanalise.atividades(unidade_codigo,codigo),
  CHECK (valido OR invalid_motivo IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS medicoes_ativ_idx ON cronoanalise.medicoes(unidade_codigo,atividade_codigo) WHERE valido;
CREATE INDEX IF NOT EXISTS medicoes_inicio_idx ON cronoanalise.medicoes(unidade_codigo,inicio DESC);
CREATE INDEX IF NOT EXISTS medicoes_estrato_idx ON cronoanalise.medicoes(unidade_codigo,atividade_codigo,setor,tipo_poste) WHERE valido;

CREATE TABLE IF NOT EXISTS cronoanalise.pausas (
  id bigserial PRIMARY KEY,
  medicao_id uuid NOT NULL REFERENCES cronoanalise.medicoes(id) ON DELETE CASCADE,
  inicio timestamptz NOT NULL,
  fim timestamptz NOT NULL CHECK (fim >= inicio),
  motivo text NOT NULL CHECK (length(trim(motivo)) > 0)
);
CREATE INDEX IF NOT EXISTS pausas_medicao_idx ON cronoanalise.pausas(medicao_id);

CREATE TABLE IF NOT EXISTS cronoanalise.auditoria (
  id bigserial PRIMARY KEY,
  em timestamptz NOT NULL DEFAULT now(),
  usuario_id text,
  tabela text NOT NULL,
  registro_id text NOT NULL,
  acao text NOT NULL,
  antes jsonb,
  depois jsonb,
  justificativa text
);
CREATE INDEX IF NOT EXISTS auditoria_registro_idx ON cronoanalise.auditoria(tabela,registro_id);

CREATE TABLE IF NOT EXISTS cronoanalise.parametros_dimensionamento (
  unidade_codigo text PRIMARY KEY DEFAULT 'concrefer',
  dados jsonb NOT NULL,
  atualizado_por text,
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS cronoanalise.layout_setores (
  unidade_codigo text NOT NULL DEFAULT 'concrefer',
  setor smallint NOT NULL CHECK (setor BETWEEN 1 AND 4),
  distancia_monovia_m numeric(8,2) NOT NULL,
  filas smallint NOT NULL CHECK (filas >= 1),
  formas_por_fila smallint NOT NULL CHECK (formas_por_fila >= 1),
  primeira_forma_m numeric(8,2) NOT NULL,
  ultima_forma_m numeric(8,2) NOT NULL,
  lancamento_min_por_forma numeric(6,2) NOT NULL,
  regra_cacambas text NOT NULL,
  corredor_m numeric(8,2),
  setor_montagem_m numeric(8,2),
  atualizado_por text,
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (unidade_codigo,setor)
);
CREATE TABLE IF NOT EXISTS cronoanalise.config_simulacao (
  unidade_codigo text PRIMARY KEY DEFAULT 'concrefer',
  dados jsonb NOT NULL,
  atualizado_por text,
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS cronoanalise.listas (
  unidade_codigo text NOT NULL DEFAULT 'concrefer',
  chave text NOT NULL,
  valores jsonb NOT NULL,
  PRIMARY KEY (unidade_codigo,chave)
);
CREATE TABLE IF NOT EXISTS cronoanalise.cenarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unidade_codigo text NOT NULL DEFAULT 'concrefer',
  nome text NOT NULL,
  dados jsonb NOT NULL,
  criado_por text,
  criado_em timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS cronoanalise.simulacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unidade_codigo text NOT NULL DEFAULT 'concrefer',
  tipo text NOT NULL CHECK (tipo IN ('base_cenario','sequencias')),
  replicacoes smallint NOT NULL CHECK (replicacoes > 0),
  entradas jsonb NOT NULL,
  resultado jsonb NOT NULL,
  motor_versao text NOT NULL,
  criado_por text,
  criado_em timestamptz NOT NULL DEFAULT now(),
  nota text
);
CREATE INDEX IF NOT EXISTS simulacoes_data_idx ON cronoanalise.simulacoes(unidade_codigo,criado_em DESC);

INSERT INTO cronoanalise.schema_migrations(versao) VALUES ('001_schema') ON CONFLICT DO NOTHING;
COMMIT;
