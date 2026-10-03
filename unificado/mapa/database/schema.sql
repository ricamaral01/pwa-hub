-- Banco isolado do Mapa unificado. Aplicar somente em mapa_unificado_teste.
-- As colunas operacionais refletem o contrato REST observado em 02/10/2026.
-- Senhas do Supabase são convertidas em hash Argon2id durante a importação.

BEGIN;

CREATE TABLE IF NOT EXISTS usuarios (
    id text PRIMARY KEY,
    nome text NOT NULL,
    perfil text NOT NULL,
    senha_hash text NOT NULL,
    ativo boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    setor text,
    primeiro_acesso boolean NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS usuarios_nome_ativo_idx ON usuarios (lower(nome), ativo);

CREATE TABLE IF NOT EXISTS programacao_pcp (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    data_fabricacao date NOT NULL,
    setor text NOT NULL,
    forma text NOT NULL,
    modelo text,
    codigo_poste text,
    descricao_poste text,
    codigo_produto text,
    quantidade integer,
    data_hora timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS programacao_pcp_data_setor_forma_idx
    ON programacao_pcp (data_fabricacao, setor, forma);

CREATE TABLE IF NOT EXISTS liberacao_formas (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    data_fabricacao date NOT NULL,
    setor text NOT NULL,
    forma text NOT NULL,
    colaborador text,
    data_hora timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS liberacao_formas_data_setor_forma_idx
    ON liberacao_formas (data_fabricacao, setor, forma);

CREATE TABLE IF NOT EXISTS producao (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    data_hora timestamptz NOT NULL DEFAULT now(),
    setor text NOT NULL,
    forma text NOT NULL,
    modelo text,
    tipo_concreto text,
    colaborador text,
    data_fabricacao date,
    status text NOT NULL,
    codigo_poste text,
    descricao_poste text,
    codigo_produto text,
    vibrado boolean
);
CREATE INDEX IF NOT EXISTS producao_data_setor_forma_idx
    ON producao (data_fabricacao, setor, forma);
CREATE INDEX IF NOT EXISTS producao_status_data_idx
    ON producao (status, data_fabricacao);

CREATE TABLE IF NOT EXISTS montagem_poste (
    id text PRIMARY KEY,
    record_id text,
    data_fabricacao date,
    setor text,
    forma_numero text,
    modelo text,
    status_montagem text,
    motivo_recusa text,
    etapa text,
    inicio_inspecao_montagem timestamptz,
    finalizado_em timestamptz,
    checklists jsonb,
    banco text,
    observacoes_montagem text,
    montador_nome text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS montagem_poste_data_setor_idx
    ON montagem_poste (data_fabricacao, setor);

CREATE TABLE IF NOT EXISTS formas_manutencao (
    id text PRIMARY KEY,
    setor text NOT NULL,
    forma_numero text NOT NULL,
    status text NOT NULL,
    motivo_parada text NOT NULL,
    acao_necessaria text NOT NULL,
    parada_em text NOT NULL,
    parada_por text NOT NULL,
    liberada_em text,
    liberada_por text,
    obs_liberacao text,
    updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS formas_manutencao_setor_forma_idx
    ON formas_manutencao (setor, forma_numero);

CREATE TABLE IF NOT EXISTS prog_s3_s4 (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    data date NOT NULL,
    forma text NOT NULL,
    setor text NOT NULL,
    modelo text NOT NULL,
    observacao text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS prog_s3_s4_data_setor_idx ON prog_s3_s4 (data, setor);

CREATE TABLE IF NOT EXISTS migration_audit (
    table_name text PRIMARY KEY,
    source_count bigint NOT NULL,
    imported_count bigint NOT NULL,
    exported_at timestamptz NOT NULL,
    imported_at timestamptz NOT NULL DEFAULT now(),
    source_id_sha256 text NOT NULL
);

COMMIT;
