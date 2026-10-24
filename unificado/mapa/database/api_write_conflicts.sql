-- Chaves de negocio confirmadas no catalogo ao vivo da origem, 05/10/2026.
-- Evita recriar os antigos indices *_unificado_uidx depois da reconciliacao.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='programacao_pcp_data_fabricacao_setor_forma_key') THEN
    ALTER TABLE public.programacao_pcp ADD CONSTRAINT programacao_pcp_data_fabricacao_setor_forma_key
      UNIQUE (data_fabricacao, setor, forma);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='liberacao_formas_data_fabricacao_setor_forma_key') THEN
    ALTER TABLE public.liberacao_formas ADD CONSTRAINT liberacao_formas_data_fabricacao_setor_forma_key
      UNIQUE (data_fabricacao, setor, forma);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='prog_s3_s4_unique') THEN
    ALTER TABLE public.prog_s3_s4 ADD CONSTRAINT prog_s3_s4_unique
      UNIQUE (data, forma, setor);
  END IF;
END $$;
NOTIFY pgrst, 'reload schema';
