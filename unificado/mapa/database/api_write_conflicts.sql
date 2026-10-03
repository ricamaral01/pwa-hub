-- Chaves usadas por `on_conflict` no app.js original; somente Mapa de testes.
-- Auditoria prévia: zero grupos duplicados nas três combinações.
BEGIN;

CREATE UNIQUE INDEX IF NOT EXISTS programacao_pcp_data_setor_forma_unificado_uidx
  ON public.programacao_pcp (data_fabricacao, setor, forma);
CREATE UNIQUE INDEX IF NOT EXISTS liberacao_formas_data_setor_forma_unificado_uidx
  ON public.liberacao_formas (data_fabricacao, setor, forma);
CREATE UNIQUE INDEX IF NOT EXISTS prog_s3_s4_data_forma_setor_unificado_uidx
  ON public.prog_s3_s4 (data, forma, setor);

COMMIT;

NOTIFY pgrst, 'reload schema';
