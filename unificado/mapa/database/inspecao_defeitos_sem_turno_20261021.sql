-- O turno saiu do formulário. O campo histórico permanece para registros antigos.
BEGIN;
ALTER TABLE public.inspecao_defeitos ALTER COLUMN turno DROP NOT NULL;
COMMIT;
