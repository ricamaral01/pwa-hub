-- Espelho SOMENTE DE LEITURA para a aplicação oficial do Unificado.
-- Fonte continua supervisorio_db.public.tbl_receitas na VPS antiga.
-- Aplicar somente em mapa_unificado_teste, banco da instância oficial Mapa.
BEGIN;
DO $$ BEGIN
    IF current_database() <> 'mapa_unificado_teste' THEN
        RAISE EXCEPTION 'Banco alvo incorreto para Usinas produção';
    END IF;
END $$;

CREATE SCHEMA IF NOT EXISTS usinas;
REVOKE ALL ON SCHEMA usinas FROM PUBLIC;

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

GRANT CONNECT ON DATABASE mapa_unificado_teste TO "usinas-sync";
GRANT USAGE ON SCHEMA usinas TO "usinas-sync", mapa_api_login;
GRANT SELECT, INSERT, UPDATE, DELETE ON usinas.receitas, usinas.sync_status TO "usinas-sync";
GRANT SELECT ON usinas.receitas, usinas.sync_status TO mapa_api_login;
COMMIT;
