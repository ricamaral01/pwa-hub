-- Aplicar somente no PostgreSQL do unificado, apos backup com restauracao testada.
-- Fonte: supabase/migrations/202608280001_create_prog_s3_s4.sql e
-- mapa-concretagem/supabase-formas-manutencao.sql. Nao altera dados.
BEGIN;
ALTER TABLE public.prog_s3_s4
  ADD CONSTRAINT prog_s3_s4_setor_check CHECK (setor IN ('Setor 3', 'Setor 4'));
CREATE OR REPLACE FUNCTION public.set_prog_s3_s4_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_prog_s3_s4_updated_at
  BEFORE UPDATE ON public.prog_s3_s4
  FOR EACH ROW EXECUTE FUNCTION public.set_prog_s3_s4_updated_at();
ALTER TABLE public.formas_manutencao
  ADD CONSTRAINT formas_manutencao_status_check CHECK (status IN ('PARADA', 'LIBERADA'));
CREATE INDEX idx_formas_manutencao_status ON public.formas_manutencao(status);
CREATE INDEX idx_formas_manutencao_updated_at ON public.formas_manutencao(updated_at DESC);
COMMIT;
