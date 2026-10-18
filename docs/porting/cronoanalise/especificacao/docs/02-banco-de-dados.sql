-- 02 · Banco de dados do submódulo Laboratório › Cronoanálise (schema próprio no banco do Unificado)
-- Implementar como NOVA revisão Alembic do Unificado, encadeada no head atual. Migração aditiva: só cria o schema e as tabelas abaixo.
-- Referências externas (descobrir nomes reais no Unificado e ajustar):
--   <usuarios_unificado>(id)  = tabela de usuários do Unificado
--   <unidades_unificado>(id)  = tabela/coluna de unidade do Unificado (unidade_id)
-- Os tipos smallint (unidade) e uuid (usuário) abaixo são presumidos: use o tipo real das colunas de id do Unificado.
-- Convenções: UTC em timestamptz; ids de medição gerados no aparelho (UUID) para sincronização idempotente;
-- nada é apagado de medições: invalidação com motivo e trilha de auditoria.

CREATE SCHEMA IF NOT EXISTS cronoanalise;
SET search_path = cronoanalise, public;

-- ---------- catálogo ----------
CREATE TYPE processo_etapa AS ENUM ('desforma','montagem','usina','concretagem');
CREATE TYPE tipo_atividade AS ENUM ('trabalho','deslocamento','espera');

CREATE TABLE atividades (
  unidade_id      smallint NOT NULL REFERENCES <unidades_unificado>(id),
  codigo          text NOT NULL,                      -- 'P08', 'U02'...
  processo        processo_etapa NOT NULL,
  nome            text NOT NULL,
  tipo            tipo_atividade NOT NULL,
  pessoas_padrao  smallint NOT NULL DEFAULT 1 CHECK (pessoas_padrao BETWEEN 1 AND 20),
  estimativa_min  numeric(8,3) NOT NULL CHECK (estimativa_min > 0),
  por_cacamba     boolean NOT NULL DEFAULT false,     -- ocorre uma vez por caçamba (frequência = caçambas/forma)
  ponto_inicio    text NOT NULL,
  ponto_fim       text NOT NULL,
  ordem           smallint NOT NULL,
  ativo           boolean NOT NULL DEFAULT true,
  atualizado_por  uuid REFERENCES <usuarios_unificado>(id),
  atualizado_em   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (unidade_id, codigo)
);

-- ---------- medições (cronoanálise) ----------
CREATE TABLE medicoes (
  id                 uuid PRIMARY KEY,                -- gerado no aparelho
  unidade_id         smallint NOT NULL REFERENCES <unidades_unificado>(id),
  atividade_codigo   text NOT NULL,
  processo           processo_etapa NOT NULL,
  setor              smallint CHECK (setor BETWEEN 1 AND 4),
  forma              text,
  tipo_poste         text,
  equipamento        text,
  batelada           text,
  pessoas            smallint NOT NULL CHECK (pessoas BETWEEN 1 AND 20),
  inicio             timestamptz NOT NULL,
  fim                timestamptz NOT NULL CHECK (fim >= inicio),
  bruta_s            numeric(10,2) NOT NULL CHECK (bruta_s >= 0),
  duracao_s          numeric(10,2) NOT NULL CHECK (duracao_s >= 0),  -- efetiva (sem pausas)
  distancia_m        numeric(8,2) CHECK (distancia_m IS NULL OR distancia_m > 0),
  observacao         text,
  cronometrista_nome text,
  autor_id           uuid REFERENCES <usuarios_unificado>(id),
  dispositivo_id     text,
  valido             boolean NOT NULL DEFAULT true,
  invalid_motivo     text,
  invalid_por        uuid REFERENCES <usuarios_unificado>(id),
  invalid_em         timestamptz,
  criado_em          timestamptz NOT NULL DEFAULT now(),   -- chegada ao servidor
  app_versao         text,
  FOREIGN KEY (unidade_id, atividade_codigo) REFERENCES atividades(unidade_id, codigo),
  CHECK (valido OR invalid_motivo IS NOT NULL)
);
CREATE INDEX medicoes_ativ_idx   ON medicoes (unidade_id, atividade_codigo) WHERE valido;
CREATE INDEX medicoes_inicio_idx ON medicoes (unidade_id, inicio DESC);
CREATE INDEX medicoes_estrato_idx ON medicoes (unidade_id, atividade_codigo, setor, tipo_poste) WHERE valido;

CREATE TABLE pausas (
  id          bigserial PRIMARY KEY,
  medicao_id  uuid NOT NULL REFERENCES medicoes(id) ON DELETE CASCADE,
  inicio      timestamptz NOT NULL,
  fim         timestamptz NOT NULL CHECK (fim >= inicio),
  motivo      text NOT NULL
);
CREATE INDEX ON pausas (medicao_id);

-- ---------- auditoria (toda alteração em medições, catálogo, parâmetros) ----------
-- Se o Unificado já tem tabela de auditoria central, use-a e não crie esta.
CREATE TABLE auditoria (
  id            bigserial PRIMARY KEY,
  em            timestamptz NOT NULL DEFAULT now(),
  usuario_id    uuid REFERENCES <usuarios_unificado>(id),
  tabela        text NOT NULL,
  registro_id   text NOT NULL,
  acao          text NOT NULL,                        -- 'criar','alterar','invalidar','restaurar','login','login_falhou'...
  antes         jsonb,
  depois        jsonb,
  justificativa text
);
CREATE INDEX ON auditoria (tabela, registro_id);

-- ---------- parâmetros ----------
CREATE TABLE parametros_dimensionamento (
  unidade_id     smallint PRIMARY KEY REFERENCES <unidades_unificado>(id),
  dados          jsonb NOT NULL,          -- ver seeds/parametros.json → dimensionamento (+ "over": {codigo:{ritmo,freq,inc}})
  atualizado_por uuid REFERENCES <usuarios_unificado>(id),
  atualizado_em  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE layout_setores (
  unidade_id               smallint NOT NULL REFERENCES <unidades_unificado>(id),
  setor                    smallint NOT NULL CHECK (setor BETWEEN 1 AND 4),
  distancia_monovia_m      numeric(8,2) NOT NULL,
  filas                    smallint NOT NULL CHECK (filas >= 1),
  formas_por_fila          smallint NOT NULL CHECK (formas_por_fila >= 1),
  primeira_forma_m         numeric(8,2) NOT NULL,
  ultima_forma_m           numeric(8,2) NOT NULL,
  lancamento_min_por_forma numeric(6,2) NOT NULL,
  regra_cacambas           text NOT NULL,         -- '1/3' ou '1-20: 1/2; 21-40: 1; 41-52: 1,5'
  corredor_m               numeric(8,2),          -- null = meio do setor
  setor_montagem_m         numeric(8,2),          -- null = acesso pelo corredor
  atualizado_por           uuid REFERENCES <usuarios_unificado>(id),
  atualizado_em            timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (unidade_id, setor)
);

CREATE TABLE config_simulacao (
  unidade_id     smallint PRIMARY KEY REFERENCES <unidades_unificado>(id),
  dados          jsonb NOT NULL,          -- seeds/parametros.json → simulacao_base
  atualizado_por uuid REFERENCES <usuarios_unificado>(id),
  atualizado_em  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE cenarios (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unidade_id  smallint NOT NULL REFERENCES <unidades_unificado>(id),
  nome        text NOT NULL,
  dados       jsonb NOT NULL,             -- mesma forma de config_simulacao.dados + layout opcional
  criado_por  uuid REFERENCES <usuarios_unificado>(id),
  criado_em   timestamptz NOT NULL DEFAULT now()
);

-- ---------- resultados de simulação (rastreabilidade das decisões) ----------
CREATE TABLE simulacoes (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unidade_id   smallint NOT NULL REFERENCES <unidades_unificado>(id),
  tipo         text NOT NULL CHECK (tipo IN ('base_cenario','sequencias')),
  replicacoes  smallint NOT NULL,
  entradas     jsonb NOT NULL,            -- config, layout, tempos usados (média/CV/fonte por atividade), sementes
  resultado    jsonb NOT NULL,            -- métricas agregadas com IC 95%
  motor_versao text NOT NULL,
  criado_por   uuid REFERENCES <usuarios_unificado>(id),
  criado_em    timestamptz NOT NULL DEFAULT now(),
  nota         text
);
CREATE INDEX ON simulacoes (unidade_id, criado_em DESC);
