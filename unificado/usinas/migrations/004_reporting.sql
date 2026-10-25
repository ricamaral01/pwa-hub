BEGIN;
DO $$ BEGIN IF current_database() <> 'mapa_unificado_teste'
THEN RAISE EXCEPTION 'Wrong reporting target'; END IF; END $$;
CREATE SCHEMA IF NOT EXISTS usinas_reporting;
REVOKE ALL ON SCHEMA usinas_reporting FROM PUBLIC;
CREATE TABLE IF NOT EXISTS usinas_reporting.tbl_config_traco_campo (
    "id" integer NOT NULL,
    "coluna" text NOT NULL,
    "label" text NOT NULL,
    "material_id" integer,
    "ativo" boolean NOT NULL,
    "ordem" integer NOT NULL,
    PRIMARY KEY (id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON usinas_reporting.tbl_config_traco_campo TO "usinas-sync";
GRANT SELECT ON usinas_reporting.tbl_config_traco_campo TO mapa_api_login;
CREATE TABLE IF NOT EXISTS usinas_reporting.tbl_est_config_massada (
    "id" integer NOT NULL,
    "coluna" text NOT NULL,
    "label" text NOT NULL,
    "material_id" integer,
    "ativo" boolean NOT NULL,
    "ordem" integer NOT NULL,
    "fator_conversao" numeric NOT NULL,
    PRIMARY KEY (id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON usinas_reporting.tbl_est_config_massada TO "usinas-sync";
GRANT SELECT ON usinas_reporting.tbl_est_config_massada TO mapa_api_login;
CREATE TABLE IF NOT EXISTS usinas_reporting.tbl_est_custos_ajustes (
    "id" bigint NOT NULL,
    "material_id" integer NOT NULL,
    "valor_unitario" numeric(14,6) NOT NULL,
    "vigencia" date NOT NULL,
    "motivo" text NOT NULL,
    "responsavel" character varying(100),
    "created_at" timestamp with time zone NOT NULL,
    PRIMARY KEY (id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON usinas_reporting.tbl_est_custos_ajustes TO "usinas-sync";
GRANT SELECT ON usinas_reporting.tbl_est_custos_ajustes TO mapa_api_login;
CREATE TABLE IF NOT EXISTS usinas_reporting.tbl_est_materiais (
    "id" integer NOT NULL,
    "codigo" character varying(50) NOT NULL,
    "nome" character varying(200) NOT NULL,
    "categoria" character varying(50) NOT NULL,
    "unidade" character varying(20) NOT NULL,
    "saldo_inicial" numeric(16,3) NOT NULL,
    "ativo" boolean NOT NULL,
    "created_at" timestamp with time zone NOT NULL,
    PRIMARY KEY (id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON usinas_reporting.tbl_est_materiais TO "usinas-sync";
GRANT SELECT ON usinas_reporting.tbl_est_materiais TO mapa_api_login;
CREATE TABLE IF NOT EXISTS usinas_reporting.tbl_est_movimentos (
    "id" integer NOT NULL,
    "material_id" integer NOT NULL,
    "tipo" character varying(20) NOT NULL,
    "data" date NOT NULL,
    "quantidade" numeric(16,3) NOT NULL,
    "nota_fiscal" character varying(100),
    "fornecedor" character varying(200),
    "observacao" text,
    "responsavel" character varying(100),
    "origem" character varying(50) NOT NULL,
    "referencia_id" integer,
    "created_at" timestamp with time zone NOT NULL,
    "unidade" character varying(20),
    "silo_id" integer,
    "valor_nota" numeric(12,4),
    "icms_perc" numeric(5,2),
    "valor_frete" numeric(12,4),
    "icms_frete" numeric(12,4),
    "valor_unitario_liquido" numeric(12,4),
    PRIMARY KEY (id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON usinas_reporting.tbl_est_movimentos TO "usinas-sync";
GRANT SELECT ON usinas_reporting.tbl_est_movimentos TO mapa_api_login;
CREATE TABLE IF NOT EXISTS usinas_reporting.tbl_massadas (
    "id" integer NOT NULL,
    "produto" text NOT NULL,
    "formula" text NOT NULL,
    "qtd" numeric NOT NULL,
    "data" date,
    "hora" time without time zone,
    "data_hora" timestamp without time zone,
    "hora_inicio" time without time zone,
    "hora_final" time without time zone,
    "hora_descarga" time without time zone,
    "misturador" text,
    "numero_serie" numeric,
    "temperatura" double precision,
    "real_agregado1" numeric,
    "real_agregado2" numeric,
    "real_agregado3" numeric,
    "real_agregado4" numeric,
    "real_agregado5" numeric,
    "real_agregado6" numeric,
    "real_agregado7" numeric,
    "prog_agregado1" numeric,
    "prog_agregado2" numeric,
    "prog_agregado3" numeric,
    "prog_agregado4" numeric,
    "prog_agregado5" numeric,
    "prog_agregado6" numeric,
    "prog_agregado7" numeric,
    "ur1" numeric,
    "ur2" numeric,
    "ur3" numeric,
    "ur4" numeric,
    "ur5" numeric,
    "ur6" numeric,
    "ur7" numeric,
    "real_silo1" numeric,
    "real_silo2" numeric,
    "real_silo3" numeric,
    "real_silo4" numeric,
    "prog_silo1" numeric,
    "prog_silo2" numeric,
    "prog_silo3" numeric,
    "prog_silo4" numeric,
    "real_agua1" numeric,
    "prog_agua1" numeric,
    "real_aditivo1" numeric,
    "real_aditivo2" numeric,
    "real_aditivo3" numeric,
    "prog_aditivo1" numeric,
    "prog_aditivo2" numeric,
    "prog_aditivo3" numeric,
    "corte" numeric,
    "ac" double precision,
    "carregado" integer,
    "alterado" integer,
    "setor" text,
    "setor_atualizado_em" timestamp without time zone,
    "ativa" boolean NOT NULL,
    "redosa" integer NOT NULL,
    PRIMARY KEY (id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON usinas_reporting.tbl_massadas TO "usinas-sync";
GRANT SELECT ON usinas_reporting.tbl_massadas TO mapa_api_login;
CREATE TABLE IF NOT EXISTS usinas_reporting.tbl_nao_conformidades_apontadas (
    "id" integer NOT NULL,
    "data" date NOT NULL,
    "hora_apontamento" time without time zone NOT NULL,
    "turno" text,
    "tipo" text NOT NULL,
    "descricao" text NOT NULL,
    "acao_tomada" text,
    "criado_em" timestamp without time zone NOT NULL,
    PRIMARY KEY (id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON usinas_reporting.tbl_nao_conformidades_apontadas TO "usinas-sync";
GRANT SELECT ON usinas_reporting.tbl_nao_conformidades_apontadas TO mapa_api_login;
CREATE TABLE IF NOT EXISTS usinas_reporting.tbl_paradas_apontadas (
    "id" integer NOT NULL,
    "data" date NOT NULL,
    "hora_apontamento" time without time zone NOT NULL,
    "turno" text,
    "hora_inicio" time without time zone,
    "hora_fim" time without time zone,
    "minutos" numeric NOT NULL,
    "motivo" text NOT NULL,
    "m3_perdido" numeric NOT NULL,
    "criado_em" timestamp without time zone NOT NULL,
    PRIMARY KEY (id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON usinas_reporting.tbl_paradas_apontadas TO "usinas-sync";
GRANT SELECT ON usinas_reporting.tbl_paradas_apontadas TO mapa_api_login;
CREATE TABLE IF NOT EXISTS usinas_reporting.tbl_qrcp (
    "id" character varying(36) NOT NULL,
    "traco" character varying(200),
    "numero_serie" character varying(50),
    "nome" character varying(200),
    "cp" character varying(10),
    "idade" integer,
    "data_moldagem" date,
    "hora_moldagem" character varying(10),
    "data_ruptura" date,
    "qr_raw" text,
    "created_at" timestamp without time zone,
    "resistencia_mpa" numeric(10,2),
    PRIMARY KEY (id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON usinas_reporting.tbl_qrcp TO "usinas-sync";
GRANT SELECT ON usinas_reporting.tbl_qrcp TO mapa_api_login;
CREATE TABLE IF NOT EXISTS usinas_reporting.tbl_receitas (
    "id" bigint NOT NULL,
    "nome" text NOT NULL,
    "agregado1" numeric,
    "agregado2" numeric,
    "agregado3" numeric,
    "agregado4" numeric,
    "agregado5" numeric,
    "agregado6" numeric,
    "agregado7" numeric,
    "cimento1" numeric,
    "cimento2" numeric,
    "cimento3" numeric,
    "cimento4" numeric,
    "agua" numeric,
    "aditivo1" numeric,
    "aditivo2" numeric,
    "aditivo3" numeric,
    "ativa" boolean NOT NULL,
    "alterado" integer NOT NULL,
    "nome_traco" character varying NOT NULL,
    "cimento" numeric,
    "adicao_1" numeric,
    "adicao_2" numeric,
    "areia_1" numeric,
    "areia_2" numeric,
    "areia_3" numeric,
    "brita_1" numeric,
    "brita_2" numeric,
    "aditivo_1" numeric,
    "aditivo_2" numeric,
    "ac" numeric,
    "r24h" numeric,
    "r3" numeric,
    "r7" numeric,
    "r28" numeric,
    "created_at" timestamp without time zone,
    "revisao_grupo" uuid NOT NULL,
    "revisao_numero" integer NOT NULL,
    "revisao_origem_id" bigint,
    "observacao_revisao" text,
    "revisado_em" timestamp without time zone,
    "alterado_por" text,
    PRIMARY KEY (id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON usinas_reporting.tbl_receitas TO "usinas-sync";
GRANT SELECT ON usinas_reporting.tbl_receitas TO mapa_api_login;
GRANT USAGE ON SCHEMA usinas_reporting TO "usinas-sync", mapa_api_login;
COMMIT;
