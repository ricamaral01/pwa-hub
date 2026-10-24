-- Fail closed: nenhuma operacao entra/parte sem habilitacao por acao.
BEGIN;
CREATE OR REPLACE FUNCTION usinas_write.require_permission()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE enabled boolean;
BEGIN
    IF TG_OP = 'INSERT' OR (OLD.estado <> 'enviando' AND NEW.estado = 'enviando') THEN
        SELECT despacho_habilitado INTO enabled
        FROM usinas_write.permissions
        WHERE unidade_id = NEW.unidade_id
          AND origem_tabela = NEW.origem_tabela
          AND acao = NEW.acao
        FOR SHARE;
        IF enabled IS DISTINCT FROM true THEN
            RAISE EXCEPTION 'Escrita de Usinas desabilitada para %.%.%',
                NEW.unidade_id, NEW.origem_tabela, NEW.acao
                USING ERRCODE = '42501';
        END IF;
    END IF;
    NEW.atualizado_em := now();
    RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS outbox_permission_guard ON usinas_write.outbox;
CREATE TRIGGER outbox_permission_guard
BEFORE INSERT OR UPDATE ON usinas_write.outbox
FOR EACH ROW EXECUTE FUNCTION usinas_write.require_permission();
COMMIT;
