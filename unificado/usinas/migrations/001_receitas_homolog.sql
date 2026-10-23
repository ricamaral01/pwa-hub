-- Etapa 2 / 2B: aplicar somente no banco de homologacao do Unificado.
-- Nenhum objeto ou permissao e criado na VPS antiga.
BEGIN;

CREATE SCHEMA IF NOT EXISTS usinas;
CREATE SCHEMA IF NOT EXISTS usinas_write;
REVOKE ALL ON SCHEMA usinas FROM PUBLIC;
REVOKE ALL ON SCHEMA usinas_write FROM PUBLIC;

CREATE TABLE IF NOT EXISTS usinas.receitas (
    unidade_id text NOT NULL CHECK (unidade_id = 'campinas'),
    origem_banco text NOT NULL CHECK (origem_banco = 'supervisorio_db'),
    origem_id bigint NOT NULL,
    nome text NOT NULL,
    agregado1 numeric, agregado2 numeric, agregado3 numeric, agregado4 numeric,
    agregado5 numeric, agregado6 numeric, agregado7 numeric,
    cimento1 numeric, cimento2 numeric, cimento3 numeric, cimento4 numeric,
    agua numeric, aditivo1 numeric, aditivo2 numeric, aditivo3 numeric,
    ativa boolean NOT NULL,
    alterado integer NOT NULL,
    nome_traco varchar NOT NULL,
    cimento numeric, adicao_1 numeric, adicao_2 numeric,
    areia_1 numeric, areia_2 numeric, areia_3 numeric,
    brita_1 numeric, brita_2 numeric, aditivo_1 numeric, aditivo_2 numeric,
    ac numeric, r24h numeric, r3 numeric, r7 numeric, r28 numeric,
    created_at timestamp without time zone,
    revisao_grupo uuid NOT NULL,
    revisao_numero integer NOT NULL,
    revisao_origem_id bigint,
    observacao_revisao text,
    revisado_em timestamp without time zone,
    alterado_por text,
    _source_hash char(64) NOT NULL CHECK (_source_hash ~ '^[0-9a-f]{64}$'),
    ingested_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (unidade_id, origem_banco, origem_id)
);
CREATE INDEX IF NOT EXISTS receitas_grupo_idx
    ON usinas.receitas (unidade_id, revisao_grupo, revisao_numero DESC);

CREATE TABLE IF NOT EXISTS usinas.sync_status (
    unidade_id text NOT NULL,
    origem_banco text NOT NULL,
    origem_tabela text NOT NULL,
    last_success_at timestamptz,
    source_count bigint,
    mirror_count bigint,
    last_error text,
    updated_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (unidade_id, origem_banco, origem_tabela)
);

-- Estrutura inerte: nenhuma flag de despacho habilitada nesta migracao.
CREATE TABLE IF NOT EXISTS usinas_write.permissions (
    unidade_id text NOT NULL,
    origem_tabela text NOT NULL,
    acao text NOT NULL,
    despacho_habilitado boolean NOT NULL DEFAULT false,
    aprovado_por text,
    aprovado_em timestamptz,
    PRIMARY KEY (unidade_id, origem_tabela, acao),
    CHECK (NOT despacho_habilitado OR (aprovado_por IS NOT NULL AND aprovado_em IS NOT NULL))
);
INSERT INTO usinas_write.permissions (unidade_id, origem_tabela, acao)
VALUES ('campinas', 'tbl_receitas', 'criar'),
       ('campinas', 'tbl_receitas', 'nova_revisao'),
       ('campinas', 'tbl_receitas', 'alterar_ativa')
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS usinas_write.outbox (
    operation_id uuid PRIMARY KEY,
    idempotency_key text NOT NULL UNIQUE,
    unidade_id text NOT NULL,
    origem_tabela text NOT NULL,
    origem_id bigint,
    acao text NOT NULL,
    ator_iam text NOT NULL,
    identidade_legada text,
    base_source_hash char(64),
    payload jsonb NOT NULL,
    antes jsonb,
    depois jsonb,
    estado text NOT NULL DEFAULT 'pendente'
        CHECK (estado IN ('pendente','enviando','confirmado','conflito',
                         'resultado_desconhecido','erro','cancelado')),
    tentativas integer NOT NULL DEFAULT 0 CHECK (tentativas >= 0),
    endpoint text,
    codigo_http integer,
    ultimo_erro text,
    criado_em timestamptz NOT NULL DEFAULT now(),
    enviado_em timestamptz,
    confirmado_em timestamptz,
    atualizado_em timestamptz NOT NULL DEFAULT now(),
    FOREIGN KEY (unidade_id, origem_tabela, acao)
        REFERENCES usinas_write.permissions (unidade_id, origem_tabela, acao)
);
CREATE INDEX IF NOT EXISTS outbox_fila_idx
    ON usinas_write.outbox (estado, criado_em);
CREATE OR REPLACE VIEW usinas_write.fila_erros AS
    SELECT operation_id, unidade_id, origem_tabela, origem_id, acao,
           ator_iam, estado, tentativas, ultimo_erro, criado_em, atualizado_em
    FROM usinas_write.outbox
    WHERE estado IN ('conflito', 'resultado_desconhecido', 'erro');

COMMIT;
