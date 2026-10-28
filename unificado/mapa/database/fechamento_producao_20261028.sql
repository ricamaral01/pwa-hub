-- Conferência final por forma em Campinas. Os apontamentos originais permanecem intactos.
BEGIN;

CREATE TABLE IF NOT EXISTS public.fechamento_producao_confirmacoes (
    data_fabricacao date NOT NULL,
    setor text NOT NULL CHECK (setor IN ('Setor 1','Setor 2','Setor 3','Setor 4')),
    forma text NOT NULL,
    forma_chave text NOT NULL,
    producao_id uuid NOT NULL,
    confirmado_por text NOT NULL CHECK (confirmado_por = 'jcarlos'),
    confirmado_em timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (data_fabricacao, setor, forma_chave, producao_id)
);

CREATE INDEX IF NOT EXISTS fechamento_producao_confirmacoes_dia_setor_idx
    ON public.fechamento_producao_confirmacoes (data_fabricacao, setor, confirmado_em);

GRANT SELECT, INSERT ON public.fechamento_producao_confirmacoes TO mapa_api_writer;

COMMIT;
