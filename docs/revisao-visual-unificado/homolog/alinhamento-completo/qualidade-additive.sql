BEGIN;
SET LOCAL statement_timeout='180s';
SET LOCAL lock_timeout='10s';
SET LOCAL check_function_bodies=false;
CREATE OR REPLACE FUNCTION qualidade.nc_evento_imutavel() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN RAISE EXCEPTION 'nc_evento é imutável'; END; $$;
CREATE OR REPLACE FUNCTION qualidade.reject_numbering_while_frozen() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'pg_catalog', 'qualidade'
    AS $$
    DECLARE frozen boolean;
    BEGIN
      SELECT enabled INTO frozen FROM qualidade.nc_numbering_control WHERE id = 1;
      IF NOT frozen THEN
        RETURN NEW;
      END IF;
      -- Only the official C1 transaction run as postgres may allocate numbers.
      IF session_user = 'postgres'
         AND current_setting('qualidade.c1_import', true) = 'on' THEN
        RETURN NEW;
      END IF;
      IF TG_TABLE_NAME = 'nc_numero_contador'
         AND session_user = 'postgres'
         AND current_setting('qualidade.synthetic_cleanup', true) = 'on' THEN
        RETURN NEW;
      END IF;
      IF TG_TABLE_NAME = 'nc_numero_contador' THEN
        RAISE EXCEPTION 'Numeração de NC temporariamente suspensa' USING ERRCODE = '55000';
      END IF;
      IF TG_OP = 'INSERT' THEN
        IF NEW.numero IS NOT NULL THEN
          RAISE EXCEPTION 'Numeração de NC temporariamente suspensa' USING ERRCODE = '55000';
        END IF;
      ELSIF NEW.numero IS NOT NULL AND OLD.numero IS DISTINCT FROM NEW.numero THEN
        RAISE EXCEPTION 'Numeração de NC temporariamente suspensa' USING ERRCODE = '55000';
      END IF;
      RETURN NEW;
    END $$;
CREATE OR REPLACE FUNCTION qualidade.tarefa_immutable_guard() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
      BEGIN RAISE EXCEPTION 'Registro de auditoria imutável'; END $$;
CREATE TABLE qualidade.nc_formulario_rev3 (
    nc_id uuid NOT NULL,
    etapa text DEFAULT 'ABERTO'::text NOT NULL,
    decisao text,
    origens jsonb DEFAULT '[]'::jsonb NOT NULL,
    area_sistema text,
    dados jsonb DEFAULT '{}'::jsonb NOT NULL,
    assinaturas jsonb DEFAULT '{}'::jsonb NOT NULL,
    numero_anterior_id uuid,
    novo_rnc_id uuid,
    numero_sistema_anterior text,
    criado_em timestamp with time zone DEFAULT now() NOT NULL,
    atualizado_em timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT nc_formulario_rev3_area_sistema_check CHECK ((area_sistema = ANY (ARRAY['Qual.'::text, 'M.A.'::text, 'SST'::text]))),
    CONSTRAINT nc_formulario_rev3_decisao_check CHECK ((decisao = ANY (ARRAY['SIM'::text, 'NAO'::text]))),
    CONSTRAINT nc_rev3_etapa_check CHECK ((etapa = ANY (ARRAY['ABERTO'::text, 'DISPOSICAO'::text, 'EQUIPE_DECISAO'::text, 'ANALISE_CAUSAS'::text, 'ACAO_CORRETIVA'::text, 'ACOMPANHAMENTO'::text, 'EFICACIA'::text, 'ENCERRADO_DECISAO'::text, 'ENCERRADO_EFICAZ'::text, 'ENCERRADO_INEFICAZ'::text])))
);
CREATE TABLE qualidade.nc_numero_rev3 (
    ano integer NOT NULL,
    ultimo_numero integer NOT NULL,
    CONSTRAINT nc_numero_rev3_ultimo_numero_check CHECK (((ultimo_numero >= 0) AND (ultimo_numero <= 99)))
);
ALTER TABLE ONLY qualidade.nc_formulario_rev3
    ADD CONSTRAINT nc_formulario_rev3_pkey PRIMARY KEY (nc_id);
ALTER TABLE ONLY qualidade.nc_numero_rev3
    ADD CONSTRAINT nc_numero_rev3_pkey PRIMARY KEY (ano);
CREATE INDEX nc_rev3_etapa_idx ON qualidade.nc_formulario_rev3 USING btree (etapa);
ALTER TABLE ONLY qualidade.nc_formulario_rev3
    ADD CONSTRAINT nc_formulario_rev3_nc_id_fkey FOREIGN KEY (nc_id) REFERENCES qualidade.nc(id) ON DELETE CASCADE;
ALTER TABLE ONLY qualidade.nc_formulario_rev3
    ADD CONSTRAINT nc_formulario_rev3_novo_rnc_id_fkey FOREIGN KEY (novo_rnc_id) REFERENCES qualidade.nc(id);
ALTER TABLE ONLY qualidade.nc_formulario_rev3
    ADD CONSTRAINT nc_formulario_rev3_numero_anterior_id_fkey FOREIGN KEY (numero_anterior_id) REFERENCES qualidade.nc(id);
COMMIT;