BEGIN;
SET LOCAL statement_timeout='180s';
SET LOCAL lock_timeout='10s';
SET LOCAL check_function_bodies=false;
CREATE SCHEMA logistica;
CREATE TABLE logistica.ajudante (
    id bigint NOT NULL,
    nome text NOT NULL,
    unidade_id smallint NOT NULL,
    ativo boolean DEFAULT true NOT NULL,
    versao integer DEFAULT 1 NOT NULL
);
CREATE TABLE logistica.auditoria (
    id bigint NOT NULL,
    unidade_id smallint,
    ator text NOT NULL,
    ator_nome text NOT NULL,
    entidade text NOT NULL,
    entidade_id text NOT NULL,
    acao text NOT NULL,
    antes jsonb,
    depois jsonb,
    motivo text DEFAULT ''::text NOT NULL,
    criado_em timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE logistica.configuracao_unidade (
    unidade_id smallint NOT NULL,
    habilitado boolean DEFAULT false NOT NULL
);
CREATE TABLE logistica.estatistica_mensal (
    id bigint NOT NULL,
    mes_id bigint NOT NULL,
    unidade_id smallint NOT NULL,
    competencia date NOT NULL,
    motorista_id bigint NOT NULL,
    km numeric NOT NULL,
    eventos jsonb NOT NULL,
    correcoes jsonb DEFAULT '{}'::jsonb NOT NULL,
    excluido boolean DEFAULT false NOT NULL,
    motivo text DEFAULT ''::text NOT NULL,
    importacao_id bigint,
    versao integer DEFAULT 1 NOT NULL,
    origem text DEFAULT 'cobli'::text NOT NULL,
    dados_origem jsonb DEFAULT '{}'::jsonb NOT NULL,
    correcoes_origem jsonb DEFAULT '{}'::jsonb NOT NULL,
    oficial_eventos integer,
    oficial_kmev numeric,
    tem_correcao_manual boolean DEFAULT false NOT NULL,
    ordem_origem integer DEFAULT 0 NOT NULL,
    removido boolean DEFAULT false NOT NULL,
    CONSTRAINT estatistica_mensal_km_check CHECK ((km >= (0)::numeric)),
    CONSTRAINT estatistica_mensal_oficial_eventos_check CHECK ((oficial_eventos >= 0)),
    CONSTRAINT estatistica_mensal_oficial_kmev_check CHECK ((oficial_kmev >= (0)::numeric))
);
CREATE TABLE logistica.exclusao_nominal (
    id bigint NOT NULL,
    competencia date NOT NULL,
    unidade_id smallint,
    nome text NOT NULL,
    nome_chave text NOT NULL,
    origem text DEFAULT 'manual'::text NOT NULL,
    motivo text DEFAULT ''::text NOT NULL,
    ativo boolean DEFAULT true NOT NULL,
    versao integer DEFAULT 1 NOT NULL
);
CREATE TABLE logistica.fechamento_mes (
    id bigint NOT NULL,
    mes_id bigint NOT NULL,
    unidade_id smallint NOT NULL,
    snapshot jsonb NOT NULL,
    sha256 character varying(64) NOT NULL,
    criado_por text NOT NULL,
    criado_em timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE logistica.grupo_cobli_pendente (
    grupo_chave text NOT NULL,
    grupo text NOT NULL,
    unidade_origem smallint,
    visto_em timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE logistica.grupo_cobli_unidade (
    id bigint NOT NULL,
    grupo text NOT NULL,
    grupo_chave text NOT NULL,
    unidade_id smallint NOT NULL,
    ativo boolean DEFAULT true NOT NULL,
    versao integer DEFAULT 1 NOT NULL
);
CREATE TABLE logistica.importacao (
    id bigint NOT NULL,
    unidade_id smallint NOT NULL,
    competencia date NOT NULL,
    nome_arquivo text NOT NULL,
    arquivo text NOT NULL,
    sha256 character varying(64) NOT NULL,
    tamanho bigint NOT NULL,
    tipo_velocidade text NOT NULL,
    periodo_inicio date NOT NULL,
    periodo_fim date NOT NULL,
    status text DEFAULT 'previa'::text NOT NULL,
    linhas jsonb NOT NULL,
    versao_mes integer NOT NULL,
    criado_por text NOT NULL,
    criado_em timestamp with time zone DEFAULT now() NOT NULL,
    confirmado_em timestamp with time zone,
    parser_versao text DEFAULT '1'::text NOT NULL,
    CONSTRAINT importacao_status_check CHECK ((status = ANY (ARRAY['previa'::text, 'confirmada'::text, 'cancelada'::text, 'diferenca'::text])))
);
CREATE TABLE logistica.mes_unidade (
    id bigint NOT NULL,
    unidade_id smallint NOT NULL,
    competencia date NOT NULL,
    status text DEFAULT 'aberto'::text NOT NULL,
    meta numeric NOT NULL,
    versao integer DEFAULT 1 NOT NULL,
    fechado_em timestamp with time zone,
    fechado_por text,
    CONSTRAINT mes_unidade_competencia_check CHECK ((EXTRACT(day FROM competencia) = (1)::numeric)),
    CONSTRAINT mes_unidade_meta_check CHECK ((meta > (0)::numeric)),
    CONSTRAINT mes_unidade_status_check CHECK ((status = ANY (ARRAY['aberto'::text, 'fechado'::text])))
);
CREATE TABLE logistica.meta_trimestral (
    id bigint NOT NULL,
    trimestre text NOT NULL,
    unidade_id smallint NOT NULL,
    meta numeric NOT NULL,
    versao integer DEFAULT 1 NOT NULL,
    atualizado_por text NOT NULL,
    atualizado_em timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT meta_trimestral_meta_check CHECK (((meta > (0)::numeric) AND (meta = trunc(meta)))),
    CONSTRAINT meta_trimestral_trimestre_check CHECK ((trimestre ~ '^20[0-9]{2}-T[1-4]$'::text))
);
CREATE TABLE logistica.meta_trimestre_estado (
    trimestre text NOT NULL,
    fechado boolean NOT NULL,
    versao integer DEFAULT 1 NOT NULL,
    atualizado_por text NOT NULL,
    atualizado_em timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT meta_trimestre_estado_trimestre_check CHECK ((trimestre ~ '^20[0-9]{2}-T[1-4]$'::text)),
    CONSTRAINT meta_trimestre_estado_versao_check CHECK ((versao > 0))
);
CREATE TABLE logistica.migracao_lote (
    id bigint NOT NULL,
    sha256 character varying(64) NOT NULL,
    origem text NOT NULL,
    resultado jsonb NOT NULL,
    criado_por text NOT NULL,
    criado_em timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE logistica.motorista (
    id bigint NOT NULL,
    nome text NOT NULL,
    nome_chave text NOT NULL,
    cobli_driver_id text,
    unidade_id smallint NOT NULL,
    unidade_manual boolean DEFAULT false NOT NULL,
    ativo boolean DEFAULT true NOT NULL,
    versao integer DEFAULT 1 NOT NULL,
    criado_em timestamp with time zone DEFAULT now() NOT NULL,
    participa_premiacao boolean DEFAULT true NOT NULL
);
CREATE TABLE logistica.parametro_premiacao (
    id bigint NOT NULL,
    trimestre text NOT NULL,
    versao integer NOT NULL,
    parametros jsonb NOT NULL,
    criado_por text NOT NULL,
    criado_em timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE logistica.premiacao (
    id bigint NOT NULL,
    trimestre text NOT NULL,
    escopo text NOT NULL,
    unidade_id smallint,
    status text DEFAULT 'rascunho'::text NOT NULL,
    entradas jsonb DEFAULT '{}'::jsonb NOT NULL,
    parametro_id bigint,
    snapshot jsonb,
    versao integer DEFAULT 1 NOT NULL,
    aprovado_por text,
    aprovado_em timestamp with time zone,
    CONSTRAINT premiacao_status_check CHECK ((status = ANY (ARRAY['rascunho'::text, 'aprovada'::text])))
);
CREATE TABLE public.alembic_version_logistica (
    version_num character varying(32) NOT NULL
);
ALTER TABLE logistica.ajudante ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME logistica.ajudante_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);
ALTER TABLE logistica.auditoria ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME logistica.auditoria_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);
ALTER TABLE logistica.estatistica_mensal ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME logistica.estatistica_mensal_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);
ALTER TABLE logistica.exclusao_nominal ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME logistica.exclusao_nominal_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);
ALTER TABLE logistica.fechamento_mes ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME logistica.fechamento_mes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);
ALTER TABLE logistica.grupo_cobli_unidade ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME logistica.grupo_cobli_unidade_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);
ALTER TABLE logistica.importacao ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME logistica.importacao_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);
ALTER TABLE logistica.mes_unidade ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME logistica.mes_unidade_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);
ALTER TABLE logistica.meta_trimestral ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME logistica.meta_trimestral_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);
ALTER TABLE logistica.migracao_lote ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME logistica.migracao_lote_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);
ALTER TABLE logistica.motorista ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME logistica.motorista_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);
ALTER TABLE logistica.parametro_premiacao ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME logistica.parametro_premiacao_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);
ALTER TABLE logistica.premiacao ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME logistica.premiacao_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);
ALTER SEQUENCE public.apontamentos_mega_id_seq OWNED BY public.apontamentos_mega.id;
ALTER SEQUENCE public.atividades_mao_de_obra_id_seq OWNED BY public.atividades_mao_de_obra.id;
ALTER SEQUENCE public.etiquetas_armaduras_modelos_id_seq OWNED BY public.etiquetas_armaduras_modelos.id;
ALTER SEQUENCE public.formas_id_seq OWNED BY public.formas.id;
ALTER SEQUENCE public.maodeobra_id_seq OWNED BY public.maodeobra.id;
ALTER SEQUENCE public.maodeobra_rateio_id_seq OWNED BY public.maodeobra_rateio.id;
ALTER SEQUENCE public.mapeamento_forma_acessorios_id_seq OWNED BY public.mapeamento_forma_acessorios.id;
ALTER SEQUENCE public.mapeamento_forma_postes_id_seq OWNED BY public.mapeamento_forma_postes.id;
ALTER SEQUENCE public.mapeamento_formas_id_seq OWNED BY public.mapeamento_formas.id;
ALTER SEQUENCE public.producoes_id_seq OWNED BY public.producoes.id;
ALTER SEQUENCE public.produtos_id_seq OWNED BY public.produtos.id;
ALTER SEQUENCE public.programacoes_alex_id_seq OWNED BY public.programacoes_alex.id;
ALTER SEQUENCE public.programacoes_circular_s3_id_seq OWNED BY public.programacoes_circular_s3.id;
ALTER SEQUENCE public.programacoes_circular_s4_id_seq OWNED BY public.programacoes_circular_s4.id;
ALTER SEQUENCE public.programacoes_id_seq OWNED BY public.programacoes.id;
ALTER SEQUENCE public.saques_mandril_id_seq OWNED BY public.saques_mandril.id;
ALTER SEQUENCE public.setores_id_seq OWNED BY public.setores.id;
ALTER SEQUENCE public.teste_programacoes_id_seq OWNED BY public.teste_programacoes.id;
ALTER SEQUENCE public.usuarios_id_seq OWNED BY public.usuarios.id;
CREATE OR REPLACE VIEW armacao.v_rastreio_poste AS
 SELECT ca.unidade_id,
    ca.poste_serie,
    ca.concretagem_origem,
    ca.concretagem_ref,
    al.codigo AS armadura_codigo,
    lc.codigo AS feixe_codigo,
    b.id AS bobina_id,
    b.corrida,
    b.fornecedor,
    b.norma,
    b.foto_path
   FROM ((((armacao.concretagem_armadura ca
     JOIN armacao.armadura_lote al ON ((al.id = ca.armadura_lote_id)))
     JOIN armacao.armacao_consumo c ON ((c.apontamento_id = al.apontamento_id)))
     JOIN armacao.aco_lote_corte lc ON ((lc.id = c.lote_corte_id)))
     JOIN armacao.aco_bobina b ON ((b.id = lc.bobina_id)));
ALTER TABLE ONLY logistica.ajudante
    ADD CONSTRAINT ajudante_pkey PRIMARY KEY (id);
ALTER TABLE ONLY logistica.auditoria
    ADD CONSTRAINT auditoria_pkey PRIMARY KEY (id);
ALTER TABLE ONLY logistica.configuracao_unidade
    ADD CONSTRAINT configuracao_unidade_pkey PRIMARY KEY (unidade_id);
ALTER TABLE ONLY logistica.estatistica_mensal
    ADD CONSTRAINT estatistica_mensal_competencia_motorista_id_key UNIQUE (competencia, motorista_id);
ALTER TABLE ONLY logistica.estatistica_mensal
    ADD CONSTRAINT estatistica_mensal_pkey PRIMARY KEY (id);
ALTER TABLE ONLY logistica.exclusao_nominal
    ADD CONSTRAINT exclusao_nominal_competencia_unidade_id_nome_chave_key UNIQUE NULLS NOT DISTINCT (competencia, unidade_id, nome_chave);
ALTER TABLE ONLY logistica.exclusao_nominal
    ADD CONSTRAINT exclusao_nominal_pkey PRIMARY KEY (id);
ALTER TABLE ONLY logistica.fechamento_mes
    ADD CONSTRAINT fechamento_mes_mes_id_key UNIQUE (mes_id);
ALTER TABLE ONLY logistica.fechamento_mes
    ADD CONSTRAINT fechamento_mes_pkey PRIMARY KEY (id);
ALTER TABLE ONLY logistica.grupo_cobli_pendente
    ADD CONSTRAINT grupo_cobli_pendente_pkey PRIMARY KEY (grupo_chave);
ALTER TABLE ONLY logistica.grupo_cobli_unidade
    ADD CONSTRAINT grupo_cobli_unidade_grupo_chave_key UNIQUE (grupo_chave);
ALTER TABLE ONLY logistica.grupo_cobli_unidade
    ADD CONSTRAINT grupo_cobli_unidade_pkey PRIMARY KEY (id);
ALTER TABLE ONLY logistica.importacao
    ADD CONSTRAINT importacao_pkey PRIMARY KEY (id);
ALTER TABLE ONLY logistica.mes_unidade
    ADD CONSTRAINT mes_unidade_id_unidade_id_competencia_key UNIQUE (id, unidade_id, competencia);
ALTER TABLE ONLY logistica.mes_unidade
    ADD CONSTRAINT mes_unidade_pkey PRIMARY KEY (id);
ALTER TABLE ONLY logistica.mes_unidade
    ADD CONSTRAINT mes_unidade_unidade_id_competencia_key UNIQUE (unidade_id, competencia);
ALTER TABLE ONLY logistica.meta_trimestral
    ADD CONSTRAINT meta_trimestral_pkey PRIMARY KEY (id);
ALTER TABLE ONLY logistica.meta_trimestral
    ADD CONSTRAINT meta_trimestral_trimestre_unidade_id_key UNIQUE (trimestre, unidade_id);
ALTER TABLE ONLY logistica.meta_trimestre_estado
    ADD CONSTRAINT meta_trimestre_estado_pkey PRIMARY KEY (trimestre);
ALTER TABLE ONLY logistica.migracao_lote
    ADD CONSTRAINT migracao_lote_pkey PRIMARY KEY (id);
ALTER TABLE ONLY logistica.migracao_lote
    ADD CONSTRAINT migracao_lote_sha256_key UNIQUE (sha256);
ALTER TABLE ONLY logistica.motorista
    ADD CONSTRAINT motorista_cobli_driver_id_key UNIQUE (cobli_driver_id);
ALTER TABLE ONLY logistica.motorista
    ADD CONSTRAINT motorista_pkey PRIMARY KEY (id);
ALTER TABLE ONLY logistica.parametro_premiacao
    ADD CONSTRAINT parametro_premiacao_pkey PRIMARY KEY (id);
ALTER TABLE ONLY logistica.parametro_premiacao
    ADD CONSTRAINT parametro_premiacao_trimestre_versao_key UNIQUE (trimestre, versao);
ALTER TABLE ONLY logistica.premiacao
    ADD CONSTRAINT premiacao_pkey PRIMARY KEY (id);
ALTER TABLE ONLY logistica.premiacao
    ADD CONSTRAINT premiacao_trimestre_escopo_key UNIQUE (trimestre, escopo);
ALTER TABLE ONLY public.alembic_version_logistica
    ADD CONSTRAINT alembic_version_logistica_pkc PRIMARY KEY (version_num);
CREATE INDEX auditoria_unidade_id_criado_em_idx ON logistica.auditoria USING btree (unidade_id, criado_em DESC);
CREATE INDEX estatistica_mensal_unidade_id_competencia_idx ON logistica.estatistica_mensal USING btree (unidade_id, competencia);
CREATE INDEX motorista_nome_chave_idx ON logistica.motorista USING btree (nome_chave);
ALTER TABLE ONLY logistica.ajudante
    ADD CONSTRAINT ajudante_unidade_id_fkey FOREIGN KEY (unidade_id) REFERENCES producao.unidade(id);
ALTER TABLE ONLY logistica.auditoria
    ADD CONSTRAINT auditoria_unidade_id_fkey FOREIGN KEY (unidade_id) REFERENCES producao.unidade(id);
ALTER TABLE ONLY logistica.configuracao_unidade
    ADD CONSTRAINT configuracao_unidade_unidade_id_fkey FOREIGN KEY (unidade_id) REFERENCES producao.unidade(id);
ALTER TABLE ONLY logistica.estatistica_mensal
    ADD CONSTRAINT estatistica_mensal_importacao_id_fkey FOREIGN KEY (importacao_id) REFERENCES logistica.importacao(id);
ALTER TABLE ONLY logistica.estatistica_mensal
    ADD CONSTRAINT estatistica_mensal_mes_id_unidade_id_competencia_fkey FOREIGN KEY (mes_id, unidade_id, competencia) REFERENCES logistica.mes_unidade(id, unidade_id, competencia);
ALTER TABLE ONLY logistica.estatistica_mensal
    ADD CONSTRAINT estatistica_mensal_motorista_id_fkey FOREIGN KEY (motorista_id) REFERENCES logistica.motorista(id);
ALTER TABLE ONLY logistica.exclusao_nominal
    ADD CONSTRAINT exclusao_nominal_unidade_id_fkey FOREIGN KEY (unidade_id) REFERENCES producao.unidade(id);
ALTER TABLE ONLY logistica.fechamento_mes
    ADD CONSTRAINT fechamento_mes_mes_id_fkey FOREIGN KEY (mes_id) REFERENCES logistica.mes_unidade(id);
ALTER TABLE ONLY logistica.fechamento_mes
    ADD CONSTRAINT fechamento_mes_unidade_id_fkey FOREIGN KEY (unidade_id) REFERENCES producao.unidade(id);
ALTER TABLE ONLY logistica.grupo_cobli_pendente
    ADD CONSTRAINT grupo_cobli_pendente_unidade_origem_fkey FOREIGN KEY (unidade_origem) REFERENCES producao.unidade(id);
ALTER TABLE ONLY logistica.grupo_cobli_unidade
    ADD CONSTRAINT grupo_cobli_unidade_unidade_id_fkey FOREIGN KEY (unidade_id) REFERENCES producao.unidade(id);
ALTER TABLE ONLY logistica.importacao
    ADD CONSTRAINT importacao_unidade_id_fkey FOREIGN KEY (unidade_id) REFERENCES producao.unidade(id);
ALTER TABLE ONLY logistica.mes_unidade
    ADD CONSTRAINT mes_unidade_unidade_id_fkey FOREIGN KEY (unidade_id) REFERENCES producao.unidade(id);
ALTER TABLE ONLY logistica.meta_trimestral
    ADD CONSTRAINT meta_trimestral_unidade_id_fkey FOREIGN KEY (unidade_id) REFERENCES producao.unidade(id);
ALTER TABLE ONLY logistica.motorista
    ADD CONSTRAINT motorista_unidade_id_fkey FOREIGN KEY (unidade_id) REFERENCES producao.unidade(id);
ALTER TABLE ONLY logistica.premiacao
    ADD CONSTRAINT premiacao_parametro_id_fkey FOREIGN KEY (parametro_id) REFERENCES logistica.parametro_premiacao(id);
ALTER TABLE ONLY logistica.premiacao
    ADD CONSTRAINT premiacao_unidade_id_fkey FOREIGN KEY (unidade_id) REFERENCES producao.unidade(id);
COMMIT;