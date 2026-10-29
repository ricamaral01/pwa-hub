CREATE TABLE IF NOT EXISTS public.odin_reversoes (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    revertido_em timestamptz NOT NULL DEFAULT now(),
    data_fabricacao date NOT NULL,
    setor text NOT NULL,
    forma text NOT NULL,
    acao text NOT NULL,
    tabela text NOT NULL,
    registro_id text NOT NULL,
    registro_anterior jsonb NOT NULL,
    motivo text NOT NULL,
    usuario_id text NOT NULL,
    usuario_nome text NOT NULL
);
CREATE INDEX IF NOT EXISTS odin_reversoes_forma_idx ON public.odin_reversoes
    (data_fabricacao, setor, forma, revertido_em DESC);
GRANT INSERT, SELECT ON public.odin_reversoes TO mapa_api_writer;
GRANT USAGE, SELECT ON SEQUENCE public.odin_reversoes_id_seq TO mapa_api_writer;
GRANT DELETE ON public.fechamento_producao_confirmacoes TO mapa_api_writer;
