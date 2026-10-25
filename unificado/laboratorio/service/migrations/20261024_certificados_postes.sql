-- Aplicar antes da nova API. A migração é aditiva e idempotente.
ALTER TABLE ensaio_postes.ensaio
    ADD COLUMN IF NOT EXISTS observacoes text NOT NULL DEFAULT '';

CREATE TABLE IF NOT EXISTS ensaio_postes.ensaio_anexo (
    id varchar(36) PRIMARY KEY,
    ensaio_id varchar(36) NOT NULL REFERENCES ensaio_postes.ensaio(id),
    nome_original varchar(200) NOT NULL,
    arquivo varchar(100) NOT NULL,
    tipo_mime varchar(80) NOT NULL,
    tamanho integer NOT NULL,
    criado_em timestamptz NOT NULL DEFAULT now(),
    criado_por varchar(80) NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_ensaio_anexo_ensaio ON ensaio_postes.ensaio_anexo(ensaio_id);

CREATE TABLE IF NOT EXISTS ensaio_postes.certificado_acesso (
    ensaio_id varchar(36) PRIMARY KEY REFERENCES ensaio_postes.ensaio(id),
    login varchar(80) NOT NULL UNIQUE,
    senha_hash varchar(200) NOT NULL,
    tentativas integer NOT NULL DEFAULT 0,
    bloqueado_ate timestamptz,
    criado_em timestamptz NOT NULL DEFAULT now(),
    criado_por varchar(80) NOT NULL
);
CREATE TABLE IF NOT EXISTS ensaio_postes.certificado_sessao (
    token_hash varchar(64) PRIMARY KEY,
    ensaio_id varchar(36) NOT NULL REFERENCES ensaio_postes.ensaio(id),
    expira_em timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_certificado_sessao_ensaio ON ensaio_postes.certificado_sessao(ensaio_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON ensaio_postes.ensaio_anexo,
    ensaio_postes.certificado_acesso, ensaio_postes.certificado_sessao TO postes_app;
