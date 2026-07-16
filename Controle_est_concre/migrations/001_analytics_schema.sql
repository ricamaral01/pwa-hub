-- Migration 001: Analytics and Performance Schema

-- 1. Faixas de Resistência (Metas)
CREATE TABLE IF NOT EXISTS faixas_resistencia (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  idade_dias integer NOT NULL UNIQUE,
  valor_minimo numeric(8,2) NOT NULL,
  valor_maximo numeric(8,2) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Popula metas padrão
INSERT INTO faixas_resistencia (idade_dias, valor_minimo, valor_maximo) VALUES
  (1, 8.00, 14.00),
  (3, 16.00, 24.00),
  (7, 22.00, 32.00),
  (28, 32.00, 42.00)
ON CONFLICT (idade_dias) DO UPDATE SET
  valor_minimo = excluded.valor_minimo,
  valor_maximo = excluded.valor_maximo,
  updated_at = now();

-- 2. Histórico de Eventos (Auditoria de todas as alterações)
CREATE TABLE IF NOT EXISTS rompimentos_eventos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rompimento_id uuid NOT NULL,
  source text NOT NULL,
  etiqueta_id text,
  traco_id text NOT NULL,
  idade_dias integer NOT NULL,
  cp text NOT NULL,
  data_moldagem date,
  hora_moldagem text,
  data_ruptura date,
  mpa numeric(8,2) NOT NULL,
  status_meta text,
  meta_min numeric(8,2),
  meta_max numeric(8,2),
  responsavel text,
  qr_raw text,
  payload_original jsonb NOT NULL DEFAULT '{}'::jsonb,
  tipo_evento text NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
  client_created_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rompimentos_eventos_rompimento_id ON rompimentos_eventos (rompimento_id);
CREATE INDEX IF NOT EXISTS idx_rompimentos_eventos_created_at ON rompimentos_eventos (created_at DESC);

-- 3. Estado Atual dos Rompimentos (Única fonte de verdade operacional, elimina DISTINCT ON)
CREATE TABLE IF NOT EXISTS rompimentos_atuais (
  id uuid PRIMARY KEY, -- id único originado do cliente/Sheets
  source text NOT NULL,
  etiqueta_id text,
  traco_id text NOT NULL,
  idade_dias integer NOT NULL,
  cp text NOT NULL,
  data_moldagem date,
  hora_moldagem text,
  data_ruptura date,
  mpa numeric(8,2) NOT NULL,
  status_meta text,
  meta_min numeric(8,2),
  meta_max numeric(8,2),
  responsavel text,
  qr_raw text,
  payload_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  client_created_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_rompimentos_atuais_natural_key UNIQUE (data_moldagem, traco_id, idade_dias, cp)
);

CREATE INDEX IF NOT EXISTS idx_rompimentos_atuais_data_traco_idade ON rompimentos_atuais (data_moldagem DESC, traco_id ASC, idade_dias ASC);
CREATE INDEX IF NOT EXISTS idx_rompimentos_atuais_updated_at ON rompimentos_atuais (updated_at DESC);

-- 4. Grupos de Corpos de Prova (CP1 e CP2 Consolidados)
CREATE TABLE IF NOT EXISTS rompimentos_grupos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  data_moldagem date NOT NULL,
  traco_id text NOT NULL,
  idade_dias integer NOT NULL,
  data_ruptura date,
  mpa_cp1 numeric(8,2),
  mpa_cp2 numeric(8,2),
  media_mpa numeric(8,2),
  quantidade_cp integer NOT NULL DEFAULT 0,
  status_resultado text NOT NULL, -- 'OK', 'NOK', 'AMP', 'PEND'
  meta_minima numeric(8,2),
  meta_maxima numeric(8,2),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_rompimentos_grupos_key UNIQUE (data_moldagem, traco_id, idade_dias)
);

CREATE INDEX IF NOT EXISTS idx_rompimentos_grupos_data_moldagem ON rompimentos_grupos (data_moldagem DESC);
CREATE INDEX IF NOT EXISTS idx_rompimentos_grupos_traco_idade ON rompimentos_grupos (traco_id, idade_dias);

-- 5. Estatística Diária
CREATE TABLE IF NOT EXISTS estatistica_diaria (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  data_referencia date NOT NULL,
  traco_id text NOT NULL,
  idade_dias integer NOT NULL,
  quantidade_grupos integer NOT NULL DEFAULT 0,
  quantidade_corpos_prova integer NOT NULL DEFAULT 0,
  quantidade_ok integer NOT NULL DEFAULT 0,
  quantidade_nok integer NOT NULL DEFAULT 0,
  quantidade_amp integer NOT NULL DEFAULT 0,
  media_mpa numeric(8,2),
  desvio_padrao numeric(8,2),
  valor_minimo numeric(8,2),
  valor_maximo numeric(8,2),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_estatistica_diaria_key UNIQUE (data_referencia, traco_id, idade_dias)
);

CREATE INDEX IF NOT EXISTS idx_estatistica_diaria_ref ON estatistica_diaria (data_referencia DESC);

-- 6. Estatística Mensal
CREATE TABLE IF NOT EXISTS estatistica_mensal (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ano_mes text NOT NULL, -- 'YYYY-MM'
  traco_id text NOT NULL,
  idade_dias integer NOT NULL,
  quantidade_grupos integer NOT NULL DEFAULT 0,
  quantidade_corpos_prova integer NOT NULL DEFAULT 0,
  quantidade_ok integer NOT NULL DEFAULT 0,
  quantidade_nok integer NOT NULL DEFAULT 0,
  quantidade_amp integer NOT NULL DEFAULT 0,
  media_mpa numeric(8,2),
  desvio_padrao numeric(8,2),
  valor_minimo numeric(8,2),
  valor_maximo numeric(8,2),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_estatistica_mensal_key UNIQUE (ano_mes, traco_id, idade_dias)
);

CREATE INDEX IF NOT EXISTS idx_estatistica_mensal_ref ON estatistica_mensal (ano_mes DESC);

-- 7. Fila de Recálculo Incremental
CREATE TABLE IF NOT EXISTS fila_recalculo (
  id bigserial PRIMARY KEY,
  data_moldagem date NOT NULL,
  traco_id text NOT NULL,
  idade_dias integer NOT NULL,
  status text NOT NULL DEFAULT 'pendente', -- 'pendente', 'processando', 'concluido', 'erro'
  tentativas integer NOT NULL DEFAULT 0,
  erro text,
  created_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz,
  processed_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_fila_recalculo_lookup ON fila_recalculo (status, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_fila_recalculo_natural_key ON fila_recalculo (data_moldagem, traco_id, idade_dias) WHERE status = 'pendente';
