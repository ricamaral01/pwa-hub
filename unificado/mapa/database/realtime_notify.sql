-- Aplicar somente em mapa_unificado_teste, após backup restaurado em banco temporário.
-- O app.js oficial assina exatamente estas duas tabelas pelo protocolo Realtime.
BEGIN;
CREATE OR REPLACE FUNCTION public.unificado_notify_mapa_change() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  payload jsonb;
BEGIN
  payload := jsonb_build_object(
    'schema', 'public',
    'table', TG_TABLE_NAME,
    'type', TG_OP,
    'commit_timestamp', to_char(clock_timestamp() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
    'record', CASE WHEN TG_OP = 'DELETE' THEN '{}'::jsonb ELSE to_jsonb(NEW) END,
    'old_record', CASE WHEN TG_OP = 'INSERT' THEN '{}'::jsonb ELSE to_jsonb(OLD) END
  );
  PERFORM pg_notify('unificado_mapa_changes', payload::text);
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$;

DROP TRIGGER IF EXISTS unificado_realtime_producao ON public.producao;
CREATE TRIGGER unificado_realtime_producao
AFTER INSERT OR UPDATE OR DELETE ON public.producao
FOR EACH ROW EXECUTE FUNCTION public.unificado_notify_mapa_change();

DROP TRIGGER IF EXISTS unificado_realtime_manutencao ON public.formas_manutencao;
CREATE TRIGGER unificado_realtime_manutencao
AFTER INSERT OR UPDATE OR DELETE ON public.formas_manutencao
FOR EACH ROW EXECUTE FUNCTION public.unificado_notify_mapa_change();
COMMIT;
